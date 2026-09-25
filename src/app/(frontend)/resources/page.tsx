import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getCategories, getResources, categoryCount } from "@/lib/resources";
import { CategoryArtwork } from "@/components/category-artwork";
import { breadcrumbs, pageMetadata } from "@/lib/site";
import { StructuredData } from "@/components/structured-data";

export const metadata: Metadata = pageMetadata({ title: "精选资源", description: "Mason 的账户与支付、eSIM 保号和 AI 测评记录。按主题浏览银行卡、全球账户、AI 订阅和海外号码的文章。", path: "/resources" });

export default async function ResourcesPage() {
  const [categories, articles] = await Promise.all([getCategories(), getResources()]);
  return (
    <main id="main-content" className="container library-page">
      <StructuredData value={breadcrumbs([{ name: "首页", path: "/" }, { name: "精选资源", path: "/resources" }])} />
      <nav className="breadcrumb" aria-label="面包屑"><Link href="/">首页</Link><span aria-hidden="true">/</span><span>精选资源</span></nav>
      <div className="page-intro">
        <h1>精选资源</h1>
        <p>先选一个主题，再找需要的文章。</p>
      </div>
      <div className="category-index">
        {categories.map((category) => (
          <Link href={`/resources/${category.slug}`} className="category-index-item" key={category.slug}>
            <CategoryArtwork category={category.slug} />
            <div className="category-index-copy">
              <h2>{category.title}</h2>
              <p>{category.description}</p>
              <span className="directory-count">{categoryCount(articles, category.slug)}</span>
            </div>
            <ArrowRight size={24} aria-hidden="true" className="resource-arrow" />
          </Link>
        ))}
      </div>
    </main>
  );
}
