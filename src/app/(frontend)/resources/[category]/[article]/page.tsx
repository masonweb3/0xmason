import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getCategory, getCategoryResources, getResource, getResources, resourceHref } from '@/lib/resources';
import { ArticleView } from '@/components/article-view';
import { pageMetadata } from '@/lib/site';

type PageParams = { category: string; article: string };

// Article slugs are unique, so an article moved to another category keeps its old address through a 301.
async function findArticle(category: string, slug: string) {
  const article = await getResource(category, slug);
  if (article) return article;
  const moved = (await getResources()).find((item) => item.slug === slug);
  if (moved) permanentRedirect(resourceHref(moved));
  notFound();
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { category, article } = await params;
  const current = await findArticle(category, article);
  return pageMetadata({ title: current.seoTitle, description: current.seoDescription, path: resourceHref(current), image: current.shareImage, article: { updatedAt: current.updatedAt } });
}
export default async function ArticlePage({ params }: { params: Promise<PageParams> }) {
  const { category: categorySlug, article: articleSlug } = await params;
  const article = await findArticle(categorySlug, articleSlug);
  const category = await getCategory(article.category);
  if (!category) notFound();
  const related = (await getCategoryResources(category.slug)).filter((item) => item.slug !== article.slug).slice(0, 3);
  return <ArticleView article={article} category={category} related={related} />;
}
