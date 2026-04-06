import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Загружаем .env.mock в режиме mock, иначе стандартные .env файлы
  envDir: mode === 'mock' ? '.' : undefined,
  envPrefix: 'VITE_',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@app': resolve(__dirname, './src/app'),
      '@pages': resolve(__dirname, './src/pages'),
      '@features': resolve(__dirname, './src/features'),
      '@entities': resolve(__dirname, './src/entities'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Vite 8: используется Rolldown вместо Rollup
    // rolldownOptions доступен для тонкой настройки
  },
  // Vite 8: Oxc используется для трансформации вместо esbuild
  // JSX автоматически обрабатывается через @vitejs/plugin-react
  clearScreen: false,
  cacheDir: '../../node_modules/.vite/web',
}));
