import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { compressImage, compressImageSet } from '../src/cms/image-processing';

test('uploads become responsive WebP, lose source metadata and keep a bounded width', async () => {
  const source = await sharp({ create: { width: 2400, height: 1200, channels: 4, background: '#19d3c5' } }).png().withExif({ IFD0: { Artist: 'private-test-metadata' } }).toBuffer();
  const { original, variants } = await compressImageSet(source);
  assert.equal(original.width, 1920);
  assert.deepEqual(variants.map(v => v.width), [320, 640, 960, 1280]);
  for (const output of [original, ...variants]) {
    const metadata = await sharp(output.data).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.xmp, undefined);
    assert.equal(metadata.width, output.width);
    assert.equal(output.height, output.width / 2);
  }
  assert.ok(original.data.length < source.length);
});

test('small transparent images are not enlarged and invalid image data is rejected', async () => {
  const source = await sharp({ create: { width: 80, height: 40, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
  const result = await compressImageSet(source);
  assert.equal(result.original.width, 80);
  assert.deepEqual(result.variants, []);
  assert.equal((await sharp(result.original.data).metadata()).hasAlpha, true);
  await assert.rejects(() => compressImage(Buffer.from('not-an-image')));
});
