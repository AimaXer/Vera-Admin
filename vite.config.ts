import react from '@vitejs/plugin-react';
import {defineConfig, type ServerOptions} from 'vite';

/**
 * Behind ngrok / Cloudflare Tunnel / GCP HTTPS front:
 *   VERA_PUBLIC_HOST=your-subdomain.ngrok-free.dev npm run dev
 */
function tunnelHmr(): ServerOptions['hmr'] {
  const raw = (process.env.VERA_PUBLIC_HOST || '').trim();
  if (!raw) {
    return undefined;
  }
  const host = raw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  if (!host) {
    return undefined;
  }
  return {
    protocol: 'wss',
    host,
    clientPort: Number(process.env.VERA_PUBLIC_CLIENT_PORT || 443),
  };
}

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: Number(process.env.PORT || 5174),
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    cors: true,
    hmr: tunnelHmr(),
    proxy: {
      '/__vera_api': {
        target: process.env.VERA_API_PROXY || 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/__vera_api/, ''),
        ws: true,
      },
    },
  },
});
