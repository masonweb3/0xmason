import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { r2StorageConfig } from '../src/cms/r2';
import { cdnUrl } from '../src/lib/cdn';
import { compressImageSet, IMAGE_POLICY_VERSION } from '../src/cms/image-processing';

export type CDNVariant = { key: string; sha256: string; bytes: number; contentType: string; width: number; height: number };
export type CDNAsset = CDNVariant & { variants?: CDNVariant[]; sourceSha256?: string; compressionVersion?: string };
export const manifestPath = resolve('content/cdn-assets.json');
const storage = r2StorageConfig();
const client = new S3Client(storage.config);
const compatibilityAssets = new Set(['favicon.ico', 'apple-icon.png']);

export async function readCDNImage(url: string) {
  if (!url.startsWith('https://cdn.0xmason.com/')) throw new Error('Image input must come from the configured CDN.');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error(`CDN image returned ${response.status}: ${url}`);
      return { data: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type'), cache: response.headers.get('cf-cache-status') };
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw new Error('CDN image could not be read.');
}

export async function verifyImage(asset: Pick<CDNAsset, 'key' | 'sha256'>) {
  const response = await readCDNImage(cdnUrl(asset.key));
  assert.match(response.contentType || '', /^image\//);
  const data = response.data;
  assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256, `CDN image bytes: ${asset.key}`);
  return { url: cdnUrl(asset.key), bytes: data.length, sha256: asset.sha256, cache: response.cache };
}

export async function putImage(key: string, data: Buffer): Promise<CDNAsset> {
  const extension = extname(key).toLowerCase();
  const compatibility = /^site\/(?:favicon\.[a-f0-9]{16}\.ico|apple-icon\.[a-f0-9]{16}\.png)$/.test(key);
  if (extension !== '.webp' && !compatibility) throw new Error('Upload compressed WebP only; favicon and Apple touch icon are the only exceptions.');
  const contentType = extension === '.webp' ? 'image/webp' : extension === '.ico' ? 'image/x-icon' : 'image/png';
  cdnUrl(key);
  const sha256 = createHash('sha256').update(data).digest('hex');
  const dimensions = extension === '.ico' ? { width: 48, height: 48, pageHeight: undefined } : await sharp(data).metadata();
  assert.ok(dimensions.width && dimensions.height, `Image dimensions: ${key}`);
  if (extension === '.webp') assert.equal((await sharp(data).metadata()).format, 'webp', 'WebP extension must contain WebP bytes.');
  try {
    await client.send(new PutObjectCommand({ Bucket: storage.bucket, Key: key, Body: data, ContentType: contentType, CacheControl: 'public, max-age=31536000, immutable', Metadata: { sha256 }, IfNoneMatch: '*' }));
  } catch (error) {
    const failure = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (failure.$metadata?.httpStatusCode !== 412) throw new Error(`R2 upload failed: ${key} (${failure.name || 'unknown'}, ${failure.$metadata?.httpStatusCode || 'network'})`);
  }
  const asset = { key, sha256, bytes: data.length, contentType, width: dimensions.width, height: dimensions.pageHeight || dimensions.height };
  await verifyImage(asset);
  return asset;
}

export async function prepareAsset(path: string, data: Buffer): Promise<CDNAsset> {
  const extension = extname(path).toLowerCase();
  if (!extension || path.startsWith('/') || path.includes('..') || path.includes('\\')) throw new Error('Use a relative image name such as images/example.png.');
  const sourceSha256 = createHash('sha256').update(data).digest('hex');
  if (compatibilityAssets.has(path)) return putImage(`site/${path.slice(0, -extension.length)}.${sourceSha256.slice(0, 16)}${extension}`, data);
  const maxWidth = path.includes('/brands/') ? 320 : path === 'images/avatar.png' ? 1280 : path.includes('/social/') ? 1200 : path.startsWith('icons/') || path === 'icon.png' ? 512 : undefined;
  const { original, variants } = await compressImageSet(data, maxWidth);
  const stem = `site/${path.slice(0, -extension.length)}`;
  async function put(output: typeof original) {
    const hash = createHash('sha256').update(output.data).digest('hex').slice(0, 16);
    return putImage(`${stem}.${hash}-${output.width}w.webp`, output.data);
  }
  const asset = await put(original);
  const resized: CDNVariant[] = [];
  for (const variant of variants) resized.push(await put(variant));
  return { ...asset, variants: resized, sourceSha256, compressionVersion: IMAGE_POLICY_VERSION };
}

export async function uploadAsset(path: string, data: Buffer) {
  const asset = await prepareAsset(path, data);
  const manifest: Record<string, CDNAsset> = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest[path] = asset;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return cdnUrl(asset.key);
}

export function closeStorage() { client.destroy(); }
