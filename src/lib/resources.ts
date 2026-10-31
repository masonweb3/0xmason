import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getPayload, type Where } from 'payload';
import config from '@payload-config';
import type { Article, Category as CMSCategory, AffiliateLink, User } from '@/payload-types';
import { published } from '@/cms/access';
import { assetUrl, assetMetadata, isCDNImage, mediaImage, type ArticleImage } from './cdn';
import { heroBrands, type HeroBrand } from './brands';
import { publicContentCache } from '@/cms/content-cache';
import { articleMediaReferences, parseArticleContent } from './article-content';
import { nodeText } from '@/components/article-richtext';

export type CategorySlug = CMSCategory['slug'];
export type Category = Pick<CMSCategory, 'slug' | 'title' | 'summary' | 'description'>;
export type { ArticleImage } from './cdn';
export type PublicAffiliate = Pick<AffiliateLink, 'id' | 'name' | 'url' | 'label' | 'code' | 'active' | 'expiresAt'> & { available: boolean };
export type Resource = {
  id: number; slug: string; category: CategorySlug; title: string; summary: string;
  seoTitle: string; seoDescription: string; status: 'ready'; recordedAt: string; updatedAt: string;
  cover?: ArticleImage; shareImage: { src: string; width?: number; height?: number }; bodyFormat: Article['bodyFormat']; markdown: string;
  body: Article['body']; images: Record<string, ArticleImage>; hasAffiliate: boolean; affiliateLinks: PublicAffiliate[];
};
export type ResourceSummary = Pick<Resource, 'id' | 'slug' | 'category' | 'title' | 'summary' | 'seoTitle' | 'seoDescription' | 'status' | 'recordedAt' | 'updatedAt' | 'cover' | 'shareImage'>;
const summarySelect = { slug: true, category: true, title: true, summary: true, seoTitle: true, seoDescription: true, recordedAt: true, updatedAt: true, cover: true, shareImage: true, legacyShareImage: true } as const;
type SummaryArticle = Pick<Article, 'id' | keyof typeof summarySelect>;

function resourceSummary(article: SummaryArticle): ResourceSummary | undefined {
  if (typeof article.category !== 'object') return;
  const legacyImage = article.legacyShareImage && isCDNImage(article.legacyShareImage) ? article.legacyShareImage : undefined;
  const fallbackImage = assetUrl('images/social/mason.png');
  return {
    id: article.id, slug: article.slug, category: article.category.slug, title: article.title, summary: article.summary,
    seoTitle: article.seoTitle || article.title, seoDescription: article.seoDescription || article.summary,
    status: 'ready', recordedAt: article.recordedAt || '', updatedAt: article.updatedAt, cover: mediaImage(article.cover),
    shareImage: mediaImage(article.shareImage) || (legacyImage ? { src: legacyImage, ...assetMetadata(legacyImage) } : undefined) || mediaImage(article.cover) || { src: fallbackImage, ...assetMetadata(fallbackImage) },
  };
}

export const cms = cache(() => getPayload({ config }));
export const getCategories = cache(unstable_cache(async (): Promise<Category[]> => {
  const payload = await cms();
  const result = await payload.find({ collection: 'categories', sort: 'sortOrder', pagination: false, depth: 0, overrideAccess: false });
  return result.docs.map(({ slug, title, summary, description }) => ({ slug, title, summary, description }));
}, ['0xmason-categories-v1'], publicContentCache));

async function mapArticles(documents: Article[]): Promise<Resource[]> {
  if (!documents.length) return [];
  const payload = await cms();
  const linkIDs = [...new Set(documents.flatMap((article) => article.affiliateLinks?.map((link) => typeof link === 'number' ? link : link.id) || []))];
  // Resolve only links referenced by the authorized article result; return public fields below.
  const links = linkIDs.length ? (await payload.find({ collection: 'affiliate-links', where: { id: { in: linkIDs } }, pagination: false, depth: 0, overrideAccess: true })).docs : [];
  const linksByID = new Map(links.map((link) => [link.id, link]));
  const references = documents.map((article) => articleMediaReferences(article.markdown || '', article.sourceImageMap as Record<string, ArticleImage> || {}));
  const ids = [...new Set(references.flatMap((reference) => reference.ids))];
  const filenames = [...new Set(references.flatMap((reference) => reference.filenames))];
  const mediaWhere: Where[] = [...(ids.length ? [{ id: { in: ids } }] : []), ...(filenames.length ? [{ filename: { in: filenames } }] : [])];
  const media = mediaWhere.length ? (await payload.find({ collection: 'media', where: { or: mediaWhere }, pagination: false, depth: 0, overrideAccess: false })).docs : [];
  const imageMap: Record<string, ArticleImage> = {};
  const imagesByID = new Map<number, ArticleImage>();
  for (const item of media) {
    const image = mediaImage(item);
    if (image) { imageMap[image.src] = image; imagesByID.set(item.id, image); }
  }
  return documents.flatMap((article) => {
    const summary = resourceSummary(article);
    if (!summary) return [];
    const savedImages = article.sourceImageMap && typeof article.sourceImageMap === 'object' && !Array.isArray(article.sourceImageMap) ? article.sourceImageMap as Record<string, ArticleImage> : {};
    const sourceImages = Object.fromEntries(Object.entries(savedImages).map(([name, image]) => [name, image?.mediaId ? imagesByID.get(image.mediaId) : image] as const).filter(([, image]) => image && isCDNImage(image.src))) as Record<string, ArticleImage>;
    const linkedIDs = article.affiliateLinks?.map((link) => typeof link === 'number' ? link : link.id) || [];
    return [{
      ...summary,
      bodyFormat: article.bodyFormat, markdown: article.markdown || '', body: article.body,
      images: { ...imageMap, ...sourceImages }, hasAffiliate: Boolean(article.hasAffiliate || linkedIDs.length),
      affiliateLinks: linkedIDs.map((id) => linksByID.get(id)).filter((link) => link !== undefined).map(({ id, name, url, label, code, active, expiresAt }) => ({ id, name, url, label, code, active, expiresAt, available: Boolean(active && (!expiresAt || Date.parse(expiresAt) > Date.now())) })),
    }];
  });
}

