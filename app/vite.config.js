import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      'react-native': 'react-native-web'
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/uploads': {
        target: 'http://localhost:3003',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  }
});
