import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleMarkdown } from '@/components/article-markdown';
import { StructuredData } from '@/components/structured-data';
import { informationPage } from '@/lib/information';
import { breadcrumbs, pageMetadata } from '@/lib/site';

type Props = { params: Promise<{ info: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { info } = await params;
  const page = informationPage(info);
  if (!page) notFound();
  return pageMetadata({ title: page.title, description: page.description, path: `/${info}` });
}

export default async function InformationPage({ params }: Props) {
  const { info } = await params;
  const page = informationPage(info);
  if (!page) notFound();
  return <main id="main-content" className="article-page information-page">
    <StructuredData value={breadcrumbs([{ name: '首页', path: '/' }, { name: page.title, path: `/${info}` }])} />
    <Link href="/" className="back-link">← 返回首页</Link>
    <header className="article-header">
      <h1>{page.title}</h1>
      <p className="article-summary">{page.description}</p>
      <p className="article-meta">更新于 <time dateTime="2026-09-17">2026-09-17</time></p>
    </header>
    <div className="article-prose"><ArticleMarkdown content={page.body} images={{}} /></div>
  </main>;
}
