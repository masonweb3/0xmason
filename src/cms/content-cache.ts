import { revalidateTag } from 'next/cache';

export const publicContentCache = { tags: ['cms-public-content-v1'], revalidate: 300 };

export function refreshPublicContent() {
  // CLI migrations have no Next request; HTTP mutations flush tags after the transaction commits.
  if (process.env.NEXT_RUNTIME) revalidateTag(publicContentCache.tags[0], { expire: 0 });
}
