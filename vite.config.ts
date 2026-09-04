import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: ['vera-admin.pl', 'www.vera-admin.pl', 'localhost', '127.0.0.1'],
  },
});
