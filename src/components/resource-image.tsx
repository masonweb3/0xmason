import { CDNImage as Image } from './cdn-image';
import type { Resource } from "@/lib/resources";
import { CategoryArtwork } from "./category-artwork";
import { assetUrl } from '@/lib/cdn';

export function ResourceImage({ resource, sizes }: { resource: Resource; sizes: string }) {
  return (
    <div className="resource-image">
      {resource.slug === "starryblu" ? (
        <Image src={assetUrl('images/starryblu-light.png')} alt="Starryblu Saturn 卡片产品插图" fill sizes={sizes} />
      ) : (
        <CategoryArtwork category={resource.category} sizes={sizes} />
      )}
    </div>
  );
}
