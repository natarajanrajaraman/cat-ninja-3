import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
