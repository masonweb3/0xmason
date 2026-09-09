import type { Access, Where, PayloadRequest } from 'payload';

export const isAdmin = ({ req }: { req: PayloadRequest }): boolean => req.user?.collection === 'users';
export const published: Where = { _status: { equals: 'published' } };
export const readPublished: Access = ({ req }) => req.user?.collection === 'users' ? true : published;
export function validateSlug(value: unknown) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || '使用小写字母、数字和连字符';
}
export function validateHTTPS(value: unknown) {
  if (!value) return true;
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' && !url.username && !url.password || '请输入完整的 HTTPS 链接';
  } catch { return '请输入完整的 HTTPS 链接'; }
}
