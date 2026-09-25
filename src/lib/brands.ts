import type { Brand } from '@/payload-types';
import { assetUrl, mediaImage, type ImageSource } from './cdn';

export type BrandKind = Brand['kind'];
export type BrandPicture = { src: string; sources?: ImageSource[]; width?: number; height?: number };
export type HeroBrand = { id: number; name: string; kind: BrandKind; icon: BrandPicture; card?: BrandPicture };

const picture = (media: Brand['logo'], asset?: string | null): BrandPicture | undefined =>
  mediaImage(media) || (asset ? { src: assetUrl(asset) } : undefined);

// Keeps brands that have at least one published article, in the given order. Uploads win over seeded site assets.
export function heroBrands(docs: Brand[], published: Set<number>): HeroBrand[] {
  return docs.flatMap((brand) => {
    if (!brand.articles?.some((article) => published.has(typeof article === 'number' ? article : article.id))) return [];
    const icon = picture(brand.logo, brand.iconAsset);
    if (!icon) return [];
    const card = brand.kind === 'card' ? picture(brand.cardImage, brand.cardAsset) : undefined;
    return [{ id: brand.id, name: brand.name, kind: brand.kind, icon, card }];
  });
}
