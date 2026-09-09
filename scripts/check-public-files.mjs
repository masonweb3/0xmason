import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const issues = [];
for (const file of files) {
  const parts = file.split('/');
  if (parts.some(p => ['.vercel', '.agents', 'qa', 'drafts', 'backups', 'node_modules', '.next'].includes(p)) ||
      /(?:^|\/)\.env(?:\.|$)/.test(file) && file !== '.env.example' ||
      /\.(?:dump|sqlite\d*|db|log|zip|tar|gz|png|jpe?g|webp|avif|gif|ico)$/i.test(file) ||
      file.startsWith('content/') && file !== 'content/cdn-assets.json') {
    issues.push(`${file}: private or generated file`);
    continue;
  }
  if (/\.(?:ttf|woff2?)$/.test(file)) continue;
  const text = await readFile(file, 'utf8');
  const forbidden = [
    new RegExp('/' + 'Users/[^/]+/'),
    new RegExp('-----BEGIN ' + '(?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    new RegExp('postgres(?:ql)?://' + '[^\\s/:]+:[^\\s@]+@(?!127\\.0\\.0\\.1|localhost)'),
  ];
  if (forbidden.some(pattern => pattern.test(text))) issues.push(`${file}: private path or credential pattern`);
}
if (issues.length) throw new Error(`Public repository check failed:\n${issues.join('\n')}`);
console.log(`Public file boundary checked: ${files.length} tracked files. Run Gitleaks for secret and history scanning.`);
