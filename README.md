# RADA Video Prep Studio

Browser-based video converter. Videos are processed locally with FFmpeg.wasm and never uploaded.

**Output:** MP4 · H.264 · AAC · 30 FPS · max 1080p (1920×1080 / 1080×1920) · yuv420p · SDR 8-bit. Aspect ratio is kept, no upscaling.
Files that already match are repackaged without re-encoding (verified by probing the file with FFmpeg).

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173/ada-video-prep-studio/
npm run build    # outputs dist/
npm run preview
```
`npm run dev` / `build` first copy the FFmpeg core from `node_modules/@ffmpeg/core` to `public/ffmpeg/` (served from your own origin, no CDN).

## Deploy (GitHub Pages)
1. Repo → Settings → Pages → Source: **GitHub Actions**.
2. Push to `main` (or run **Deploy Vite app to GitHub Pages** manually). The workflow builds and adds `.nojekyll`.
3. Live at https://chocolatepapi123.github.io/ada-video-prep-studio/

`vite.config.js` sets `base: '/ada-video-prep-studio/'`. If the repo name differs, change it there.

## FFmpeg configuration
- `@ffmpeg/core` 0.12.10, the **single-threaded** build. No `SharedArrayBuffer`, COOP or COEP headers needed, so it works on GitHub Pages and mobile browsers.
- Trade-off: slower than multi-threaded.

## Limitations
- WebAssembly memory is capped (~2 GB). Very large or long 4K files may fail; the app reports the error instead of faking success.
- HDR sources (HLG/HDR10) become 8-bit SDR without tone-mapping, so colours may look flat.
- Download all triggers sequential downloads; some mobile browsers ask permission for multiple downloads.
- Keep the tab open and in the foreground while converting.
