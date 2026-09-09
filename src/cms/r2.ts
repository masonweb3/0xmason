import './environment';

export function r2StorageConfig() {
  const required = ['MASON_CMS_R2_ENDPOINT', 'MASON_CMS_R2_BUCKET', 'MASON_CMS_R2_ACCESS_KEY_ID', 'MASON_CMS_R2_SECRET_ACCESS_KEY'] as const;
  for (const key of required) {
    if (!process.env[key]) throw new Error(`${key} is required. Website images are stored in Cloudflare R2 only.`);
  }
  const endpoint = process.env.MASON_CMS_R2_ENDPOINT!;
  if (!/^https:\/\/[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/.test(endpoint)) {
    throw new Error('MASON_CMS_R2_ENDPOINT must be a Cloudflare R2 S3 endpoint.');
  }
  return {
    bucket: process.env.MASON_CMS_R2_BUCKET!,
    config: {
      endpoint,
      region: 'auto',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MASON_CMS_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.MASON_CMS_R2_SECRET_ACCESS_KEY!,
      },
    },
  };
}
