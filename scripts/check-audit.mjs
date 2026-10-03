// `npm audit --audit-level=high` with a narrow allowlist: a listed advisory passes only while npm reports no fix.
import { execFileSync } from 'node:child_process';

const allowed = new Set([
  // braces <=3.0.3 stack exhaustion on deeply nested patterns; no patched release yet (micromatch/braces#72).
  // Reached only with fixed patterns (findup-sync 'node_modules', sass/chokidar watch globs), never user input.
  'GHSA-vfj7-8cjw-p6xm',
]);

let output;
try { output = execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
catch (error) { output = error.stdout; } // npm audit exits non-zero whenever it finds anything
const { vulnerabilities = {} } = JSON.parse(output);

// Dependents list their source package as a string; checking every advisory object covers the whole chain.
const blocking = [];
for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
  for (const advisory of vulnerability.via.filter((via) => typeof via === 'object')) {
    if (!['high', 'critical'].includes(advisory.severity)) continue;
    const id = advisory.url?.split('/').pop();
    const line = `${advisory.severity} ${name} ${advisory.range} ${id}: ${advisory.title}`;
    if (allowed.has(id) && vulnerability.fixAvailable === false) console.log(`allowed (no fix yet): ${line}`);
    else blocking.push(allowed.has(id) ? `${line} — a fix is now available, upgrade and drop it from the allowlist` : line);
  }
}
if (blocking.length) {
  console.error(blocking.join('\n'));
  process.exit(1);
}
console.log('npm audit: no blocking high or critical advisories');
