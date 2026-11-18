export const ACCEPT = 'video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.3gp';
const EXTS = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', '3gp'];
export const LIMIT = { long: 1920, short: 1080, fps: 30 };

export const extOf = (name) => (name.match(/\.([^.]+)$/)?.[1] || '').toLowerCase();
export const stemOf = (name) => name.replace(/\.[^.]+$/, '').replace(/[^\w\-. ]+/g, '').trim().replace(/\s+/g, '_') || 'video';
export const isVideoFile = (f) => f.type.startsWith('video/') || EXTS.includes(extOf(f.name));

export function formatBytes(n) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function formatDuration(s) {
  if (!s || !isFinite(s)) return null;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

export const fileKey = (f) => `${f.name}|${f.size}|${f.lastModified}`;
export const withinLimits = (w, h) => Math.max(w, h) <= LIMIT.long && Math.min(w, h) <= LIMIT.short;

/** Reads duration/resolution via the browser. Formats the browser can't decode (MKV, AVI...) return {}. */
export function readMetadata(file) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(file);
    let done = false;
    const finish = (m) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      v.removeAttribute('src');
      v.load();
      URL.revokeObjectURL(url);
      resolve(m);
    };
    const timer = setTimeout(() => finish({}), 8000);
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () =>
      finish({ duration: isFinite(v.duration) ? v.duration : null, width: v.videoWidth || null, height: v.videoHeight || null });
    v.onerror = () => finish({});
    v.src = url;
  });
}

/** Quick pre-check from file info only. The real codec check happens at processing time. */
export function precheck(file, meta) {
  const ext = extOf(file.name);
  const reasons = [];
  if (!['mp4', 'm4v'].includes(ext)) reasons.push(`${ext ? '.' + ext.toUpperCase() : 'This'} container → MP4`);
  if (meta.width && !withinLimits(meta.width, meta.height)) reasons.push(`${meta.width}×${meta.height} is above 1080p`);
  if (reasons.length) return { ok: false, label: 'Needs conversion', detail: reasons.join(' · ') };
  return { ok: true, label: 'May already match', detail: 'MP4 within 1080p. Codec and frame rate are verified when processing.' };
}

/** Parses `ffmpeg -i` log output into stream facts. */
export function parseProbe(logs) {
  const text = logs.join('\n');
  const v = text.match(/Stream #\d+:\d+[^\n]*Video: ([^\n]+)/);
  const a = text.match(/Stream #\d+:\d+[^\n]*Audio: (\w+)/);
  const info = { videoCodec: null, pixFmt: null, width: null, height: null, fps: null, audioCodec: a ? a[1] : null };
  if (v) {
    const line = v[1];
    info.videoCodec = line.match(/^(\w+)/)?.[1] ?? null;
    info.pixFmt = line.match(/,\s*(yuvj?\d{3}p\d*[a-z]*|nv\d+|p0\d+[a-z]*|gbrp[a-z0-9]*|rgb\w*)/)?.[1] ?? null;
    const size = line.match(/\b(\d{2,5})x(\d{2,5})\b/);
    if (size) { info.width = +size[1]; info.height = +size[2]; }
    const fps = line.match(/([\d.]+) fps/);
    if (fps) info.fps = parseFloat(fps[1]);
  }
  return info;
}

export function meetsTarget(info, ext) {
  return Boolean(
    ['mp4', 'm4v'].includes(ext) &&
    info.videoCodec === 'h264' &&
    info.pixFmt === 'yuv420p' &&
    info.fps != null && Math.abs(info.fps - LIMIT.fps) < 0.1 &&
    info.width && withinLimits(info.width, info.height) &&
    (!info.audioCodec || info.audioCodec === 'aac')
  );
}
