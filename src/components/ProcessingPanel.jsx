import { Play, Square, LoaderCircle } from 'lucide-react';

export default function ProcessingPanel({ items, running, onStart, onStop, disabled }) {
  const counted = items.filter((i) => i.status !== 'cancelled');
  const finished = counted.filter((i) => i.status === 'done' || i.status === 'error').length;
  const current = items.find((i) => i.status === 'processing');
  const queued = items.filter((i) => i.status === 'queued').length;
  const overall = counted.length
    ? counted.reduce((n, i) => n + (i.status === 'done' || i.status === 'error' ? 1 : i.status === 'processing' ? i.progress : 0), 0) / counted.length
    : 0;
  const pct = Math.round(overall * 100);

  return (
    <section className="card">
      <div className="section-head tight">
        <h2>Processing</h2>
        <span className="muted small">{finished} of {counted.length} finished</span>
      </div>
      {(running || finished > 0) && (
        <>
          <div className="bar lg"><div style={{ width: `${pct}%` }} /></div>
          <div className="row between small">
            <span className="muted">{running && current ? `${current.stage} — ${current.file.name}` : running ? 'Preparing…' : 'Idle'}</span>
            <strong>{pct}%</strong>
          </div>
        </>
      )}
      <div className="actions">
        {running ? (
          <button className="btn danger lg" onClick={onStop}><Square size={16} /> Stop</button>
        ) : (
          <button className="btn primary lg" disabled={disabled || !queued} onClick={onStart}>
            <Play size={16} /> {queued ? `Convert ${queued} video${queued > 1 ? 's' : ''}` : 'Nothing to convert'}
          </button>
        )}
        {running && <span className="muted small row"><LoaderCircle size={14} className="spin" /> Keep this tab open</span>}
      </div>
    </section>
  );
}
