import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/icons.ts', 'src/icons-life.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', '@base-ui/react'],
  // Components use hooks and events; keep them client components under RSC.
  banner: { js: '"use client";' },
});
