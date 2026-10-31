import { CDN_ORIGIN, MEDIA_PREFIX } from './cdn';
import { fromMarkdown } from 'mdast-util-from-markdown';
import type { Root, RootContent } from 'mdast';

export function articleMediaReferences(markdown: string, images: Record<string, { mediaId?: number }>) {
  const ids = [...new Set(Object.values(images).flatMap((image) => typeof image?.mediaId === 'number' && Number.isSafeInteger(image.mediaId) && image.mediaId > 0 ? [image.mediaId] : []))];
  const filenames = new Set<string>();
  function visit(node: Root | RootContent) {
    if (node.type === 'image' || node.type === 'definition') {
      try {
        const parsed = new URL(node.url);
        if (parsed.origin === CDN_ORIGIN && parsed.pathname.startsWith(`/${MEDIA_PREFIX}/`)) filenames.add(decodeURIComponent(parsed.pathname.slice(`/${MEDIA_PREFIX}/`.length)));
      } catch { /* Malformed image URLs remain unresolved, as in the renderer. */ }
    }
    if ('children' in node) node.children.forEach(visit);
  }
  visit(fromMarkdown(markdown));
  return { ids, filenames: [...filenames] };
}

export function headingId(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

export function parseArticleContent(original: string) {
  // The page header renders the source title and cover once; the source file stays intact.
  let body = original.replace(/^# .+\r?\n\s*!\[[^\]]*\]\([^)]+\)\s*/, "")
    // CommonMark needs a boundary after emphasis ending in punctuation before CJK text.
    .replace(/\*\*([^*\n]+[\p{P}\p{S}])\*\*(?=[\p{L}\p{N}])/gu, "**$1** ");
  // Older articles start at level three; preserve nested headings in newer articles.
  if (!/^## /m.test(body)) body = body.replace(/^### /gm, "## ");
  const headings = [...body.matchAll(/^## (.+)$/gm)].map((match) => ({ title: match[1], id: headingId(match[1]) }));
  const chineseCharacters = (body.match(/[\p{Script=Han}]/gu) ?? []).length;
  const words = (body.match(/[a-zA-Z0-9]+/g) ?? []).length;
  const readingMinutes = Math.max(1, Math.ceil(chineseCharacters / 400 + words / 200));
  return { body, headings, readingMinutes };
}
