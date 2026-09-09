import { CDNImage as Image } from './cdn-image';
import type { CategorySlug } from "@/lib/resources";
import { assetUrl } from '@/lib/cdn';

const brandGroups = {
  esim: [
    { name: "Vodafone", file: "vodafone.svg", className: "brand-vodafone" },
    { name: "giffgaff", file: "giffgaff.svg", className: "brand-giffgaff" },
    { name: "Tello", file: "tello.png", className: "brand-tello" },
  ],
};

export function CategoryArtwork({ category, sizes = "(max-width: 767px) 90vw, 380px" }: {
  category: CategorySlug;
  sizes?: string;
}) {
  if (category === "global-accounts") {
    return (
      <div className="category-artwork card-artwork">
        <Image src={assetUrl('images/global-cards.png')} alt="Starryblu、Bybit EU、RedotPay 三张卡片的分类插图" fill sizes={sizes} />
      </div>
    );
  }
  return (
    <div className={`category-artwork logo-artwork logo-artwork-${category}`}>
      <div className="logo-cluster">
        {brandGroups[category].map((brand) => (
          <div className={`brand-tile ${brand.className}`} key={brand.name}>
            <Image src={assetUrl(`images/brands/${brand.file}`)} alt={`${brand.name} 标志`} width={100} height={100} sizes="100px" />
          </div>
        ))}
      </div>
    </div>
  );
}
