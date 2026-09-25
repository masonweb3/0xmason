import { cache } from 'react';
import { getPayload } from 'payload';
import config from '@payload-config';
import type { Article, Category as CMSCategory, Media, AffiliateLink, User } from '@/payload-types';
import { published } from '@/cms/access';
import { assetUrl, assetMetadata, isCDNImage, mediaUrl, type ImageSource } from './cdn';

export type CategorySlug = CMSCategory['slug'];
export type Category = Pick<CMSCategory, 'slug' | 'title' | 'summary' | 'description'>;
export type ArticleImage = { src: string; alt: string; width: number; height: number; mediaId?: number; sources?: ImageSource[] };
export type PublicAffiliate = Pick<AffiliateLink, 'id' | 'name' | 'url' | 'label' | 'code' | 'active' | 'expiresAt'> & { available: boolean };
export type Resource = {
  id: number; slug: string; category: CategorySlug; title: string; summary: string;
  seoTitle: string; seoDescription: string; status: 'ready'; recordedAt: string; updatedAt: string;
  cover?: ArticleImage; shareImage: { src: string; width?: number; height?: number }; bodyFormat: Article['bodyFormat']; markdown: string;
  body: Article['body']; images: Record<string, ArticleImage>; hasAffiliate: boolean; affiliateLinks: PublicAffiliate[];
};

export function mediaImage(media: number | Media | null | undefined): ArticleImage | undefined {
  if (!media || typeof media !== 'object' || !media.filename || !media.width || !media.height) return;
  const src = mediaUrl(media.filename, media.prefix || undefined);
  const sources = new Map<number, ImageSource>();
  for (const size of Object.values(media.sizes || {})) {
    if (size?.filename && size.width && size.width < media.width) sources.set(size.width, { src: mediaUrl(size.filename), width: size.width });
  }
  sources.set(media.width, { src, width: media.width });
  return { src, alt: media.alt, width: media.width, height: media.height, mediaId: media.id, sources: [...sources.values()] };
}

export const cms = cache(() => getPayload({ config }));
export const getCategories = cache(async (): Promise<Category[]> => {
  const payload = await cms();
  const result = await payload.find({ collection: 'categories', sort: 'sortOrder', pagination: false, depth: 0, overrideAccess: false });
  return result.docs.map(({ slug, title, summary, description }) => ({ slug, title, summary, description }));
});

async function mapArticles(documents: Article[]): Promise<Resource[]> {
  if (!documents.length) return [];
  const payload = await cms();
  const linkIDs = [...new Set(documents.flatMap((article) => article.affiliateLinks?.map((link) => typeof link === 'number' ? link : link.id) || []))];
  // Resolve only links referenced by the authorized article result; return public fields below.
  const links = linkIDs.length ? (await payload.find({ collection: 'affiliate-links', where: { id: { in: linkIDs } }, pagination: false, depth: 0, overrideAccess: true })).docs : [];
  const linksByID = new Map(links.map((link) => [link.id, link]));
  const media = await payload.find({ collection: 'media', pagination: false, depth: 0, overrideAccess: false });
  const imageMap: Record<string, ArticleImage> = {};
  const imagesByID = new Map<number, ArticleImage>();
  for (const item of media.docs) {
    const image = mediaImage(item);
    if (image) { imageMap[image.src] = image; imagesByID.set(item.id, image); }
  }
  return documents.flatMap((article) => {
    if (typeof article.category !== 'object') return [];
    const savedImages = article.sourceImageMap && typeof article.sourceImageMap === 'object' && !Array.isArray(article.sourceImageMap) ? article.sourceImageMap as Record<string, ArticleImage> : {};
    const sourceImages = Object.fromEntries(Object.entries(savedImages).map(([name, image]) => [name, image?.mediaId ? imagesByID.get(image.mediaId) : image] as const).filter(([, image]) => image && isCDNImage(image.src))) as Record<string, ArticleImage>;
    const linkedIDs = article.affiliateLinks?.map((link) => typeof link === 'number' ? link : link.id) || [];
    const legacyImage = article.legacyShareImage && isCDNImage(article.legacyShareImage) ? article.legacyShareImage : undefined;
    const fallbackImage = assetUrl('images/social/mason.png');
    const shareImage = mediaImage(article.shareImage)
      || (legacyImage ? { src: legacyImage, ...assetMetadata(legacyImage) } : undefined)
      || mediaImage(article.cover)
      || { src: fallbackImage, ...assetMetadata(fallbackImage) };
    return [{
      id: article.id, slug: article.slug, category: article.category.slug, title: article.title, summary: article.summary,
      seoTitle: article.seoTitle || article.title, seoDescription: article.seoDescription || article.summary,
      status: 'ready' as const, recordedAt: article.recordedAt || '', updatedAt: article.updatedAt,
      cover: mediaImage(article.cover), shareImage,
      bodyFormat: article.bodyFormat, markdown: article.markdown || '', body: article.body,
      images: { ...imageMap, ...sourceImages }, hasAffiliate: Boolean(article.hasAffiliate || linkedIDs.length),
      affiliateLinks: linkedIDs.map((id) => linksByID.get(id)).filter((link) => link !== undefined).map(({ id, name, url, label, code, active, expiresAt }) => ({ id, name, url, label, code, active, expiresAt, available: Boolean(active && (!expiresAt || Date.parse(expiresAt) > Date.now())) })),
    }];
  });
}

export const getResources = cache(async () => {
  const payload = await cms();
  const result = await payload.find({ collection: 'articles', where: published, draft: false, depth: 2, pagination: false, sort: '-updatedAt', overrideAccess: false });
  return mapArticles(result.docs);
});
export async function getCategory(slug: string) { return (await getCategories()).find((category) => category.slug === slug); }
export async function getCategoryResources(category: CategorySlug) { return (await getResources()).filter((resource) => resource.category === category); }
export async function getResource(category: string, slug: string) { return (await getResources()).find((resource) => resource.category === category && resource.slug === slug); }
export async function getPreviewResource(id: number, user: User) {
  const payload = await cms();
  const result = await payload.find({ collection: 'articles', where: { id: { equals: id } }, draft: true, depth: 2, limit: 1, user, overrideAccess: false });
  return (await mapArticles(result.docs))[0];
}
export function resourceHref(resource: Pick<Resource, 'category' | 'slug'>) { return `/resources/${resource.category}/${resource.slug}`; }
export function categoryCount(articles: Resource[], category: CategorySlug) {
  const count = articles.filter((article) => article.category === category).length;
  return count ? `${count} 篇文章` : '文章准备中';
}
