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
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
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
    pool: 'threads',
    deps: {
      inline: ['@asamuzakjp/css-color', '@csstools/css-calc']
    },
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 0.8,
        statements: 0.8,
        functions: 0.8,
        branches: 0.8
      }
    }
  }
});
