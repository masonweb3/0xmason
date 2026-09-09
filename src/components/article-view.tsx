import Link from 'next/link';
import { CDNImage as Image } from './cdn-image';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { ArticleMarkdown } from './article-markdown';
import { ArticleRichText, nodeText, richTextHeadings } from './article-richtext';
import { StructuredData } from './structured-data';
import { parseArticleContent } from '@/lib/article-content';
import { resourceHref, recordedMonth, type Category, type Resource } from '@/lib/resources';
import { absoluteUrl, breadcrumbs, site } from '@/lib/site';
import { assetUrl } from '@/lib/cdn';

function ArticleContents({ headings }: { headings: { id: string; title: string }[] }) {
  return <ol>{headings.map((heading, index) => <li key={`${heading.id}-${index}`}><a href={`#${heading.id}`}>{heading.title}</a></li>)}</ol>;
}

export function ArticleView({ article, category, preview = false }: { article: Resource; category: Category; preview?: boolean }) {
  const directoryHref = `/resources/${category.slug}`;
  const content = parseArticleContent(article.bodyFormat === 'markdown' ? article.markdown : nodeText(article.body?.root || {}));
  const headings = article.bodyFormat === 'markdown' ? content.headings : richTextHeadings(article.body);
  const month = recordedMonth(article.recordedAt);
  return <main id="main-content" className="article-page">
    {preview ? <aside className="preview-banner">文章预览 · 仅管理员可见 <Link href={`/admin/collections/articles/${article.id}`}>返回编辑</Link></aside> : <>
      <StructuredData value={breadcrumbs([{ name: '首页', path: '/' }, { name: '精选资源', path: '/resources' }, { name: category.title, path: directoryHref }, { name: article.title, path: resourceHref(article) }])} />
      <StructuredData value={{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title, description: article.seoDescription, inLanguage: 'zh-CN', mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(resourceHref(article)) }, image: [absoluteUrl(article.shareImage)], dateModified: article.updatedAt, author: { '@type': 'Person', name: site.name, url: site.url }, publisher: { '@type': 'Person', name: site.name, url: site.url }, isAccessibleForFree: true, articleSection: category.title }} />
    </>}
    <Link href={directoryHref} className="back-link"><ArrowLeft size={18} aria-hidden="true" />{category.title}</Link>
    <header className="article-header">
      <h1>{article.title}</h1><p className="article-summary">{article.summary}</p>
      <div className="article-meta"><span className="article-author"><Image src={assetUrl('images/avatar.png')} width={32} height={32} alt="" sizes="32px" />Mason</span>{month && <time dateTime={article.recordedAt}>{month}</time>}<span>约 {content.readingMinutes} 分钟</span></div>
    </header>
    <div className="article-layout">
    <div className="article-reading">
    {article.cover && <Image className="article-cover" src={article.cover.src} sources={article.cover.sources} width={article.cover.width} height={article.cover.height} alt={article.cover.alt === '封面图' ? article.title : article.cover.alt} sizes="(max-width: 767px) 90vw, 740px" />}
    {!!headings.length && <details className="article-toc"><summary>文章目录<span>{headings.length} 个章节</span></summary><nav aria-label="本篇文章目录"><ArticleContents headings={headings} /></nav></details>}
    {article.hasAffiliate && <p className="article-aff">本页含推荐入口。通过推荐注册或购买，我可能获得奖励。</p>}
    <article className="article-body article-prose">{article.bodyFormat === 'markdown' ? <ArticleMarkdown content={content.body} images={article.images} affiliateUrls={article.affiliateLinks.map((link) => link.url)} /> : article.body ? <ArticleRichText body={article.body} /> : null}</article>
    {!!article.affiliateLinks.length && <section className="article-links" aria-label="推荐入口">{article.affiliateLinks.map((link) => {
      const available = link.available;
      return <div className="article-link" key={link.id}><strong>{link.name}</strong>{link.code && <p>推荐码：<code>{link.code}</code></p>}{available ? <a href={link.url} className="text-link" target="_blank" rel="sponsored nofollow noopener noreferrer">{link.label}<ArrowRight size={18} aria-hidden="true" /></a> : <p className="article-note">推荐入口已结束</p>}</div>;
    })}</section>}
    <Link href={directoryHref} className="text-link">返回文章目录<ArrowRight size={21} aria-hidden="true" /></Link>
    </div>
    {!!headings.length && <aside className="article-sidebar"><nav aria-label="本篇文章目录"><p>本篇目录</p><ArticleContents headings={headings} /><a className="toc-back" href="#main-content">回到顶部 ↑</a></nav></aside>}
    </div>
  </main>;
}
