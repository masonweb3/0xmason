import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { matchesGlob } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { indexNowKey, isIndexingEnabled, pageMetadata, site, submitToIndexNow } from '../src/lib/site';
import { StructuredData } from '../src/components/structured-data';

test('Vercel excludes preview branches containing slashes while keeping main enabled', () => {
  const rules = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).git.deploymentEnabled as Record<string, boolean>;
  for (const branch of ['main', 'feature', 'codex/seo-search-console', 'dependabot/npm_and_yarn/example']) {
    const matches = Object.entries(rules).filter(([pattern]) => matchesGlob(branch, pattern));
    const enabled = !matches.length || matches.some(([, enabled]) => enabled);
    assert.equal(enabled, branch === 'main', branch);
  }
});

test('indexing requires production and an explicit opt-in', () => {
  for (const VERCEL_ENV of [undefined, 'development', 'preview', 'production']) {
    for (const SITE_INDEXING_ENABLED of [undefined, 'false', 'true']) {
      assert.equal(isIndexingEnabled({ VERCEL_ENV, SITE_INDEXING_ENABLED }), VERCEL_ENV === 'production' && SITE_INDEXING_ENABLED === 'true');
    }
  }
});

test('social metadata preserves actual uploaded dimensions and never invents unknown dimensions', () => {
  const input = { title: 'Example article', description: 'Example description', path: '/resources/esim/example' };
  const src = 'https://cdn.0xmason.com/media/example.webp';
  assert.deepEqual(pageMetadata({ ...input, image: { src, width: 1600, height: 900 } }).openGraph?.images, [{ url: src, width: 1600, height: 900, alt: input.title }]);
  assert.deepEqual(pageMetadata({ ...input, image: src }).openGraph?.images, [{ url: src, alt: input.title }]);
  assert.deepEqual(pageMetadata(input).openGraph?.images, [{ url: site.image, width: 1200, height: 630, alt: input.title }]);
  assert.equal(pageMetadata(input).alternates?.canonical, `${site.url}${input.path}`);
});

test('article metadata uses the real update timestamp without fabricating a publication date', () => {
  const updatedAt = '2026-01-02T03:04:05.000Z';
  const metadata = pageMetadata({ title: 'Example', description: 'Description', path: '/example', article: { updatedAt } });
  assert.equal((metadata.openGraph as { modifiedTime?: string }).modifiedTime, updatedAt);
  assert.equal((metadata.openGraph as { publishedTime?: string }).publishedTime, undefined);
});

test('structured data cannot close its script element through article content', () => {
  const value = { '@type': 'BlogPosting', headline: '</script><script>alert(1)</script>' };
  const html = renderToStaticMarkup(createElement(StructuredData, { value }));
  assert.equal((html.match(/<script/g) || []).length, 1);
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  assert.deepEqual(JSON.parse(html.slice(html.indexOf('>') + 1, html.lastIndexOf('</script>'))), value);
});

test('titles that already name the site skip the brand suffix', () => {
  const about = pageMetadata({ title: '关于 Mason', description: 'About', path: '/about' });
  assert.deepEqual(about.title, { absolute: '关于 Mason' });
  assert.equal(about.openGraph?.title, '关于 Mason');
  const article = pageMetadata({ title: 'Gate U卡实测', description: 'Article', path: '/resources/global-accounts/gate-card' });
  assert.equal(article.title, 'Gate U卡实测');
  assert.equal(article.openGraph?.title, 'Gate U卡实测 · Mason');
});

test('IndexNow submits absolute URLs only from indexed production', async () => {
  const calls: RequestInit[] = [];
  const { fetch: realFetch } = globalThis;
  const env = { VERCEL_ENV: process.env.VERCEL_ENV, SITE_INDEXING_ENABLED: process.env.SITE_INDEXING_ENABLED };
  globalThis.fetch = async (_url, init) => { calls.push(init!); return new Response(null, { status: 202 }); };
  try {
    process.env.VERCEL_ENV = 'preview';
    process.env.SITE_INDEXING_ENABLED = 'true';
    await submitToIndexNow(['/']);
    assert.equal(calls.length, 0);
    process.env.VERCEL_ENV = 'production';
    await submitToIndexNow(['/resources/esim/saily', '/']);
    assert.deepEqual(JSON.parse(String(calls[0].body)), { host: '0xmason.com', key: indexNowKey, urlList: [`${site.url}/resources/esim/saily`, `${site.url}/`] });
    assert.equal(readFileSync(new URL(`../public/${indexNowKey}.txt`, import.meta.url), 'utf8'), indexNowKey);
  } finally {
    globalThis.fetch = realFetch;
    for (const [key, value] of Object.entries(env)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

test('Payload client hints stay on the admin so public pages are not fetched twice', async () => {
  const { default: config } = await import('../next.config');
  const rules = await config.headers!();
  const hinted = rules.filter((rule) => rule.headers.some(({ key }) => key === 'Critical-CH'));
  assert.deepEqual(hinted.map((rule) => rule.source), ['/admin/:path*']);
});
