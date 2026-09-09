import type { CollectionConfig } from 'payload';
import { isAdmin, validateHTTPS } from '../access';

export const AffiliateLinks: CollectionConfig = {
  slug: 'affiliate-links',
  labels: { singular: '推荐链接', plural: '推荐链接' },
  admin: { useAsTitle: 'name', group: '内容', defaultColumns: ['name', 'code', 'active', 'expiresAt'] },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'name', label: '名称', type: 'text', required: true },
    { name: 'url', label: '链接', type: 'text', validate: validateHTTPS, required: true },
    { name: 'label', label: '按钮文字', type: 'text', defaultValue: '查看推荐入口', required: true },
    { name: 'code', label: '邀请码或折扣码', type: 'text' },
    { name: 'active', label: '启用入口', type: 'checkbox', defaultValue: true },
    { name: 'expiresAt', label: '到期时间', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' }, description: '到期后保留记录，关闭推荐按钮；留空表示不设到期时间' } },
  ],
};
