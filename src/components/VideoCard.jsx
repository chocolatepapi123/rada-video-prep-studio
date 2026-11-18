import { FileVideo, X, CheckCircle2, AlertCircle, Download, LoaderCircle, RotateCcw, Clock, Ban } from 'lucide-react';
import { extOf, formatBytes, formatDuration } from '../utils/videoUtils.js';

const STATUS = {
  queued: { label: 'Waiting', icon: Clock, cls: '' },
  processing: { label: 'Processing', icon: LoaderCircle, cls: 'active' },
  done: { label: 'Converted', icon: CheckCircle2, cls: 'ok' },
  error: { label: 'Failed', icon: AlertCircle, cls: 'bad' },
  cancelled: { label: 'Cancelled', icon: Ban, cls: '' },
};

export default function VideoCard({ item, onRemove, onRetry, onDownload }) {
  const { file, meta, check, status, progress, stage, result, error } = item;
  const s = STATUS[status];
  const Icon = s.icon;
  const bits = [
    extOf(file.name).toUpperCase() || 'VIDEO',
    formatBytes(file.size),
    formatDuration(meta?.duration),
    meta?.width ? `${meta.width}×${meta.height}` : null,
  ].filter(Boolean);

  return (
    <article className="card video">
      <div className="video-top">
        <div className="thumb"><FileVideo size={22} /></div>
        <div className="video-info">
          <div className="video-name" title={file.name}>{file.name}</div>
          <div className="muted small">{bits.join(' · ')}</div>
        </div>
        <button className="icon-btn" aria-label={`Remove ${file.name}`} onClick={() => onRemove(item.id)}><X size={18} /></button>
      </div>

      {status === 'queued' && check && (
        <div className={`check ${check.ok ? 'maybe' : 'convert'}`}><strong>{check.label}</strong> — {check.detail}</div>
      )}

      <div className="video-bottom">
        <span className={`status ${s.cls}`}><Icon size={15} className={status === 'processing' ? 'spin' : ''} /> {s.label}</span>
        {status === 'processing' && <span className="muted small">{Math.round(progress * 100)}%</span>}
        {status === 'done' && (
          <button className="btn primary sm" onClick={() => onDownload(item)}><Download size={14} /> Download</button>
        )}
        {(status === 'error' || status === 'cancelled') && (
          <button className="btn secondary sm" onClick={() => onRetry(item.id)}><RotateCcw size={14} /> Retry</button>
        )}
      </div>

      {status === 'processing' && (
        <>
          <div className="bar"><div style={{ width: `${progress * 100}%` }} /></div>
          <div className="muted small">{stage}</div>
        </>
      )}
      {status === 'done' && result && (
        <div className="muted small">
          {result.mode === 'copy' ? 'Already compatible — repackaged without re-encoding' : 'MP4 · H.264 · AAC · 30 FPS · yuv420p'} · {formatBytes(result.size)}
        </div>
      )}
      {status === 'error' && <div className="error-text">{error}</div>}
    </article>
  );
}
