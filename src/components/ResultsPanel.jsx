import { CheckCircle2, Download } from 'lucide-react';
import { formatBytes } from '../utils/videoUtils.js';

export default function ResultsPanel({ items, onDownloadAll }) {
  const done = items.filter((i) => i.status === 'done');
  const total = done.reduce((n, i) => n + i.result.size, 0);
  return (
    <section className="card results">
      <div className="success"><CheckCircle2 size={22} /></div>
      <div className="results-text">
        <h2>{done.length} video{done.length > 1 ? 's' : ''} ready</h2>
        <p className="muted small">{formatBytes(total)} total · saved by your browser to Downloads</p>
      </div>
      <button className="btn primary" onClick={onDownloadAll}><Download size={16} /> {done.length > 1 ? 'Download all' : 'Download'}</button>
    </section>
  );
}
