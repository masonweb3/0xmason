import assets from '../../content/cdn-assets.json' with { type: 'json' };

export const CDN_ORIGIN = 'https://cdn.0xmason.com';
export const MEDIA_PREFIX = 'media';
export type ImageSource = { src: string; width: number };
type ManifestAsset = { key: string; width: number; variants?: { key: string; width: number }[] };

export function assetSources(url: string): ImageSource[] {
  const asset = (Object.values(assets) as ManifestAsset[]).find((item) => cdnUrl(item.key) === url);
  return asset ? [...(asset.variants || []), asset].map(({ key, width }) => ({ src: cdnUrl(key), width })) : [];
}

export function isWebPImage(url: string): boolean {
  return isCDNImage(url) && new URL(url).pathname.endsWith('.webp');
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
