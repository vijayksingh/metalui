import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'site-dist',
    rollupOptions: {
      // Base UI and the components mark themselves "use client"; that is expected in a SPA.
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return;
        warn(warning);
      },
    },
  },
  publicDir: 'public',
});
