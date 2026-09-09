import { parse } from 'dotenv';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { supabaseCA } from './supabase-ca';

try {
  const values = parse(readFileSync(/* turbopackIgnore: true */ resolve(process.cwd(), '.env')));
  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith('MASON_CMS_') && process.env[key] === undefined) process.env[key] = value;
  }
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

export const localCMS = !process.env.VERCEL && !process.env.MASON_CMS_DATABASE_URL;
export const runtimeDirectory = resolve(/* turbopackIgnore: true */ process.env.MASON_CMS_RUNTIME_DIR || resolve(homedir(), '.local/share/0xmason'));
export const cmsOrigin = process.env.MASON_CMS_ORIGIN || (process.env.VERCEL ? 'https://0xmason.com' : 'http://127.0.0.1:3000');

export function cmsSecret() {
  const secret = process.env.MASON_CMS_SECRET;
  if (!secret || secret.length < 32) throw new Error('MASON_CMS_SECRET is required (at least 32 characters). Run npm run cms:db for local setup.');
  return secret;
}

const databaseURL = process.env.MASON_CMS_DATABASE_URL;
const databaseHost = databaseURL ? new URL(databaseURL).hostname : '';
const loopbackDatabase = ['localhost', '127.0.0.1', '[::1]'].includes(databaseHost);

export const databasePool = localCMS ? {
  host: resolve(runtimeDirectory, 'socket'),
  port: 55439,
  user: 'mason_cms',
  database: process.env.MASON_CMS_TEST_DATABASE || 'mason_cms',
  max: 5,
} : {
  connectionString: databaseURL,
  ssl: loopbackDatabase ? false : { rejectUnauthorized: true, ca: databaseHost.endsWith('.pooler.supabase.com') ? supabaseCA : undefined },
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
};

if (!localCMS && !process.env.MASON_CMS_DATABASE_URL) throw new Error('MASON_CMS_DATABASE_URL is required outside local development.');
