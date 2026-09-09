import type { MetadataRoute } from "next";
import { getCategories, getResources, resourceHref } from "@/lib/resources";
import { absoluteUrl, isIndexingEnabled } from "@/lib/site";

export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingEnabled()) return [];
  const [categories, resources] = await Promise.all([getCategories(), getResources()]);
  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/resources") },
    ...categories.filter((category) => resources.some((article) => article.category === category.slug)).map((category) => ({ url: absoluteUrl(`/resources/${category.slug}`) })),
    ...resources.filter((article) => article.status === "ready").map((article) => ({ url: absoluteUrl(resourceHref(article)), lastModified: article.updatedAt, images: [...new Set([article.shareImage.src, ...(article.cover ? [article.cover.src] : [])])] })),
  ];
}
