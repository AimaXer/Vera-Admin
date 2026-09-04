import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    host: true,
    // Keep HTTP for Caddy TLS termination; proxy helps when opening :5174 directly.
    allowedHosts: ['vera-admin.pl', 'www.vera-admin.pl', 'localhost', '127.0.0.1'],
    proxy: {
      '/__vera_api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/__vera_api/, ''),
        ws: true,
      },
    },
  },
});
