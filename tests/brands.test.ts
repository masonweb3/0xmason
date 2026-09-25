import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Brand, Media } from '../src/payload-types';
import { heroBrands } from '../src/lib/brands';
import { assetUrl, mediaUrl } from '../src/lib/cdn';

const brand = (fields: Partial<Brand>) => ({ id: 1, name: 'Test', kind: 'esim', articles: [1], createdAt: '', updatedAt: '', ...fields }) as Brand;
const logo = { id: 9, alt: 'Logo', filename: 'logo-0123456789abcdef.webp', prefix: 'media', width: 192, height: 192, sizes: {} } as unknown as Media;

test('hero brands follow published articles and prefer uploads over seeded assets', () => {
  const brands = heroBrands([
    brand({ id: 1, iconAsset: 'images/brands/app-saily.png' }),
    brand({ id: 2, articles: [2], iconAsset: 'images/brands/app-csl.png' }),
    brand({ id: 3, articles: [], iconAsset: 'images/brands/app-o2.png' }),
    brand({ id: 4, logo, iconAsset: 'images/brands/app-dito.png' }),
    brand({ id: 5, kind: 'card', iconAsset: 'images/brands/app-gate.png', cardAsset: 'images/cards/gate.png' }),
    brand({ id: 6, kind: 'account', iconAsset: 'images/brands/app-maya.png', cardAsset: 'images/cards/gate.png' }),
    brand({ id: 7 }),
  ], new Set([1]));
  assert.deepEqual(brands.map((item) => item.id), [1, 4, 5, 6]);
  assert.equal(brands[0].icon.src, assetUrl('images/brands/app-saily.png'));
  assert.equal(brands[1].icon.src, mediaUrl(logo.filename!));
  assert.equal(brands[2].card?.src, assetUrl('images/cards/gate.png'));
  assert.equal(brands[3].card, undefined);
});
