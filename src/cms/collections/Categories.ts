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
      { label: '账户与支付', value: 'global-accounts' }, { label: 'eSIM 保号', value: 'esim' },
    ] },
    { name: 'summary', label: '首页简介', type: 'text', required: true },
    { name: 'description', label: '目录简介', type: 'textarea', required: true },
    { name: 'sortOrder', label: '排序', type: 'number', required: true, defaultValue: 0 },
  ],
};
