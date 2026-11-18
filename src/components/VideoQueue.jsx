import { Trash2 } from 'lucide-react';
import VideoCard from './VideoCard.jsx';

export default function VideoQueue({ items, running, onRemove, onClear, onRetry, onDownload }) {
  if (!items.length) return null;
  return (
    <section>
      <div className="section-head">
        <h2>Queue <span className="muted">({items.length})</span></h2>
        <button className="btn ghost sm" onClick={onClear}><Trash2 size={14} /> {running ? 'Stop & clear' : 'Clear all'}</button>
      </div>
      <div className="stack">
        {items.map((i) => <VideoCard key={i.id} item={i} onRemove={onRemove} onRetry={onRetry} onDownload={onDownload} />)}
      </div>
    </section>
  );
}
