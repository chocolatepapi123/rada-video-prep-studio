import { Settings2, Check } from 'lucide-react';

const TARGET = ['MP4 container', 'H.264 / AVC video', 'AAC audio', '30 FPS', 'Up to 1080p', 'yuv420p · SDR · 8-bit'];

export default function ConversionSettings() {
  return (
    <section className="card">
      <div className="section-head tight"><h2><Settings2 size={16} /> Output format</h2><span className="badge">Recommended</span></div>
      <div className="chips">{TARGET.map((t) => <span key={t} className="chip"><Check size={13} /> {t}</span>)}</div>
      <p className="muted small">Original aspect ratio is kept and videos are never upscaled. Compatible with phones, browsers, social platforms and editors.</p>
    </section>
  );
}
