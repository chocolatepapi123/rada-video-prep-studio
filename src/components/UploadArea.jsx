import { useRef, useState } from 'react';
import { Upload, Plus } from 'lucide-react';
import { ACCEPT } from '../utils/videoUtils.js';

export default function UploadArea({ onFiles, compact, disabled, notice }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);

  const drop = (e) => {
    e.preventDefault();
    setOver(false);
    if (!disabled) onFiles(e.dataTransfer.files);
  };
  const pick = (e) => { onFiles(e.target.files); e.target.value = ''; };

  return (
    <section
      className={`card upload ${compact ? 'compact' : ''} ${over ? 'over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={pick} />
      {compact ? (
        <div className="upload-compact">
          <span className="muted">Add more videos</span>
          <button className="btn secondary" disabled={disabled} onClick={() => input.current.click()}><Plus size={16} /> Add videos</button>
        </div>
      ) : (
        <>
          <div className="upload-icon"><Upload size={32} /></div>
          <h1>Prepare your videos</h1>
          <p className="muted">Convert videos into a format that works almost everywhere.</p>
          <button className="btn primary lg" onClick={() => input.current.click()}><Upload size={18} /> Choose videos</button>
          <p className="hint desktop-only">or drag and drop files here</p>
          <p className="hint">MP4 · MOV · M4V · WEBM · MKV · AVI · 3GP</p>
        </>
      )}
      {notice && <p className="notice">{notice}</p>}
    </section>
  );
}
