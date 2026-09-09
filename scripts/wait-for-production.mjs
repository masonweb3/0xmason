import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

const revision = process.env.EXPECTED_REVISION;
assert.match(revision || '', /^[a-f0-9]{40}$/);
const deadline = Date.now() + 10 * 60_000;
while (Date.now() < deadline) {
  const response = await fetch('https://0xmason.com', { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(30_000) }).catch(() => null);
  if (response?.ok && response.headers.get('x-site-revision') === revision) {
    console.log('Vercel production serves the checked commit.');
    process.exit(0);
  }
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
    const status = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/commits/${revision}/status`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15_000),
    });
    if (status.ok) {
      const body = await status.json();
      const vercel = body.statuses.find(item => item.context === 'Vercel');
      if (vercel && ['failure', 'error'].includes(vercel.state)) throw new Error('Vercel build failed; inspect its GitHub deployment status.');
    }
  }
  await setTimeout(15_000);
}
throw new Error('Vercel did not release the expected commit within 10 minutes. Check Deployment Checks and build logs.');
