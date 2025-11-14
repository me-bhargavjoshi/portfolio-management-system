import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    host: '127.0.0.1',
    hmr: false,
    middlewareMode: false,
  },
  preview: {
    port: 3000,
  },
});
