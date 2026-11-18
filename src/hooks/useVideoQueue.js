import { useCallback, useEffect, useRef, useState } from 'react';
import { convertVideo, cancelConversion, disposeEngine } from '../utils/ffmpeg.js';
import { fileKey, isVideoFile, precheck, readMetadata, stemOf } from '../utils/videoUtils.js';

let nextId = 1;
const release = (i) => { if (i.result?.url) URL.revokeObjectURL(i.result.url); };

export function useVideoQueue() {
  const [items, setItems] = useState([]);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('');
  const ref = useRef([]);
  const runningRef = useRef(false);
  const stopRef = useRef(false);

  const update = useCallback((fn) => { ref.current = fn(ref.current); setItems(ref.current); }, []);
  const patch = useCallback((id, p) => update((l) => l.map((i) => (i.id === id ? { ...i, ...p } : i))), [update]);

  const addFiles = useCallback(async (fileList) => {
    const all = Array.from(fileList || []);
    const videos = all.filter(isVideoFile);
    const known = new Set(ref.current.map((i) => fileKey(i.file)));
    const fresh = videos.filter((f) => !known.has(fileKey(f)));
    setNotice(all.length > videos.length ? `${all.length - videos.length} file(s) skipped: not a supported video.` : '');
    const added = fresh.map((file) => ({ id: nextId++, file, meta: null, check: null, status: 'queued', progress: 0, stage: '', result: null, error: '' }));
    if (!added.length) return;
    update((l) => [...l, ...added]);
    for (const it of added) {
      const meta = await readMetadata(it.file);
      patch(it.id, { meta, check: precheck(it.file, meta) });
    }
  }, [update, patch]);

  const remove = useCallback((id) => {
    const item = ref.current.find((i) => i.id === id);
    if (!item) return;
    update((l) => l.filter((i) => i.id !== id)); // removed first so the loop sees it is gone
    if (item.status === 'processing') cancelConversion();
    release(item);
  }, [update]);

  const clear = useCallback(() => {
    if (runningRef.current) { stopRef.current = true; cancelConversion(); }
    ref.current.forEach(release);
    update(() => []);
  }, [update]);

  const retry = useCallback((id) => patch(id, { status: 'queued', progress: 0, error: '', stage: '' }), [patch]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true; stopRef.current = false; setRunning(true);
    let lock = null;
    try { lock = await navigator.wakeLock?.request('screen'); } catch { /* optional */ }
    while (!stopRef.current) {
      const next = ref.current.find((i) => i.status === 'queued');
      if (!next) break;
      const id = next.id;
      patch(id, { status: 'processing', progress: 0, stage: 'Starting…', error: '' });
      try {
        const result = await convertVideo(next.file, {
          onProgress: (p) => patch(id, { progress: p }),
          onStage: (s) => patch(id, { stage: s }),
        });
        result.name = `${stemOf(next.file.name)}_rada_1080p30.mp4`;
        if (ref.current.some((i) => i.id === id)) patch(id, { status: 'done', progress: 1, result, stage: 'Done' });
        else URL.revokeObjectURL(result.url);
      } catch (e) {
        if (ref.current.some((i) => i.id === id)) {
          if (stopRef.current || e.message === 'Cancelled') patch(id, { status: 'cancelled', stage: 'Cancelled' });
          else patch(id, { status: 'error', error: e.message || 'Conversion failed.' });
        }
      }
    }
    runningRef.current = false; setRunning(false);
    try { await lock?.release(); } catch { /* ignore */ }
  }, [patch]);

  const stop = useCallback(() => { stopRef.current = true; cancelConversion(); }, []);

  const download = useCallback((item) => {
    const a = document.createElement('a');
    a.href = item.result.url; a.download = item.result.name;
    document.body.appendChild(a); a.click(); a.remove();
  }, []);

  const downloadAll = useCallback(async () => {
    for (const item of ref.current.filter((i) => i.status === 'done')) {
      download(item);
      await new Promise((r) => setTimeout(r, 600));
    }
  }, [download]);

  useEffect(() => () => { ref.current.forEach(release); disposeEngine(); }, []);

  return { items, running, notice, addFiles, remove, clear, retry, start, stop, download, downloadAll };
}
