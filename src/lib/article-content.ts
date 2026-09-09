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
