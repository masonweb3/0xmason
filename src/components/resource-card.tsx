import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Category } from "@/lib/resources";
import { CategoryArtwork } from "./category-artwork";

export function FeaturedResources({ categories }: { categories: Category[] }) {
  if (!categories.length) return <p className="empty-state">精选资源正在整理，稍后再来看看</p>;
  return (
    <div className="featured-grid">
      {categories.map((category) => (
        <Link href={`/resources/${category.slug}`} key={category.slug} className="featured-resource">
          <div className="featured-resource-copy">
            <h3>{category.title}</h3>
            <p className="resource-summary">{category.summary}</p>
            <span className="detail-link">查看目录 <ArrowRight size={21} aria-hidden="true" /></span>
          </div>
          <CategoryArtwork category={category.slug} sizes="(max-width: 767px) 36vw, 240px" />
        </Link>
      ))}
    </div>
  );
}
