import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getCategories, getResources, categoryCount } from "@/lib/resources";
import { CategoryArtwork } from "@/components/category-artwork";
import { breadcrumbs, pageMetadata } from "@/lib/site";
import { StructuredData } from "@/components/structured-data";

export const metadata: Metadata = pageMetadata({ title: "精选资源", description: "Mason 的账户与支付、eSIM 保号记录。按主题浏览银行卡、全球账户、AI 订阅和海外号码的文章。", path: "/resources" });

export default async function ResourcesPage() {
  const [categories, articles] = await Promise.all([getCategories(), getResources()]);
  return (
    <main id="main-content" className="container library-page">
      <StructuredData value={breadcrumbs([{ name: "首页", path: "/" }, { name: "精选资源", path: "/resources" }])} />
      <Link href="/" className="back-link"><ArrowLeft size={18} aria-hidden="true" />返回首页</Link>
      <div className="page-intro">
        <p className="eyebrow">Mason 的资源库</p>
        <h1>精选资源</h1>
        <p>先选一个主题，再找需要的文章。</p>
      </div>
      <div className="category-index">
        {categories.map((category) => (
          <Link href={`/resources/${category.slug}`} className="category-index-item" key={category.slug}>
            <CategoryArtwork category={category.slug} sizes="240px" />
            <div className="category-index-copy">
              <h2>{category.title}</h2>
              <p>{category.description}</p>
              <span className="directory-count">{categoryCount(articles, category.slug)}</span>
            </div>
            <ArrowRight size={28} aria-hidden="true" className="resource-arrow" />
          </Link>
        ))}
      </div>
    </main>
  );
}
