import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { Client } from 'pg';
import { getPayload } from 'payload';
import config from '../src/payload.config';

const database = new URL(process.env.MASON_CMS_DATABASE_URL || 'http://invalid');
if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) || !/^\/mason_cms_ci(?:_[a-z0-9]+)?$/.test(database.pathname)) throw new Error('Cache tests require a disposable loopback mason_cms_ci database.');
const base = 'http://127.0.0.1:3101';
const payload = await getPayload({ config });
const db = new Client({ connectionString: database.href });
await db.connect();
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3101'], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
server.stdout.on('data', (chunk) => { output = (output + chunk).slice(-8000); });
server.stderr.on('data', (chunk) => { output = (output + chunk).slice(-8000); });
const password = randomBytes(24).toString('hex');
const slug = `cache-check-${randomBytes(4).toString('hex')}`;
let token = '';
async function api(path: string, method: string, data?: object) {
  const response = await fetch(`${base}/api/${path}`, { method, signal: AbortSignal.timeout(30_000), headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }, body: data ? JSON.stringify(data) : undefined });
  assert.ok(response.ok, `${method} ${path}: ${response.status}`);
  return response.json();
}
async function page(path: string, title: string, status = 200, authenticated = false) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: authenticated ? { Authorization: `JWT ${token}` } : {} });
  assert.equal(response.status, status, path);
  const html = await response.text();
  if (title) assert.ok(html.includes(title), `${path} contains ${title}`);
  return html;
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(`Next exited: ${output}`);
    ready = await fetch(`${base}/api/categories`, { signal: AbortSignal.timeout(2000) }).then((response) => response.ok, () => false);
    if (ready) break;
    await setTimeout(500);
  }
  assert.ok(ready, `Next started: ${output}`);
  const admin = (await payload.find({ collection: 'users', where: { email: { equals: 'admin@example.invalid' } }, limit: 1 })).docs[0];
  assert.ok(admin, 'Run verify-cms first to create the isolated administrator.');
  await payload.update({ collection: 'users', id: admin.id, data: { password } });
  token = (await api('users/login', 'POST', { email: admin.email, password })).token;
  const categories = (await api('categories?limit=20', 'GET')).docs;
  const original = categories.find((category: { slug: string }) => category.slug === 'global-accounts');
  const destination = categories.find((category: { slug: string }) => category.slug === 'esim') || (await api('categories', 'POST', { title: 'Cache destination', slug: 'esim', summary: 'Cache summary', description: 'Cache description', sortOrder: 1 })).doc;
  const media = await db.query("insert into cms.media (alt, filename, mime_type, width, height, prefix) values ('Mapped', $1, 'image/webp', 800, 400, 'media'), ('Direct', $2, 'image/webp', 900, 450, 'media') returning id, filename", [`${slug}-mapped.webp`, `${slug}-direct.webp`]);
  const mapped = media.rows[0];
  const direct = media.rows[1];
  const article = (await api('articles', 'POST', { title: 'Cache initial title', slug, category: original.id, summary: 'Cache initial summary', bodyFormat: 'markdown', markdown: `## Cache body\n\n![Mapped](legacy.png)\n\n![Direct](https://cdn.0xmason.com/media/${direct.filename})`, sourceImageMap: { 'legacy.png': { mediaId: mapped.id, src: `https://cdn.0xmason.com/media/${mapped.filename}`, width: 800, height: 400, alt: 'Mapped' } }, _status: 'published' })).doc;
  const path = `/resources/global-accounts/${slug}`;
  const brand = (await api('brands', 'POST', { name: 'CACHE BRAND INITIAL', kind: 'account', logo: mapped.id, articles: [article.id] })).doc;
  await page('/', `https://cdn.0xmason.com/media/${mapped.filename}`);
  await api(`brands/${brand.id}`, 'PATCH', { logo: direct.id });
  await page('/', `https://cdn.0xmason.com/media/${direct.filename}`);
  await api(`brands/${brand.id}`, 'DELETE');
  assert.ok(!(await page('/', '')).includes(`https://cdn.0xmason.com/media/${direct.filename}`));
  console.log('PASS homepage brand creation, edits and deletion invalidate its shared cache');
  const html = await page(path, 'Cache initial title');
  for (const image of media.rows) assert.ok(html.includes(`https://cdn.0xmason.com/media/${image.filename}`), 'Mapped and direct images render');
  assert.ok(!html.includes('请先添加到媒体库'));
  for (const listing of ['/', '/resources/global-accounts', '/feed.xml']) await page(listing, 'Cache initial title');
  await db.query('update cms.articles set title=$1 where id=$2', ['Direct database edit', article.id]);
  await page(path, 'Cache initial title');
  for (const listing of ['/', '/resources/global-accounts', '/feed.xml']) await page(listing, 'Cache initial title');
  console.log('PASS shared cache survives separate HTTP requests without reading changed database rows');

  await api(`articles/${article.id}`, 'PATCH', { title: 'Cache published revision', summary: 'Cache revised summary', _status: 'published' });
  for (const target of [path, '/', '/resources/global-accounts', '/feed.xml']) await page(target, 'Cache published revision');
  await api(`articles/${article.id}?draft=true`, 'PATCH', { title: 'PRIVATE DRAFT REVISION', _status: 'draft' });
  assert.ok(!(await page(path, 'Cache published revision')).includes('PRIVATE DRAFT REVISION'));
  await page(`/preview/${article.id}`, 'PRIVATE DRAFT REVISION', 200, true);
  await page(`/preview/${article.id}`, '', 404);
  await api(`articles/${article.id}?draft=false`, 'PATCH', { _status: 'draft' });
  await page(path, '', 404);
  assert.ok(!(await page('/feed.xml', '')).includes(slug));
  await api(`articles/${article.id}`, 'PATCH', { title: 'Cache republished title', category: destination.id, _status: 'published' });
  const redirect = await fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), `/resources/esim/${slug}`);
  const moved = `/resources/esim/${slug}`;
  await page(moved, 'Cache republished title');
  console.log('PASS publication, private draft preview, unpublishing, republishing and category redirects');

  await api(`media/${direct.id}`, 'PATCH', { width: 760 });
  assert.ok((await page(moved, '')).includes('width="760"'), 'Media edits refresh article image metadata');
  await api(`categories/${destination.id}`, 'PATCH', { title: 'Updated cache category' });
  await page(moved, 'Updated cache category');
  const expiresAt = new Date(Date.now() + 8000).toISOString();
  const affiliate = (await api('affiliate-links', 'POST', { name: 'Cache link', url: 'https://example.com/cache-link', label: 'CACHE ACTIVE LINK', active: true, expiresAt })).doc;
  await api(`articles/${article.id}`, 'PATCH', { affiliateLinks: [affiliate.id] });
  await page(moved, 'CACHE ACTIVE LINK');
  await setTimeout(Math.max(0, Date.parse(expiresAt) - Date.now()) + 100);
  const expired = await page(moved, '推荐入口已结束');
  assert.ok(!expired.includes('>CACHE ACTIVE LINK<'), 'Expiry is evaluated outside the shared cache');
  await api(`affiliate-links/${affiliate.id}`, 'PATCH', { expiresAt: null, label: 'CACHE REFRESHED LINK' });
  await page(moved, 'CACHE REFRESHED LINK');
  await api(`articles/${article.id}`, 'PATCH', { slug: `${slug}-renamed` });
  await page(moved, '', 404);
  await page(`${moved}-renamed`, 'Cache republished title');
  await api(`articles/${article.id}`, 'DELETE');
  await page(`${moved}-renamed`, '', 404);
  assert.ok(!(await page('/feed.xml', '')).includes(slug));
  console.log('PASS media/category/link invalidation, timed link expiry, slug changes and deletion');
} finally {
  if (server.exitCode === null) await new Promise<void>((resolve) => { server.once('exit', () => resolve()); server.kill('SIGTERM'); });
  await db.end();
  await payload.destroy();
}
process.exit(0);
