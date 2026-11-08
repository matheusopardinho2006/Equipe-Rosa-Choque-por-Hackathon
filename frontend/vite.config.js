import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em dev, /api é redirecionado para o backend (sem problema de CORS)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3333' },
  },
});
