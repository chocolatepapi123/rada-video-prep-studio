# RADA Video Prep Studio

A separate, mobile-first browser utility for preparing videos locally on your device.

## What it does
- Multi-file selection and sequential conversion.
- MP4 container, H.264/AVC video, AAC audio, 30 fps, yuv420p.
- Maximum 1080p dimensions, preserving aspect ratio (no stretching).
- Keeps the original filename stem; output extension is `.mp4`.
- Adds `(2)`, `(3)`, etc. only when output filenames collide.
- Downloads each file individually or all prepared files.
- Files are processed in the browser; no app backend or account is used.

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Upload this folder to a **new, separate GitHub repository**. It is not part of the RADA app repository.

## Important mobile note
FFmpeg WebAssembly is memory- and CPU-intensive. This app processes one file at a time; on a Samsung A23, start with a short clip. Keep the browser tab open and the phone awake. Very large files or unsupported source codecs may fail. The app needs internet for its first FFmpeg engine load from the public CDN; conversion itself runs locally after the engine loads.

The output preset is a conservative compatibility preset, not a guarantee for every third-party editor. Test the converted file in the target editor before relying on a batch.