export const getResources = cache(unstable_cache(async (): Promise<ResourceSummary[]> => {
  const payload = await cms();
  const result = await payload.find({ collection: 'articles', select: summarySelect, where: published, draft: false, depth: 1, pagination: false, sort: '-updatedAt', overrideAccess: false, joins: false });
  return result.docs.flatMap((article) => resourceSummary(article) || []);
}, ['0xmason-resource-summaries-v1'], publicContentCache));

const getBrands = unstable_cache(async () => {
  const payload = await cms();
  return (await payload.find({ collection: 'brands', sort: '-createdAt', pagination: false, depth: 1, populate: { articles: { slug: true } }, overrideAccess: true })).docs;
}, ['0xmason-brands-v1'], publicContentCache);
// Newest first. A failed query yields no brands so the homepage still renders between a deploy and its brands migration.
export const getHeroBrands = cache(async (): Promise<HeroBrand[]> => {
  try {
    const [brands, resources] = await Promise.all([
      getBrands(),
      getResources(),
    ]);
    return heroBrands(brands, new Set(resources.map((resource) => resource.id)));
  } catch (error) {
    console.error('Homepage brands are unavailable', error);
    return [];
  }
});
export async function getCategory(slug: string) { return (await getCategories()).find((category) => category.slug === slug); }
export const getCategoryResources = cache(unstable_cache(async (category: CategorySlug) => {
  const payload = await cms();
  const result = await payload.find({ collection: 'articles', select: { ...summarySelect, bodyFormat: true, markdown: true, body: true }, where: { and: [published, { 'category.slug': { equals: category } }] }, draft: false, depth: 1, pagination: false, sort: '-updatedAt', overrideAccess: false, joins: false });
  return result.docs.flatMap((article) => {
    const summary = resourceSummary(article);
    return summary ? [{ ...summary, readingMinutes: parseArticleContent(article.bodyFormat === 'markdown' ? article.markdown || '' : nodeText(article.body?.root || {})).readingMinutes }] : [];
  });
}, ['0xmason-category-resources-v1'], publicContentCache));

const getPublishedResource = unstable_cache(async (slug: string) => {
  const payload = await cms();
  const result = await payload.find({ collection: 'articles', where: { and: [published, { slug: { equals: slug } }] }, draft: false, depth: 2, limit: 1, overrideAccess: false, joins: false });
  return (await mapArticles(result.docs))[0] || null;
}, ['0xmason-resource-v1'], publicContentCache);

export const getResource = cache(async (category: string, slug: string) => {
  const resource = await getPublishedResource(slug);
  if (resource?.category !== category) return;
  // Expiry follows the clock even while the article data is cached.
  return { ...resource, affiliateLinks: resource.affiliateLinks.map((link) => ({ ...link, available: Boolean(link.active && (!link.expiresAt || Date.parse(link.expiresAt) > Date.now())) })) };
});
export async function getPreviewResource(id: number, user: User) {
  const payload = await cms();
  const result = await payload.find({ collection: 'articles', where: { id: { equals: id } }, draft: true, depth: 2, limit: 1, user, overrideAccess: false, joins: false });
  return (await mapArticles(result.docs))[0];
}
export function resourceHref(resource: Pick<Resource, 'category' | 'slug'>) { return `/resources/${resource.category}/${resource.slug}`; }
export function categoryCount(articles: ResourceSummary[], category: CategorySlug) {
  const count = articles.filter((article) => article.category === category).length;
  return count ? `${count} 篇文章` : '文章准备中';
}
