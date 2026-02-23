import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Dev server configuration
  server: {
    port: 5173,
    open: '/mock-harness.html',
  },

  // Build configuration for production (library mode)
  build: {
    lib: {
      entry: 'home-topology-panel.ts',
      formats: ['es'],
      fileName: () => 'home-topology-panel.js'
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
    }
  }
});
