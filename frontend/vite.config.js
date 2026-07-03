import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Multi-page app: the web-call experience lives at "/", the admin dashboard
// at "/dashboard" (not "/admin" — that path is owned by the existing Gradio
// console mounted in main.py).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/calls': 'http://127.0.0.1:8000',
      '/api': {
        target: 'http://127.0.0.1:8000',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html'),
      },
    },
  },
});
