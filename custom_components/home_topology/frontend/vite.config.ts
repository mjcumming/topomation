import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'home-topology-panel.ts',
      formats: ['es'],
      fileName: () => 'home-topology-panel.js'
    },
    outDir: '.',
    emptyOutDir: false,
    rollupOptions: {
      external: [
        // We might want to bundle everything for a custom panel,
        // or exclude lit if we are sure HA provides it (it usually does but versions vary).
        // For safety/easier dev, we'll bundle for now.
      ]
    }
  }
});

