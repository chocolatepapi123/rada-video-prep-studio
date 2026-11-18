import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project sites live at /<repo-name>/. In GitHub Actions the repo name is read
// automatically, so the base path always matches. Locally it falls back to the default below.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
  plugins: [react()],
  base: repo ? `/${repo}/` : '/ada-video-prep-studio/',
  optimizeDeps: { exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'] },
  build: { chunkSizeWarningLimit: 1500 },
});
