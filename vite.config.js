import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: https://chocolatepapi123.github.io/ada-video-prep-studio/
export default defineConfig({
  plugins: [react()],
  base: '/ada-video-prep-studio/',
  optimizeDeps: { exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'] },
  build: { chunkSizeWarningLimit: 1500 },
});
