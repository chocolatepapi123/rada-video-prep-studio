import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { extOf, parseProbe, meetsTarget } from './videoUtils.js';

// Single-threaded core: needs no SharedArrayBuffer / cross-origin isolation, so it runs on GitHub Pages.
const CORE_BASE = `${import.meta.env.BASE_URL}ffmpeg/`;

let ffmpeg = null;
let urls = null;
let rejectActive = null;

async function loadEngine(onStage) {
  if (ffmpeg?.loaded) return ffmpeg;
  onStage?.('Loading video engine (first time only)…');
  if (!urls) {
    urls = {
      coreURL: await toBlobURL(`${CORE_BASE}ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_BASE}ffmpeg-core.wasm`, 'application/wasm'),
    };
  }
  const ff = new FFmpeg();
  await ff.load(urls);
  ffmpeg = ff;
  return ff;
}

/** Aborts the running conversion and discards the engine (a fresh one loads next time). */
export function cancelConversion() {
  const ff = ffmpeg;
  ffmpeg = null;
  try { ff?.terminate(); } catch { /* already stopped */ }
  rejectActive?.(new Error('Cancelled'));
}

export function disposeEngine() {
  cancelConversion();
  if (urls) { URL.revokeObjectURL(urls.coreURL); URL.revokeObjectURL(urls.wasmURL); urls = null; }
}

// Fit inside 1920x1080 (landscape) / 1080x1920 (portrait), never upscale, keep aspect, even dimensions, 30 FPS.
const VF =
  "scale=w='min(iw,if(gte(iw,ih),1920,1080))':h='min(ih,if(gte(iw,ih),1080,1920))':force_original_aspect_ratio=decrease:force_divisible_by=2," +
  'fps=30,format=yuv420p';

export async function convertVideo(file, { onProgress, onStage }) {
  const ff = await loadEngine(onStage);
  const ext = extOf(file.name) || 'bin';
  const dir = '/in';
  const input = `${dir}/input.${ext}`;
  const output = 'output.mp4';
  const logs = [];
  const onLog = ({ message }) => { logs.push(message); if (logs.length > 400) logs.shift(); };
  const onProg = ({ progress }) => onProgress?.(Math.min(1, Math.max(0, progress)));
  ff.on('log', onLog);
  ff.on('progress', onProg);

  const cancelled = new Promise((_, reject) => { rejectActive = reject; });
  const work = (async () => {
    onStage?.('Reading file…');
    await ff.createDir(dir);
    await ff.mount('WORKERFS', { files: [new File([file], `input.${ext}`, { type: file.type })] }, dir);

    onStage?.('Analysing video…');
    logs.length = 0;
    await ff.exec(['-hide_banner', '-i', input]); // exits non-zero by design; we only want the stream info
    const probe = parseProbe(logs);
    const copy = meetsTarget(probe, ext);

    onStage?.(copy ? 'Already compatible — repackaging…' : 'Converting to MP4 (H.264 / AAC)…');
    logs.length = 0;
    const args = copy
      ? ['-nostdin', '-y', '-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-c', 'copy', '-movflags', '+faststart', output]
      : [
          '-nostdin', '-y', '-i', input,
          '-map', '0:v:0', '-map', '0:a:0?',
          '-vf', VF,
          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
          '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2',
          '-movflags', '+faststart', output,
        ];
    const code = await ff.exec(args);
    if (code !== 0) {
      const tail = logs.filter((l) => l.trim()).slice(-3).join(' ');
      throw new Error(`FFmpeg could not process this file (exit ${code}). ${tail}`.trim());
    }

    onStage?.('Finishing…');
    const data = await ff.readFile(output);
    if (!data?.length) throw new Error('FFmpeg produced an empty file.');
    const blob = new Blob([data], { type: 'video/mp4' });
    await ff.deleteFile(output);
    return { blob, url: URL.createObjectURL(blob), size: blob.size, probe, mode: copy ? 'copy' : 'convert' };
  })();

  try {
    return await Promise.race([work, cancelled]);
  } finally {
    rejectActive = null;
    work.catch(() => {});
    try {
      ff.off('log', onLog);
      ff.off('progress', onProg);
      await ff.unmount(dir);
      await ff.deleteDir(dir);
    } catch { /* engine may have been terminated */ }
  }
}
