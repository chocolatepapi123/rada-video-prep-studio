import { AlertTriangle } from 'lucide-react';
import Header from './components/Header.jsx';
import UploadArea from './components/UploadArea.jsx';
import VideoQueue from './components/VideoQueue.jsx';
import ConversionSettings from './components/ConversionSettings.jsx';
import ProcessingPanel from './components/ProcessingPanel.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import { useVideoQueue } from './hooks/useVideoQueue.js';

export default function App() {
  const q = useVideoQueue();
  const supported = typeof WebAssembly !== 'undefined';
  const doneCount = q.items.filter((i) => i.status === 'done').length;

  return (
    <div className="app">
      <Header />
      <main className="container">
        {!supported && (
          <div className="banner error"><AlertTriangle size={18} /> This browser does not support WebAssembly, so videos cannot be processed here.</div>
        )}
        <UploadArea onFiles={q.addFiles} compact={q.items.length > 0} disabled={q.running} notice={q.notice} />
        <VideoQueue items={q.items} running={q.running} onRemove={q.remove} onClear={q.clear} onRetry={q.retry} onDownload={q.download} />
        <ConversionSettings />
        {q.items.length > 0 && <ProcessingPanel items={q.items} running={q.running} onStart={q.start} onStop={q.stop} disabled={!supported} />}
        {doneCount > 0 && <ResultsPanel items={q.items} onDownloadAll={q.downloadAll} />}
      </main>
      <footer className="footer">
        <p>Private by design. Your videos never leave your device.</p>
        <p className="muted">Version 1.0</p>
      </footer>
    </div>
  );
}
