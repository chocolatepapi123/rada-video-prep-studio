// Copies the single-threaded FFmpeg core (ESM build) from node_modules into public/ffmpeg/
// so it is served from the same origin as the app (no CDN, works under the GitHub Pages subpath).
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'node_modules/@ffmpeg/core/dist/esm');
const dest = resolve(root, 'public/ffmpeg');

if (!existsSync(src)) {
  console.error('Missing @ffmpeg/core. Run "npm install" first.');
  process.exit(1);
}
mkdirSync(dest, { recursive: true });
for (const f of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) cpSync(resolve(src, f), resolve(dest, f));
console.log('FFmpeg core copied to public/ffmpeg/');
