import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { cms, getCategory, getPreviewResource } from '@/lib/resources';
import { ArticleView } from '@/components/article-view';

export const metadata = { title: '文章预览', robots: { index: false, follow: false } };
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const payload = await cms();
  const { user } = await payload.auth({ headers: await headers() });
  if (user?.collection !== 'users') notFound();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const article = await getPreviewResource(Number(id), user);
  if (!article) notFound();
  const category = await getCategory(article.category);
  if (!category) notFound();
  return <ArticleView article={article} category={category} preview />;
}
