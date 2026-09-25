import type { MetadataRoute } from "next";
import { getCategories, getResources, resourceHref } from "@/lib/resources";
import { absoluteUrl, isIndexingEnabled } from "@/lib/site";
import { informationPages } from '@/lib/information';

export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingEnabled()) return [];
  const [categories, resources] = await Promise.all([getCategories(), getResources()]);
  // Listing pages change when their newest article does; resources are sorted newest first.
  const latest = resources[0]?.updatedAt;
  return [
    { url: absoluteUrl("/"), lastModified: latest },
    { url: absoluteUrl("/resources"), lastModified: latest },
    ...Object.keys(informationPages).map((slug) => ({ url: absoluteUrl(`/${slug}`) })),
    ...categories.flatMap((category) => {
      const newest = resources.find((article) => article.category === category.slug);
      return newest ? [{ url: absoluteUrl(`/resources/${category.slug}`), lastModified: newest.updatedAt }] : [];
    }),
    ...resources.filter((article) => article.status === "ready").map((article) => ({ url: absoluteUrl(resourceHref(article)), lastModified: article.updatedAt, images: [...new Set([article.shareImage.src, ...(article.cover ? [article.cover.src] : [])])] })),
  ];
}
