import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

// These values only configure an ephemeral local database and a non-existent R2 endpoint.
const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error('Pass a command to run with isolated CI configuration.');
const env = {
  ...process.env,
  MASON_CMS_DATABASE_URL: process.env.CI_DATABASE_URL || 'postgresql://postgres:ci@127.0.0.1:5432/mason_cms_ci',
  MASON_CMS_SECRET: randomBytes(48).toString('hex'),
  MASON_CMS_ORIGIN: 'http://127.0.0.1:3000',
  MASON_CMS_R2_ENDPOINT: `https://${'0'.repeat(32)}.r2.cloudflarestorage.com`,
  MASON_CMS_R2_BUCKET: 'ci-no-uploads',
  MASON_CMS_R2_ACCESS_KEY_ID: 'ci-placeholder',
  MASON_CMS_R2_SECRET_ACCESS_KEY: 'ci-placeholder',
  SITE_INDEXING_ENABLED: 'false',
  NEXT_TELEMETRY_DISABLED: '1',
};
const result = spawnSync(command, args, { env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
