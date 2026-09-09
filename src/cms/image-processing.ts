import sharp from 'sharp';

export const IMAGE_POLICY_VERSION = 'webp-1';
export const WEBP_OPTIONS = { quality: 84, alphaQuality: 90, effort: 5, smartSubsample: true } as const;
export const IMAGE_INPUT_OPTIONS = { limitInputPixels: 32_000_000 } as const;
export const IMAGE_MAX_WIDTH = 1920;
export const IMAGE_SIZES = [
  { name: 'thumbnail', width: 320 },
  { name: 'small', width: 640 },
  { name: 'medium', width: 960 },
  { name: 'large', width: 1280 },
] as const;

export async function compressImage(data: Buffer, width = IMAGE_MAX_WIDTH) {
  const { data: output, info } = await sharp(data, { ...IMAGE_INPUT_OPTIONS, animated: true })
    .rotate()
    .resize({ width, fit: 'inside', withoutEnlargement: true })
    .webp(WEBP_OPTIONS)
    .toBuffer({ resolveWithObject: true });
  const metadata = await sharp(output, { animated: true }).metadata();
  return { data: output, width: info.width, height: metadata.pageHeight || info.height };
}

export async function compressImageSet(data: Buffer, maxWidth = IMAGE_MAX_WIDTH) {
  const original = await compressImage(data, maxWidth);
  const variants = [];
  for (const size of IMAGE_SIZES) {
    if (size.width >= original.width) continue;
    variants.push({ name: size.name, ...await compressImage(data, size.width) });
  }
  return { original, variants };
}
