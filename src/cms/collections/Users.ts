import { APIError, type CollectionConfig } from 'payload';
import { isAdmin } from '../access';
import { cmsOrigin, localCMS } from '../environment';

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: '管理员', plural: '管理员' },
  admin: { useAsTitle: 'email', group: '设置' },
  auth: { tokenExpiration: 7200, maxLoginAttempts: 5, lockTime: 600000, cookies: { secure: new URL(cmsOrigin).protocol === 'https:', sameSite: 'Lax' } },
  access: { admin: isAdmin, create: () => false, read: isAdmin, update: isAdmin, delete: () => false, unlock: () => false },
  hooks: {
    beforeChange: [async ({ operation, req, data }) => {
      if (operation === 'create') {
        const count = await req.payload.count({ collection: 'users', req, overrideAccess: true });
        if (count.totalDocs || (!localCMS && !req.context.bootstrapAdmin)) throw new APIError('管理员已存在，或当前环境不允许首次注册', 403);
      }
      return data;
    }],
  },
  fields: [{ name: 'name', label: '名称', type: 'text', defaultValue: 'Mason', required: true }],
};
