import { site } from './site';

export function internalArticleHref(href: string | undefined) {
  if (!href) return undefined;
  try {
    const url = new URL(href, site.url);
    if (!['http:', 'https:'].includes(url.protocol) || !['0xmason.com', 'www.0xmason.com'].includes(url.host)) return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}
