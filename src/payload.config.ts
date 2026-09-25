import { APIError, buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { zh } from '@payloadcms/translations/languages/zh';
import { en } from '@payloadcms/translations/languages/en';
import sharp from 'sharp';
import { resolve } from 'node:path';
import { cmsOrigin, cmsSecret, databasePool } from './cms/environment';
import { r2StorageConfig } from './cms/r2';
import { assetUrl, MEDIA_PREFIX, mediaUrl } from './lib/cdn';
import { Users } from './cms/collections/Users';
import { Articles } from './cms/collections/Articles';
import { Categories } from './cms/collections/Categories';
import { Media } from './cms/collections/Media';
import { AffiliateLinks } from './cms/collections/AffiliateLinks';
import { Brands } from './cms/collections/Brands';

const storage = r2StorageConfig();

export default buildConfig({
  secret: cmsSecret(),
  serverURL: cmsOrigin,
  csrf: [cmsOrigin],
  cookiePrefix: 'mason-cms',
  telemetry: false,
  email: () => ({
    name: 'disabled-until-configured', defaultFromAddress: 'noreply@0xmason.com', defaultFromName: 'Mason',
    sendEmail: async () => { throw new APIError('密码重置邮件尚未配置', 503); },
  }),
  admin: {
    user: 'users',
    meta: { titleSuffix: ' · Mason 后台', icons: [{ rel: 'icon', url: assetUrl('favicon.ico') }], robots: 'noindex, nofollow', openGraph: { images: [{ url: assetUrl('images/social/mason.png'), width: 1200, height: 630 }] } },
    importMap: { baseDir: resolve(process.cwd(), 'src') },
    components: { beforeDashboard: ['/cms/components/Welcome#Welcome'] },
  },
  i18n: { supportedLanguages: { zh, en }, fallbackLanguage: 'zh' },
  editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()] }),
  collections: [Articles, Categories, Brands, Media, AffiliateLinks, Users],
  db: postgresAdapter({ pool: databasePool, schemaName: 'cms', push: false, migrationDir: resolve(process.cwd(), 'src/cms/migrations') }),
  typescript: { outputFile: resolve(process.cwd(), 'src/payload-types.ts') },
  graphQL: { disable: true },
  upload: { limits: { fileSize: 3 * 1024 * 1024 } },
  sharp,
  plugins: [s3Storage({
    ...storage,
    disableLocalStorage: true,
    alwaysInsertFields: true,
    collections: {
      media: {
        prefix: MEDIA_PREFIX,
        disablePayloadAccessControl: true,
        generateFileURL: ({ filename, prefix }) => mediaUrl(filename, prefix || MEDIA_PREFIX),
      },
    },
  })],
});
