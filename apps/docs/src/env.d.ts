declare module '*?raw' { const s: string; export default s; }
declare module '*.png' { const src: string; export default src; }
/** The repository's star count when the site was built (vite.config.ts), or null if GitHub didn't answer. */
declare const __GITHUB_STARS__: number | null;
