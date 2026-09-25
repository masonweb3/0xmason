import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArticleMarkdown } from '../src/components/article-markdown';
import { internalArticleHref } from '../src/lib/article-links';

test('site article links use the canonical host and keep their destination', () => {
  for (const origin of ['https://0xmason.com', 'http://0xmason.com', 'https://www.0xmason.com']) {
    assert.equal(internalArticleHref(`${origin}/resources/esim/xesim?source=article#install`), '/resources/esim/xesim?source=article#install');
  }
  assert.equal(internalArticleHref('/resources/esim/xesim'), '/resources/esim/xesim');
});

test('external and unsafe URLs cannot become site links', () => {
  for (const href of [undefined, '', 'https://0xmason.com.example.org/', 'https://0xmason.com@other.example/', '//other.example/', 'javascript:alert(1)', 'mailto:hello@example.org']) {
    assert.equal(internalArticleHref(href), undefined, String(href));
  }
});

test('rendered article links distinguish editorial cross-links from paid referrals', () => {
  const html = renderToStaticMarkup(createElement(ArticleMarkdown, {
    content: '[教程](https://0xmason.com/resources/esim/xesim) [推荐](https://shop.example/ref) [来源](https://source.example/)',
    images: {},
    affiliateUrls: ['https://shop.example/ref'],
  }));
  assert.match(html, /<a href="\/resources\/esim\/xesim">教程<\/a>/);
  assert.match(html, /href="https:\/\/shop\.example\/ref" target="_blank" rel="sponsored nofollow noopener noreferrer"/);
  assert.match(html, /href="https:\/\/source\.example\/" target="_blank" rel="nofollow noopener noreferrer"/);
});

test('CDN mp4 embeds render as videos; other sources stay images', () => {
  const html = renderToStaticMarkup(createElement(ArticleMarkdown, {
    content: '![并排版](https://cdn.0xmason.com/media/video/a.mp4)\n\n![外站](https://other.example/a.mp4)',
    images: {},
  }));
  assert.match(html, /<video src="https:\/\/cdn\.0xmason\.com\/media\/video\/a\.mp4#t=0\.1" controls="" playsInline="" preload="metadata" aria-label="并排版"><\/video><figcaption>并排版<\/figcaption>/);
  assert.doesNotMatch(html, /other\.example[^"]*"[^>]*controls/);
});
