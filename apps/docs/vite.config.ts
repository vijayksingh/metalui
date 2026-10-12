import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const pkg = (p: string) => fileURLToPath(new URL(`../../packages/metalui/${p}`, import.meta.url));

/* The repository's star count, read once when the site is built so every visitor sees a number even
 * when GitHub's anonymous API limit is spent on their address; the page refreshes it live when it can.
 * Any failure ships null and the page's live read fills it in. */
async function githubStars(): Promise<number | null> {
  try {
    const r = await fetch('https://api.github.com/repos/vijayksingh/metalui', { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(4000) });
    const repo = r.ok ? await r.json() : null;
    return typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : null;
  } catch {
    return null;
  }
}

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  define: { __GITHUB_STARS__: JSON.stringify(await githubStars()) },
  // The library's generated registry, icons and agent docs are served as the site's static files.
  publicDir: pkg('public'),
  resolve: {
    // Work against the library source, so edits show up without a package build.
    alias: [
      { find: /^@unlocalhosted\/metalui\/icons$/, replacement: pkg('src/icons.ts') },
      { find: /^@unlocalhosted\/metalui\/icons\/life$/, replacement: pkg('src/icons-life.ts') },
      { find: /^@unlocalhosted\/metalui\/sound$/, replacement: pkg('src/sound.ts') },
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
}));
