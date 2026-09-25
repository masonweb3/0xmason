import assets from '../../content/cdn-assets.json' with { type: 'json' };
import type { Media } from '@/payload-types';

export const CDN_ORIGIN = 'https://cdn.0xmason.com';
export const MEDIA_PREFIX = 'media';
export type ImageSource = { src: string; width: number };
export type ArticleImage = { src: string; alt: string; width: number; height: number; mediaId?: number; sources?: ImageSource[] };
type ManifestAsset = { key: string; width: number; height: number; variants?: { key: string; width: number }[] };

export function assetMetadata(url: string) {
  const asset = (Object.values(assets) as ManifestAsset[]).find((item) => cdnUrl(item.key) === url);
  return asset ? { width: asset.width, height: asset.height } : {};
}

export function assetSources(url: string): ImageSource[] {
  const asset = (Object.values(assets) as ManifestAsset[]).find((item) => cdnUrl(item.key) === url);
  return asset ? [...(asset.variants || []), asset].map(({ key, width }) => ({ src: cdnUrl(key), width })) : [];
}

export function isWebPImage(url: string): boolean {
  return isCDNImage(url) && new URL(url).pathname.endsWith('.webp');
}

export function isCDNVideo(url: string): boolean {
  return isCDNImage(url) && new URL(url).pathname.endsWith('.mp4');
}

export function cdnUrl(key: string) {
  const segments = key.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || /[\\\x00-\x1f]/.test(segment))) {
    throw new Error('Invalid CDN object key.');
  }
  return `${CDN_ORIGIN}/${segments.map(encodeURIComponent).join('/')}`;
}

export function isCDNImage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.origin === CDN_ORIGIN && !parsed.username && !parsed.password && parsed.pathname !== '/';
  } catch { return false; }
}

export function assetUrl(path: string) {
  const asset = (assets as Record<string, { key: string }>)[path.replace(/^\//, '')];
  if (!asset) throw new Error(`Image is not registered in the CDN manifest: ${path}`);
  return cdnUrl(asset.key);
}

export function mediaUrl(filename: string, prefix = MEDIA_PREFIX) {
  if (prefix !== MEDIA_PREFIX || /[/\\]/.test(filename)) throw new Error('Invalid media object key.');
  return cdnUrl(`${prefix}/${filename}`);
}

export function mediaImage(media: number | Media | null | undefined): ArticleImage | undefined {
  if (!media || typeof media !== 'object' || !media.filename || !media.width || !media.height) return;
  const src = mediaUrl(media.filename, media.prefix || undefined);
  const sources = new Map<number, ImageSource>();
  for (const size of Object.values(media.sizes || {})) {
    if (size?.filename && size.width && size.width < media.width) sources.set(size.width, { src: mediaUrl(size.filename), width: size.width });
  }
  sources.set(media.width, { src, width: media.width });
  return { src, alt: media.alt, width: media.width, height: media.height, mediaId: media.id, sources: [...sources.values()] };
}
