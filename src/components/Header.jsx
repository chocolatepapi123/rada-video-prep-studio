import { ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="header">
      <div className="container header-row">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="36" height="36" />
          <div>
            <div className="brand-name">RADA</div>
            <div className="brand-sub">Video Prep Studio</div>
          </div>
        </div>
        <div className="privacy-pill"><ShieldCheck size={14} /> Your files stay on your device.</div>
      </div>
    </header>
  );
}
