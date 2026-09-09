import { readFile } from 'node:fs/promises';
import { uploadAsset, closeStorage } from './cdn-storage';

const [name, file] = process.argv.slice(2);
if (!name || !file) throw new Error('Usage: npm run assets:upload -- images/example.webp /path/to/image.png (automatically compresses to WebP)');
try { console.log(await uploadAsset(name, await readFile(file))); }
finally { closeStorage(); }
