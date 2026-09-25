import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access';

// The homepage hero is built from these: a brand shows once one of its articles is published.
// Brands seeded by migration point at site assets (iconAsset / cardAsset) instead of media uploads.
export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: '品牌', plural: '品牌' },
  admin: {
    useAsTitle: 'name', group: '内容', defaultColumns: ['name', 'kind', 'articles', 'createdAt'],
    description: '首页首屏自动读取：已发布文章关联的品牌会出现在对应浮层里，最新建的排最前；U 卡的卡面进扇形',
  },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  defaultSort: '-createdAt',
  fields: [
    { type: 'row', fields: [
      { name: 'name', label: '名称', type: 'text', required: true, admin: { width: '50%' } },
      { name: 'kind', label: '类型', type: 'select', required: true, options: [
        { label: 'U 卡', value: 'card' }, { label: '全球账户', value: 'account' }, { label: 'eSIM', value: 'esim' },
      ], admin: { width: '50%' } },
    ] },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media',
      admin: { description: '方形 App 图标，至少 192×192，不用自己切圆角' },
      validate: (value: unknown, { siblingData }: { siblingData: { iconAsset?: string } }) => Boolean(value || siblingData.iconAsset) || '请上传 logo' },
    { name: 'cardImage', label: '卡面', type: 'upload', relationTo: 'media',
      admin: { condition: (_, sibling) => sibling.kind === 'card', description: '卡片正面平放，透明圆角背景，宽 800 以上；不传就只出现在 U 卡浮层里' } },
    { name: 'articles', label: '相关文章', type: 'relationship', relationTo: 'articles', hasMany: true },
    { name: 'iconAsset', type: 'text', admin: { hidden: true } },
    { name: 'cardAsset', type: 'text', admin: { hidden: true } },
  ],
};
