import { readdir, readFile } from 'node:fs/promises';

const localImages = [];
for (const directory of ['public', 'src']) {
  const files = await readdir(directory, { recursive: true }).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const file of files) {
    if (/\.(?:png|jpe?g|webp|avif|gif|svg|ico)$/i.test(file)) localImages.push(`${directory}/${file}`);
  }
}
if (localImages.length) throw new Error(`Website images must be uploaded to cdn.0xmason.com. Local files are not allowed:\n${localImages.join('\n')}`);
const assets = JSON.parse(await readFile('content/cdn-assets.json', 'utf8'));
for (const [name, asset] of Object.entries(assets)) {
  if (name === 'favicon.ico' || name === 'apple-icon.png') continue;
  for (const image of [asset, ...(asset.variants || [])]) {
    if (!image.key.endsWith('.webp') || image.contentType !== 'image/webp') throw new Error(`Image must be compressed to WebP before use: ${name}`);
  }
}
console.log('CDN-only WebP image storage check passed (favicon and Apple touch icon excepted).');
