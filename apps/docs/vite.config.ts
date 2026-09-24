import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const pkg = (p: string) => fileURLToPath(new URL(`../../packages/metalui/${p}`, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The library's generated registry, icons and agent docs are served as the site's static files.
  publicDir: pkg('public'),
  resolve: {
    // Work against the library source, so edits show up without a package build.
    alias: [
      { find: /^@unlocalhosted\/metalui\/icons$/, replacement: pkg('src/icons.ts') },
      { find: /^@unlocalhosted\/metalui\/(tokens|theme)\.css$/, replacement: pkg('src/components/$1.css') },
      { find: /^@unlocalhosted\/metalui$/, replacement: pkg('src/index.ts') },
    ],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return;
        warn(warning);
      },
    },
  },
});
