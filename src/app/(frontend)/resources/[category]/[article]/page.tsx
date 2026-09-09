import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategory, getResource, resourceHref } from '@/lib/resources';
import { ArticleView } from '@/components/article-view';
import { pageMetadata } from '@/lib/site';

type PageParams = { category: string; article: string };
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { category, article } = await params;
  const current = await getResource(category, article);
  if (!current) notFound();
  return pageMetadata({ title: current.seoTitle, description: current.seoDescription, path: resourceHref(current), image: current.shareImage, article: { updatedAt: current.updatedAt } });
}
export default async function ArticlePage({ params }: { params: Promise<PageParams> }) {
  const { category: categorySlug, article: articleSlug } = await params;
  const [category, article] = await Promise.all([getCategory(categorySlug), getResource(categorySlug, articleSlug)]);
  if (!category || !article) notFound();
  return <ArticleView article={article} category={category} />;
}
