import { APIError, type CollectionConfig } from 'payload';
import { createHash } from 'node:crypto';
import { parse } from 'node:path';
import { isAdmin } from '../access';
import { MEDIA_PREFIX, mediaUrl } from '../../lib/cdn';
import { compressImage, IMAGE_INPUT_OPTIONS, IMAGE_MAX_WIDTH, IMAGE_POLICY_VERSION, IMAGE_SIZES, WEBP_OPTIONS } from '../image-processing';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: '图片', plural: '媒体库' },
  admin: { useAsTitle: 'alt', group: '内容', defaultColumns: ['filename', 'alt', 'updatedAt'], description: '上传后自动压缩为 WebP，并生成手机和桌面尺寸，通过 cdn.0xmason.com 展示' },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: () => false },
  upload: {
    disableLocalStorage: true,
    cacheTags: false,
    pasteURL: false,
    handlers: [(_req, { params }) => Response.redirect(mediaUrl(params.filename), 308)],
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'],
    constructorOptions: IMAGE_INPUT_OPTIONS,
    formatOptions: { format: 'webp', options: WEBP_OPTIONS },
    resizeOptions: { width: IMAGE_MAX_WIDTH, fit: 'inside', withoutEnlargement: true },
    withMetadata: false,
    adminThumbnail: 'thumbnail',
    imageSizes: IMAGE_SIZES.map(({ name, width }) => ({
      name, width, fit: 'inside',
      ...(name === 'thumbnail' ? { withoutEnlargement: true } : {}),
      formatOptions: { format: 'webp', options: WEBP_OPTIONS },
    })),
  },
  hooks: {
    beforeOperation: [({ args, operation, req }) => {
      if ((operation === 'create' || operation === 'update') && req.file?.data) {
        const { name, ext } = parse(req.file.name);
        const digest = createHash('sha256').update(IMAGE_POLICY_VERSION).update(req.file.data).digest('hex').slice(0, 16);
        req.file.name = `${name.replace(/-[a-f0-9]{16}$/, '')}-${digest}${ext.toLowerCase()}`;
      }
      return args;
    }],
    beforeValidate: [async ({ data, req }) => {
      if (!data) return data;
      const edits = req.query?.uploadEdits;
      const hasCrop = edits && typeof edits === 'object' && 'crop' in edits;
      // Payload crop edits can retain the source encoding after its format transform.
      if (req.file?.data?.length && (req.file.data.subarray(8, 12).toString('ascii') !== 'WEBP' || hasCrop)) {
        const image = await compressImage(req.file.data);
        req.file = { ...req.file, data: image.data, size: image.data.length, mimetype: 'image/webp' };
        data = { ...data, filename: data.filename?.replace(/\.[^.]+$/, '.webp'), mimeType: 'image/webp', filesize: image.data.length, width: image.width, height: image.height };
      }
      // Editing a stored file bypasses beforeOperation's file hook; use a new CDN URL.
      if (req.file?.data?.length && edits && data.filename) {
        const digest = createHash('sha256').update(IMAGE_POLICY_VERSION).update(req.file.data).update(JSON.stringify(edits)).digest('hex').slice(0, 16);
        const stem = parse(data.filename).name.replace(/-[a-f0-9]{16}$/, '');
        data.filename = `${stem}-${digest}.webp`;
        for (const size of Object.values(data.sizes || {}) as { filename?: string; width?: number; height?: number }[]) {
          if (size.filename) size.filename = `${stem}-${digest}-${size.width}x${size.height}.webp`;
        }
      }
      if ((data.filename && !data.filename.endsWith('.webp')) || (data.mimeType && data.mimeType !== 'image/webp')) throw new APIError('媒体库只保存压缩后的 WebP 图片', 400);
      return { ...data, prefix: MEDIA_PREFIX };
    }],
  },
  fields: [
    { name: 'alt', label: '图片说明', type: 'text', required: true },
    { name: 'caption', label: '图注', type: 'text' },
  ],
};
