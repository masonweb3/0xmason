import { CDNImage as Image } from './cdn-image';
import Markdown, { type Components } from "react-markdown";
import remarkGfm from 'remark-gfm';
import { headingId } from "@/lib/article-content";
import { internalArticleHref } from '@/lib/article-links';
import type { ArticleImage } from "@/lib/resources";

export function ArticleMarkdown({ content, images, affiliateUrls = [] }: { content: string; images: Record<string, ArticleImage>; affiliateUrls?: string[] }) {
const components: Components = {
  h2({ children }) {
    return <h2 id={headingId(String(children))}>{children}</h2>;
  },
  p({ node, children }) {
    const containsImage = node?.children.some((child) => child.type === "element" && child.tagName === "img");
    return containsImage ? <div className="article-image-paragraph">{children}</div> : <p>{children}</p>;
  },
  img({ src, alt }) {
    const image = typeof src === "string" ? images[src] : undefined;
    if (!image) return <span className="article-note">{alt || "图片"}（请先添加到媒体库）</span>;
    return (
      <figure className={`article-figure${image.height > image.width ? " article-figure-portrait" : ""}`}>
        <a href={image.src} target="_blank" rel="noopener noreferrer" aria-label={`查看原图：${alt ?? "文章截图"}（新标签页）`}>
          <Image src={image.src} sources={image.sources} alt={alt ?? "文章截图"} width={image.width} height={image.height} sizes={image.height > image.width ? '(max-width: 767px) 90vw, 440px' : '(max-width: 767px) 90vw, 680px'} />
        </a>
        <figcaption>{alt}</figcaption>
      </figure>
    );
  },
  a({ href, children }) {
    // GFM includes a following Chinese parenthesis in a literal URL.
    const referral = affiliateUrls.find((url) => href === url || href?.startsWith(`${url}%EF%BC%88`));
    const annotation = referral && typeof children === 'string' && children.startsWith(`${referral}（`) ? children.slice(referral.length) : '';
    const internal = !referral && internalArticleHref(href);
    if (internal) return <a href={href?.startsWith('#') ? href : internal}>{children}</a>;
    return <><a href={referral || href} target="_blank" rel={`${referral ? 'sponsored ' : ''}nofollow noopener noreferrer`}>{annotation ? referral : children}</a>{annotation}</>;
  },
  code({ children }) {
    if (children === "bybit.eu") return <a href="https://www.bybit.eu/" target="_blank" rel="sponsored nofollow noopener noreferrer">bybit.eu</a>;
    if (children === "chatgpt.com") return <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">chatgpt.com</a>;
    return <code>{children}</code>;
  },
};
  return <Markdown components={components} remarkPlugins={[remarkGfm]} skipHtml>{content}</Markdown>;
}
