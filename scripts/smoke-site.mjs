import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const staged = process.argv[2] === '--deployment';
const base = new URL(process.argv[staged ? 3 : 2] || 'http://127.0.0.1:3000');
if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password) throw new Error('Use an HTTP(S) deployment origin.');

async function read(path) {
  if (!staged) {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(45_000) });
    return { status: response.status, body: await response.text() };
  }
  const args = ['curl', path, '--deployment', base.origin];
  if (process.env.VERCEL_TOKEN) args.push('--token', process.env.VERCEL_TOKEN);
  args.push('--', '--silent', '--show-error', '--include', '--max-time', '45');
  const output = execFileSync('vercel', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const boundary = output.search(/\r?\n\r?\n/);
  const status = Number(output.match(/^HTTP\/\S+\s+(\d+)/m)?.[1]);
  return { status, body: output.slice(boundary).trim() };
}

for (const path of ['/', '/resources', '/resources/global-accounts', '/resources/esim']) {
  const response = await read(path);
  assert.equal(response.status, 200, `${path} HTTP status`);
  assert.match(response.body, /id="main-content"/, `${path} rendered content`);
  assert.match(response.body, /rel="canonical"/, `${path} canonical URL`);
  console.log(`PASS ${path}`);
}
const sitemap = await read('/sitemap.xml');
assert.equal(sitemap.status, 200);
const articles = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname).filter(path => /^\/resources\/[^/]+\/[^/]+$/.test(path)).slice(0, 10);
for (const path of articles) {
  const response = await read(path);
  assert.equal(response.status, 200, `${path} HTTP status`);
  assert.match(response.body, /article-prose/, `${path} body`);
  assert.match(response.body, /BlogPosting/, `${path} structured data`);
  console.log(`PASS ${path}`);
}
for (const path of ['/api/users', '/api/affiliate-links']) {
  const response = await read(path);
  assert.ok([401, 403].includes(response.status), `${path} rejects anonymous access`);
  console.log(`PASS ${path} access boundary`);
}
console.log(`Deployment check passed (${articles.length} published articles).`);
