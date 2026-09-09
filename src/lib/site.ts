import type { Metadata } from "next";
import { assetUrl } from './cdn';

export const site = {
  name: "Mason",
  url: "https://0xmason.com",
  title: "Mason · 独立开发，分享实践",
  description: "我是 Mason，前产品经理，现在全职开发 AI 产品，记录 U 卡、全球账户、eSIM 和订阅支付",
  social: "https://x.com/mason0x_",
  image: assetUrl('images/social/mason.png'),
};

// Launch requires both the production environment and an explicit indexing opt-in.
export function isIndexingEnabled(environment = process.env) {
  return environment.VERCEL_ENV === "production" && environment.SITE_INDEXING_ENABLED === "true";
}

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

export function pageMetadata({ title, description, path, image = site.image, indexable = true, article }: {
  title: string;
  description: string;
  path: string;
  image?: string;
  indexable?: boolean;
  article?: { updatedAt: string };
}): Metadata {
  const index = isIndexingEnabled() && indexable;
  const socialTitle = title === site.title ? title : `${title} · ${site.name}`;
  const images = [{ url: absoluteUrl(image), width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
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
    twitter: { card: "summary_large_image", title: socialTitle, description, creator: "@mason0x_", images },
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
