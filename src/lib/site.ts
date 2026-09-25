import type { Metadata } from "next";
import { assetUrl, assetMetadata } from './cdn';

export const site = {
  name: "Mason",
  url: "https://0xmason.com",
  title: "U 卡、全球账户、eSIM 开卡实测 · Mason",
  description: "Mason 亲自开卡、付过账单的实测记录：U 卡、香港和澳门银行开户、全球账户、海外 eSIM 保号，以及 ChatGPT、Claude 订阅的付款方式。",
  social: "https://x.com/mason0x_",
  image: assetUrl('images/social/mason.png'),
};

// One author entity for every page; its url is the about page, as Google recommends for article authors.
export const author = {
  "@type": "Person", "@id": `${site.url}/#person`, name: site.name, alternateName: "0xmason", url: `${site.url}/about`,
  image: assetUrl('images/avatar.png'), description: "前产品经理，现在全职开发 AI 产品", sameAs: [site.social, "https://github.com/masonweb3"],
};

// Launch requires both the production environment and an explicit indexing opt-in.
export function isIndexingEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === "production" && environment.SITE_INDEXING_ENABLED === "true";
}

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

// Public by design: IndexNow verifies ownership through public/<key>.txt.
export const indexNowKey = "0xmason-indexnow";

// Bing, and the search products built on its index, learn about a published page now instead of on the next sitemap crawl.
export async function submitToIndexNow(paths: string[]) {
  if (!isIndexingEnabled()) return;
  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(site.url).host, key: indexNowKey, urlList: paths.map(absoluteUrl) }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) console.error(`IndexNow returned ${response.status}`);
  } catch (error) {
    console.error("IndexNow submission failed", error);
  }
}

export function pageMetadata({ title, description, path, image = site.image, indexable = true, article }: {
  title: string;
  description: string;
  path: string;
  image?: string | { src: string; width?: number; height?: number };
  indexable?: boolean;
  article?: { updatedAt: string };
}): Metadata {
  const index = isIndexingEnabled() && indexable;
  const branded = title.includes(site.name);
  const socialTitle = branded ? title : `${title} · ${site.name}`;
  const source = typeof image === 'string' ? { src: image, ...assetMetadata(image) } : image;
  const images = [{ url: absoluteUrl(source.src), ...(source.width && source.height ? { width: source.width, height: source.height } : {}), alt: title }];
  return {
    title: branded ? { absolute: title } : title,
    description,
    alternates: { canonical: absoluteUrl(path), types: { "application/rss+xml": absoluteUrl("/feed.xml") } },
    authors: [{ name: site.name, url: site.url }],
    robots: {
      index,
      follow: index,
      googleBot: { index, follow: index, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      title: socialTitle,
      description,
      url: absoluteUrl(path),
      siteName: site.name,
      locale: "zh_CN",
      images,
      ...(article ? { type: "article" as const, authors: [site.url], modifiedTime: article.updatedAt } : { type: "website" as const }),
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, site: "@mason0x_", creator: "@mason0x_", images },
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path),
    })),
  };
}
