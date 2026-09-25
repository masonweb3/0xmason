import { CDNImage as Image } from './cdn-image';
import type { CategorySlug } from "@/lib/resources";
import { brandIcon, cardImage } from '@/lib/offers';

// Decorative: the category title sits next to it. Unknown categories render an empty tile instead of failing.
const icons: Partial<Record<CategorySlug, string[]>> = {
  esim: ['saily', 'xesim', 'dito', 'csl'],
  'ai-reviews': ['claude', 'chatgpt'],
};

export function CategoryArtwork({ category }: { category: CategorySlug }) {
  if (category === 'global-accounts') {
    return (
      <div className="category-artwork artwork-cards" aria-hidden="true">
        {['mexc', 'bybit-eu', 'starryblu'].map((card) => <Image key={card} src={cardImage(card)} alt="" width={856} height={540} sizes="112px" />)}
      </div>
    );
  }
  return (
    <div className="category-artwork artwork-icons" aria-hidden="true">
      {(icons[category] || []).map((name) => <Image className="brand-icon" key={name} src={brandIcon(name)} alt="" width={192} height={192} sizes="48px" />)}
    </div>
  );
}
