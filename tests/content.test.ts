import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseArticleContent, headingId } from '../src/lib/article-content';
import { cdnUrl, isWebPImage, mediaUrl } from '../src/lib/cdn';
import { validateHTTPS, validateSlug } from '../src/cms/access';

test('source title and cover appear once, and heading hierarchy remains navigable', () => {
  const source = '# 示例标题\n\n![封面](cover.png)\n\n## 开始使用\n\n正文\n\n### 第二步\n';
  const result = parseArticleContent(source);
  assert.ok(!result.body.includes('# 示例标题'));
  assert.deepEqual(result.headings, [{ title: '开始使用', id: '开始使用' }]);
  assert.ok(result.body.includes('### 第二步'));
  assert.ok(source.startsWith('# 示例标题'));
  assert.equal(headingId('账户与支付 / AI'), '账户与支付-ai');
});

test('CDN addresses reject foreign origins, traversal and credentials', () => {
  assert.equal(isWebPImage('https://cdn.0xmason.com/media/example.webp'), true);
  for (const url of ['https://cdn.0xmason.com.evil.example/a.webp', 'https://user:password@cdn.0xmason.com/a.webp', 'http://cdn.0xmason.com/a.webp', 'https://cdn.0xmason.com/a.png']) assert.equal(isWebPImage(url), false);
  for (const key of ['../private', 'media/../private', '/absolute', 'media\\private']) assert.throws(() => cdnUrl(key));
  assert.throws(() => mediaUrl('../private.webp'));
  assert.throws(() => mediaUrl('valid.webp', 'private'));
});

test('editor links reject unsafe protocols and embedded credentials', () => {
  assert.equal(validateHTTPS('https://example.com/path'), true);
  for (const value of ['javascript:alert(1)', 'http://example.com', 'https://user:password@example.com']) assert.notEqual(validateHTTPS(value), true);
  assert.equal(validateSlug('example-2026'), true);
  for (const value of ['../admin', 'Two Words', 'foo/bar', '']) assert.notEqual(validateSlug(value), true);
});
