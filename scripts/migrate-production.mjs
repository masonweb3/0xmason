import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const connection = new URL(process.env.MASON_CMS_DATABASE_URL || 'http://invalid');
if (!connection.hostname.endsWith('.pooler.supabase.com') || connection.port !== '5432' || connection.username.split('.')[0] === 'postgres') {
  throw new Error('Migrations require a Supabase session pooler connection with a dedicated application role.');
}
// Schema migrations do not run authentication or media operations. Do not load their production secrets.
const result = spawnSync(process.execPath, ['node_modules/payload/bin.js', 'migrate'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    MASON_CMS_SECRET: randomBytes(48).toString('hex'),
    MASON_CMS_ORIGIN: 'http://127.0.0.1:3000',
    MASON_CMS_R2_ENDPOINT: `https://${'0'.repeat(32)}.r2.cloudflarestorage.com`,
    MASON_CMS_R2_BUCKET: 'migration-no-uploads',
    MASON_CMS_R2_ACCESS_KEY_ID: 'migration-placeholder',
    MASON_CMS_R2_SECRET_ACCESS_KEY: 'migration-placeholder',
  },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
