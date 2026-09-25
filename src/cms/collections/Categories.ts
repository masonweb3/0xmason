import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access';

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: '分类', plural: '分类' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'sortOrder'], group: '内容' },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: () => false },
  fields: [
    { name: 'title', label: '分类名称', type: 'text', required: true },
    { name: 'slug', label: '分类路径', type: 'select', required: true, unique: true, options: [
      { label: '账户与支付', value: 'global-accounts' }, { label: 'eSIM 保号', value: 'esim' }, { label: 'AI 测评', value: 'ai-reviews' },
    ] },
    { name: 'summary', label: '标题关键词', type: 'text', required: true, admin: { description: '接在分类名后作为搜索标题，例如「账户与支付：银行卡、全球账户与 AI 订阅」' } },
    { name: 'description', label: '目录简介', type: 'textarea', required: true },
    { name: 'sortOrder', label: '排序', type: 'number', required: true, defaultValue: 0 },
  ],
};
