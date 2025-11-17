import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Port for the Vite frontend development server.
    // This must match the `targetPort` in `netlify/netlify.toml`.
    port: 5173,
    
    // Proxy API requests to the Netlify Functions server.
    // This is crucial for local development to avoid CORS issues.
    proxy: {
      '/.netlify/functions': {
        // The Netlify CLI runs the functions server on port 8888 by default.
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
