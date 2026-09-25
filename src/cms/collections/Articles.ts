import { APIError, type CollectionConfig } from 'payload';
import { isAdmin, readPublished, validateSlug } from '../access';
import { submitToIndexNow } from '../../lib/site';

function hasContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const node = value as { type?: string; text?: string; value?: unknown; children?: unknown[]; root?: unknown };
  return Boolean(node.text?.trim() || (node.type === 'upload' && node.value) || node.children?.some(hasContent) || (node.root && hasContent(node.root)));
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: '文章', plural: '文章' },
  admin: {
    useAsTitle: 'title', group: '内容', defaultColumns: ['title', 'category', '_status', 'updatedAt'],
    preview: (doc) => doc.id ? `/preview/${doc.id}` : null,
    description: '保存草稿后可预览，发布后前台读取正式版本',
  },
  access: { read: readPublished, create: isAdmin, update: isAdmin, delete: isAdmin, readVersions: isAdmin },
  versions: { drafts: true, maxPerDoc: 25 },
  hooks: { beforeChange: [({ data, originalDoc }) => {
    const next = { ...originalDoc, ...data };
    if (next._status === 'published') {
      if (next.bodyFormat === 'markdown' && !next.markdown?.trim()) throw new APIError('发布前请填写正文', 400);
      if (next.bodyFormat === 'richtext' && !hasContent(next.body)) throw new APIError('发布前请填写正文', 400);
    }
    return data;
  }], afterChange: [async ({ doc, req }) => {
    if (doc._status !== 'published') return;
    const category = typeof doc.category === 'object' ? doc.category : await req.payload.findByID({ collection: 'categories', id: doc.category, depth: 0, req });
    await submitToIndexNow([`/resources/${category.slug}/${doc.slug}`, `/resources/${category.slug}`, '/']);
  }] },
  fields: [
    { name: 'title', label: '标题', type: 'text', required: true },
    { type: 'row', fields: [
      { name: 'slug', label: '文章路径', type: 'text', required: true, unique: true, validate: validateSlug, admin: { width: '50%' } },
      { name: 'category', label: '分类', type: 'relationship', relationTo: 'categories', required: true, admin: { width: '50%' } },
    ] },
    { name: 'summary', label: '摘要', type: 'textarea', required: true },
    { name: 'brands', label: '品牌', type: 'join', collection: 'brands', on: 'articles', defaultLimit: 20,
      admin: { allowCreate: true, defaultColumns: ['name', 'kind'], description: '首页首屏按这里的品牌加 logo。新品牌点「新建」；已有的品牌到「品牌」里把这篇文章勾上' } },
    { name: 'cover', label: '封面', type: 'upload', relationTo: 'media' },
    { name: 'recordedAt', label: '记录月份', type: 'text', admin: { placeholder: '2026-09' }, validate: (value: string | null | undefined) => !value || /^\d{4}-(0[1-9]|1[0-2])$/.test(value) || '使用 YYYY-MM 格式' },
    { name: 'bodyFormat', label: '正文格式', type: 'radio', defaultValue: 'richtext', required: true, options: [{ label: '图文编辑', value: 'richtext' }, { label: 'Markdown', value: 'markdown' }], admin: { layout: 'horizontal', description: '切换格式不会自动转换已有正文' } },
    { name: 'body', label: '正文', type: 'richText', admin: { condition: (_, sibling) => sibling.bodyFormat !== 'markdown' } },
    { name: 'markdown', label: 'Markdown 正文', type: 'code', admin: { language: 'markdown', condition: (_, sibling) => sibling.bodyFormat === 'markdown' } },
    { name: 'sourceImageMap', label: '原稿图片映射', type: 'json', admin: { hidden: true } },
    { name: 'affiliateLinks', label: '推荐链接', type: 'relationship', relationTo: 'affiliate-links', hasMany: true },
    { name: 'hasAffiliate', label: '显示推荐披露', type: 'checkbox', defaultValue: false },
    { type: 'collapsible', label: '搜索与分享', fields: [
      { name: 'seoTitle', label: 'SEO 标题', type: 'text' },
      { name: 'seoDescription', label: 'SEO 描述', type: 'textarea' },
      { name: 'shareImage', label: '分享图', type: 'upload', relationTo: 'media' },
      { name: 'legacyShareImage', type: 'text', admin: { hidden: true } },
    ] },
  ],
};
