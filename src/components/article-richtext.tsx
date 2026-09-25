import { CDNImage as Image } from './cdn-image';
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';
import type { Article, Media } from '@/payload-types';
import { headingId } from '@/lib/article-content';
import { mediaImage } from '@/lib/cdn';

type TextNode = { text?: string; children?: TextNode[]; type?: string; tag?: string };
export function nodeText(node: TextNode): string { return node.text || node.children?.map(nodeText).join('') || ''; }
export function richTextHeadings(body: Article['body']) {
  return body?.root.children.filter((node) => node.type === 'heading' && node.tag === 'h2').map((node) => ({ title: nodeText(node), id: headingId(nodeText(node)) })) || [];
}
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const Tag = node.tag === 'h1' ? 'h2' : node.tag;
    return <Tag id={headingId(nodeText(node))}>{nodesToJSX({ nodes: node.children })}</Tag>;
  },
  upload: ({ node }) => {
    const media = node.value as Media;
    const image = mediaImage(media);
    if (!image) return null;
    return <figure className={`article-figure${image.height > image.width ? ' article-figure-portrait' : ''}`}>
      <a href={image.src} target="_blank" rel="noopener noreferrer" aria-label={`查看原图：${image.alt}`}>
        <Image src={image.src} sources={image.sources} width={image.width} height={image.height} alt={image.alt} sizes={image.height > image.width ? '(max-width: 767px) 90vw, 440px' : '(max-width: 767px) 90vw, 680px'} />
      </a>
      <figcaption>{media.caption || image.alt}</figcaption>
    </figure>;
  },
});
export function ArticleRichText({ body }: { body: NonNullable<Article['body']> }) {
  return <RichText data={body} converters={converters} disableContainer />;
}
