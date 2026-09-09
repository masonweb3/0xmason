import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, appendFile, chmod, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const root = fileURLToPath(new URL('../', import.meta.url));
const envPath = resolve(root, '.env');
const existing = await readFile(envPath, 'utf8').catch((error) => { if (error.code === 'ENOENT') return ''; throw error; });
const environment = parse(existing);
const runtime = resolve(process.env.MASON_CMS_RUNTIME_DIR || environment.MASON_CMS_RUNTIME_DIR || resolve(homedir(), '.local/share/0xmason'));
const data = resolve(runtime, 'postgres');
const socket = resolve(runtime, 'socket');
const command = process.argv[2] || 'start';
function run(binary, args, options = {}) {
  const result = spawnSync(binary, args, { encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) throw new Error(`${binary} failed: ${result.error?.message || result.stderr}`);
  return result.stdout;
}
if (command === 'stop') {
  run('pg_ctl', ['-D', data, '-m', 'fast', 'stop']);
  console.log('Local CMS PostgreSQL stopped.');
} else {
  if (!/^MASON_CMS_SECRET=/m.test(existing)) await appendFile(envPath, `\nMASON_CMS_SECRET=${randomBytes(48).toString('hex')}\n`, { mode: 0o600 });
  await chmod(envPath, 0o600);
  await mkdir(socket, { recursive: true, mode: 0o700 });
  await chmod(runtime, 0o700);
  if (!await access(resolve(data, 'PG_VERSION')).then(() => true, () => false)) {
    run('initdb', ['-D', data, '-U', 'mason_cms', '--encoding=UTF8', '--locale=C', '--auth-local=trust', '--auth-host=reject']);
  }
  const status = spawnSync('pg_ctl', ['-D', data, 'status'], { encoding: 'utf8' });
  if (status.status !== 0) run('pg_ctl', ['-D', data, '-l', resolve(runtime, 'postgres.log'), '-o', `-k ${socket} -p 55439 -c listen_addresses=''`, '-w', 'start']);
  const pgArgs = ['-h', socket, '-p', '55439', '-U', 'mason_cms'];
  const exists = run('psql', [...pgArgs, '-d', 'postgres', '-Atc', "SELECT 1 FROM pg_database WHERE datname='mason_cms'"]).trim();
  if (!exists) run('createdb', [...pgArgs, 'mason_cms']);
  console.log('Local CMS PostgreSQL ready on a private Unix socket. Credentials stay in the repository .env.');
}
