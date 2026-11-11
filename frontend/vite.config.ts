import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  define: {
    'global': 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      'js-sha256': path.resolve(__dirname, 'src/shims/sha256-shim.ts'),
      'buffer': 'buffer',
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
