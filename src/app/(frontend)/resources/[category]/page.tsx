import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getCategories, categoryCount, getCategory, getCategoryResources, resourceHref } from "@/lib/resources";
import { CDNImage } from "@/components/cdn-image";
import { CategoryArtwork } from "@/components/category-artwork";
import { parseArticleContent } from "@/lib/article-content";
import { nodeText } from "@/components/article-richtext";
import { breadcrumbs, pageMetadata } from "@/lib/site";
import { StructuredData } from "@/components/structured-data";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const current = await getCategory(category);
  if (!current) notFound();
  return pageMetadata({ title: `${current.title} · 文章目录`, description: current.description, path: `/resources/${current.slug}`, indexable: (await getCategoryResources(current.slug)).length > 0 });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const [category, categories] = await Promise.all([getCategory(slug), getCategories()]);
  if (!category) notFound();
  const articles = await getCategoryResources(category.slug);
  return (
    <main id="main-content" className="container directory-page">
      <StructuredData value={breadcrumbs([{ name: "首页", path: "/" }, { name: "精选资源", path: "/resources" }, { name: category.title, path: `/resources/${category.slug}` }])} />
      <nav className="breadcrumb" aria-label="面包屑"><Link href="/resources">精选资源</Link><span aria-hidden="true">/</span><span>{category.title}</span></nav>
      <header className="directory-header">
        <div className="page-intro">
          <h1>{category.title}</h1>
          <p>{category.description}</p>
        </div>
        <CategoryArtwork category={category.slug} />
      </header>
      <nav className="category-nav" aria-label="资源分类">
        {categories.map((item) => (
          <Link href={`/resources/${item.slug}`} aria-current={item.slug === slug ? "page" : undefined} key={item.slug}>{item.title}</Link>
        ))}
      </nav>
      <section className="article-directory" aria-labelledby="article-directory-heading">
        <div className="directory-heading">
          <h2 id="article-directory-heading">文章目录</h2>
          <span>{categoryCount(articles, category.slug)}</span>
        </div>
        <div className="article-list">
          {articles.length ? articles.map((article, index) => {
            const { readingMinutes } = parseArticleContent(article.bodyFormat === 'markdown' ? article.markdown : nodeText(article.body?.root || {}));
            return <Link className={`article-preview${article.cover ? '' : ' article-preview-text'}`} href={resourceHref(article)} key={article.slug}>
              {article.cover && <div className="article-preview-image"><CDNImage src={article.cover.src} sources={article.cover.sources} width={article.cover.width} height={article.cover.height} alt="" preload={index === 0} sizes="(max-width: 767px) 90vw, (max-width: 1100px) 40vw, 480px" /></div>}
              <div className="article-preview-copy">
                <p className="entry-meta">{article.recordedAt && <time dateTime={article.recordedAt}>{article.recordedAt}</time>}<span>约 {readingMinutes} 分钟</span></p>
                <h3>{article.title}</h3>
                <p className="article-preview-summary">{article.summary}</p>
                <span className="detail-link">阅读全文 <ArrowRight size={16} aria-hidden="true" /></span>
              </div>
            </Link>;
          }) : <p className="empty-state">这个分类的文章还在准备，整理好后会放在这里。</p>}
        </div>
      </section>
    </main>
  );
}
