import Link from 'next/link';
import { CDNImage as Image } from './cdn-image';
import { ArrowUpRight, Info } from '@phosphor-icons/react/dist/ssr';
import { ArticleMarkdown } from './article-markdown';
import { ArticleContents } from './article-contents';
import { ArticleRichText, nodeText, richTextHeadings } from './article-richtext';
import { PostCard } from './cards';
import { CopyCode } from './copy-code';
import { StructuredData } from './structured-data';
import { parseArticleContent } from '@/lib/article-content';
import { resourceHref, type Category, type Resource } from '@/lib/resources';
import { absoluteUrl, breadcrumbs, site } from '@/lib/site';
import { assetUrl } from '@/lib/cdn';
import { offers } from '@/lib/offers';

export function ArticleView({ article, category, related = [], preview = false }: { article: Resource; category: Category; related?: Resource[]; preview?: boolean }) {
  const directoryHref = `/resources/${category.slug}`;
  const content = parseArticleContent(article.bodyFormat === 'markdown' ? article.markdown : nodeText(article.body?.root || {}));
  const headings = article.bodyFormat === 'markdown' ? content.headings : richTextHeadings(article.body);
  const offer = offers.find((item) => item.slug === article.slug);
  const updated = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(article.updatedAt));
  return <main id="main-content" className="article-page">
    {preview ? <aside className="container preview-banner">文章预览 · 仅管理员可见 <Link href={`/admin/collections/articles/${article.id}`}>返回编辑</Link></aside> : <>
      <StructuredData value={breadcrumbs([{ name: '首页', path: '/' }, { name: '精选资源', path: '/resources' }, { name: category.title, path: directoryHref }, { name: article.title, path: resourceHref(article) }])} />
      <StructuredData value={{ '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${absoluteUrl(resourceHref(article))}#article`, headline: article.title, description: article.seoDescription, inLanguage: 'zh-CN', mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(resourceHref(article)) }, image: [...new Set([article.shareImage.src, ...(article.cover ? [article.cover.src] : [])])], dateModified: article.updatedAt, author: { '@type': 'Person', '@id': `${site.url}/#person`, name: site.name, url: site.url, sameAs: [site.social] }, publisher: { '@type': 'Person', '@id': `${site.url}/#person`, name: site.name, url: site.url }, isAccessibleForFree: true, articleSection: category.title }} />
    </>}
    <div className="container">
      <div className="article-columns">
        <header className="article-header">
          <nav className="breadcrumb" aria-label="面包屑"><Link href="/resources">精选资源</Link><span aria-hidden="true">/</span><Link href={directoryHref}>{category.title}</Link></nav>
          <h1>{article.title}</h1>
          <p className="article-summary">{article.summary}</p>
          <div className="article-meta">
            <span className="article-author"><Image src={assetUrl('images/avatar.png')} width={32} height={32} alt="" sizes="32px" />Mason</span>
            {article.recordedAt && <time dateTime={article.recordedAt}>{article.recordedAt}</time>}
            <span>约 {content.readingMinutes} 分钟</span>
            <span>更新于 <time dateTime={article.updatedAt}>{updated}</time></span>
          </div>
          {article.hasAffiliate && <p className="article-aff"><Info size={14} aria-hidden="true" />本文含推广链接和邀请码，通过它们开卡我可能获得奖励。</p>}
        </header>
      </div>
      {article.cover && <Image className="article-cover" src={article.cover.src} sources={article.cover.sources} width={article.cover.width} height={article.cover.height} alt={article.cover.alt === '封面图' ? article.title : article.cover.alt} preload sizes="(max-width: 767px) 90vw, 1200px" />}
      <div className="article-columns article-layout">
        {!!headings.length && <nav className="article-sidebar" aria-label="本篇文章目录"><p>目录</p><ArticleContents headings={headings} /><a className="toc-back" href="#main-content">回到顶部</a></nav>}
        <div className="article-reading">
          {!!headings.length && <details className="article-toc"><summary>文章目录<span>{headings.length} 个章节</span></summary><nav aria-label="本篇文章目录"><ArticleContents headings={headings} /></nav></details>}
          <article className="article-body article-prose">{article.bodyFormat === 'markdown' ? <ArticleMarkdown content={content.body} images={article.images} affiliateUrls={article.affiliateLinks.map((link) => link.url)} /> : article.body ? <ArticleRichText body={article.body} /> : null}</article>
        </div>
        {!!article.affiliateLinks.length && <aside className="article-offer" aria-label="推荐入口">
          {offer && <div className="article-offer-figure"><span>{offer.name}</span><strong>{offer.figure}</strong><span>{offer.figureNote}</span>{offer.promo && <span className="offer-promo">{offer.promo}</span>}</div>}
          {article.affiliateLinks.map((link) => (
            <div className="article-offer-link" key={link.id}>
              {!offer && <strong>{link.name}</strong>}
              {link.code && <CopyCode code={link.code} label={`${link.name} 邀请码`} className="code-button-block" />}
              {link.available
                ? <a href={link.url} className="primary-button primary-button-block" target="_blank" rel="sponsored nofollow noopener noreferrer">{link.label}<ArrowUpRight size={16} weight="bold" aria-hidden="true" /></a>
                : <p className="article-note">推荐入口已结束</p>}
            </div>
          ))}
          <p className="disclosure">推广 · 通过邀请码开卡我可能获得奖励</p>
        </aside>}
      </div>
      {!!related.length && <section className="related" aria-labelledby="related-heading">
        <h2 id="related-heading">相关文章</h2>
        <div className="post-grid">
          {related.map((post) => (
            <PostCard post={post} category={category.title} key={post.slug} />
          ))}
        </div>
      </section>}
    </div>
  </main>;
}
