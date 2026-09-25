import { getCategories, getResources, resourceHref } from '@/lib/resources';
import { absoluteUrl, site } from '@/lib/site';

export const dynamic = 'force-dynamic';

const escapeXML = (value: string) => value.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`);

// Summaries only; pubDate is the real update time because the CMS has no reliable first-publish date.
export async function GET() {
  const [categories, resources] = await Promise.all([getCategories(), getResources()]);
  const categoryTitle = new Map(categories.map((category) => [category.slug, category.title]));
  const items = resources.map((article) => {
    const url = absoluteUrl(resourceHref(article));
    return `<item><title>${escapeXML(article.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${escapeXML(article.summary)}</description><category>${escapeXML(categoryTitle.get(article.category) || '')}</category><pubDate>${new Date(article.updatedAt).toUTCString()}</pubDate></item>`;
  }).join('');
  const feed = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXML(site.title)}</title><link>${site.url}</link><description>${escapeXML(site.description)}</description><language>zh-CN</language><atom:link href="${absoluteUrl('/feed.xml')}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(feed, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
