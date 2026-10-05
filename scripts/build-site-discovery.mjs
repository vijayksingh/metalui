// Publish one crawlable HTML document per docs route, plus discovery files.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const vite = await createServer({
  root: resolve(root, 'apps/docs'),
  server: { middlewareMode: true },
  appType: 'custom',
});
const { NAV } = await vite.ssrLoadModule('/src/app/nav.ts');
const { ICON_PAGES } = await vite.ssrLoadModule('/src/app/icon-pages.ts');
await vite.close();
const dist = resolve(root, 'apps/docs/dist');
const origin = 'https://metalui.dev';
const template = readFileSync(resolve(dist, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>') || !template.includes('<title>MetalUI</title>')) {
  throw new Error('Unexpected Vite HTML template; update site discovery replacements');
}
const manifest = JSON.parse(readFileSync(resolve(dist, 'components.json'), 'utf8'));
const components = new Map(manifest.components.map((item) => [item.name, item]));
const partDescriptions = new Map();
for (const family of ['components', 'blocks']) {
  const directory = resolve(root, `packages/metalui/src/${family}`);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const metaPath = resolve(directory, entry.name, 'meta.json');
    if (!existsSync(metaPath)) continue;
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    if (meta.page && meta.description) partDescriptions.set(meta.page, meta.description);
  }
}

const descriptions = {
  '/components': 'Browse MetalUI controls by purpose, search the component library, try real React specimens, and open their documentation.',
  '/': 'MetalUI makes Soft Hardware components for React and SwiftUI: soft plastic, smoked glass, metal, and controls that respond like physical objects.',
  '/overview': 'Explore MetalUI: Soft Hardware components, material recipes, motion, React and SwiftUI implementations, and guides for coding agents.',
  '/layers': 'See how MetalUI parts, components, objects, instruments, and places fit together.',
  '/foundations': 'The principles behind MetalUI materials, color, typography, spacing, radius, elevation, and motion, with live adjustable examples.',
  '/foundations/color': 'Bone and graphite colorways, ink contrast, status signals, and feeling tints for the MetalUI design system.',
  '/foundations/typography': 'MetalUI type roles, font families, weights, and line spacing for legible hardware interfaces.',
  '/foundations/radius': 'The MetalUI radius ladder, nested corners, slabs, and pill shapes, explained with live examples.',
  '/foundations/spacing': 'A four-point spacing base and named relationships between MetalUI interface elements.',
  '/foundations/sizing': 'MetalUI control height and icon sizing rules across buttons, fields, and other components.',
  '/foundations/elevation': 'Five MetalUI elevation levels, each tied to a material recipe and a clear place in the interface.',
  '/foundations/materials': 'MetalUI material recipes for bone, graphite, frost, metal, wells, and glass, with shared CSS and SwiftUI rendering.',
  '/foundations/sound': 'Hear MetalUI sound gestures and learn how tactile feedback pairs with motion.',
  '/foundations/motion': 'MetalUI motion classes, physical springs, travel distances, and reduced-motion behavior.',
  '/foundations/transitions': 'MetalUI state-change recipes for press, selection, panels, labels, and icons.',
  '/changelog': 'What changed in each release of @unlocalhosted/metalui: added, changed, fixed and removed, newest first, with links to npm and the release tag.',
  '/performance': 'What MetalUI costs a laptop: idle work, wake-ups and bytes shipped, measured on a separate machine, with the rules the library keeps and what the numbers do not prove.',
  '/wip': 'What is unfinished in MetalUI 0.0 alpha: SwiftUI placeholders, React-only blocks, and open backlog items by topic.',
  '/blocks/studio-week': 'A live MetalUI block: one week of a canvas workspace on a dot matrix, hour by hour, with readouts for notes, regions, confirmed cues and time in the past, and the recognizer by kind.',
  '/blocks/ai-composer': 'A live MetalUI chat block: a composer that grows, attachments, a model choice, and replies that stream in word by word with stop, copy and retry.',
  '/blocks/share-panel': 'A live MetalUI sharing block: drop files that upload with progress, invite people by email with a permission, and turn on and copy a share link.',
  '/blocks/availability-picker': 'A live MetalUI booking block: a host, a call length, a calendar of the next six weeks, the day\'s free times re-labelled by time zone, and Confirm to Booked.',
  '/blocks/task-inbox': 'A live MetalUI task list block: search and views, a tick that settles a task into Done, multi-select with a tool strip to complete, assign, snooze or delete, and Undo.',
  '/blocks/settings': 'A live MetalUI settings block: profile fields validated on blur and save, notification switches, a colorway and density, and a save bar that counts unsaved changes.',
  '/icons': 'Browse MetalUI Soft Hardware icons: animated monoline and duotone glyphs for React, SwiftUI, and SVG.',
  '/icons/life': 'Browse MetalUI life icons for meals, feelings, people, places, weather, and everyday moments.',
  '/components/swatch': 'A glossy color chip with a readable color code; click it to choose a new color.',
  '/components/cue': 'Cues mark recognized dates, amounts, tags, and other meaning in text without shifting the letters.',
  '/components/lens-bar': 'A frosted bar that names a question, counts matches, shows provenance, and changes the view of a live lens.',
  '/components/memory-scrubber': 'A time slider that moves the canvas into its past and returns it to the present with NOW.',
};

// A nav item can point at a section of a page (a path ending in #section); the page is the route.
const pageOf = (to) => to.split('#')[0];
const labelOf = (path) => path === '/' ? 'MetalUI' : NAV.find(group => group.to === path)?.label ?? NAV.flatMap((group) => group.items).find((item) => pageOf(item.to) === path)?.label ?? ICON_PAGES.find(icon => icon.to === path)?.label;
const paths = ['/', ...new Set([...NAV.flatMap((group) => [...(group.to ? [group.to] : []), ...group.items.map((item) => pageOf(item.to))]), ...ICON_PAGES.map(icon => icon.to)])];
const routerSource = readFileSync(resolve(root, 'apps/docs/src/app/routes.tsx'), 'utf8');
const routerPaths = [...routerSource.matchAll(/\bpath:\s*'([^']+)'/g)]
  .map((match) => match[1] === '/' ? '/' : `/${match[1]}`)
  .filter((path) => path !== '/*' && !path.includes(':'));
routerPaths.push(...ICON_PAGES.map(icon => icon.to));
if (paths.length !== routerPaths.length || paths.some((path) => !routerPaths.includes(path))) {
  throw new Error('Docs navigation and router routes differ; update both before publishing discovery pages');
}
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const escapeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

// A search result shows about 160 characters: keep whole sentences that fit, else cut at a word.
const MAX_DESCRIPTION = 160;
function fit(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_DESCRIPTION) return clean;
  let out = '';
  for (const sentence of clean.split(/(?<=[.!?])\s+/)) {
    if ((out ? `${out} ${sentence}` : sentence).length > MAX_DESCRIPTION) break;
    out = out ? `${out} ${sentence}` : sentence;
  }
  if (out) return out;
  return `${clean.slice(0, MAX_DESCRIPTION - 1).replace(/\s+\S*$/, '').replace(/[.,;:]$/, '')}…`;
}

function pageFor(path) {
  const name = path.split('/').at(-1);
  const component = path.startsWith('/components/') ? components.get(name) : undefined;
  const label = labelOf(path);
  if (!label) throw new Error(`Missing navigation label for ${path}`);
  const description = component?.description ?? partDescriptions.get(path) ?? NAV.find(group => group.to === path)?.description ?? ICON_PAGES.find(icon => icon.to === path)?.description ?? descriptions[path === '/foundations/principles' ? '/foundations' : path === '/icons/guide' ? '/icons' : path === '/icons/life/guide' ? '/icons/life' : path];
  if (!description) throw new Error(`Missing search description for ${path}`);
  return {
    // A block shares its name with a component (Settings), and two pages must not share a title.
    title: path === '/' ? 'MetalUI — Soft Hardware for React and SwiftUI' : `${label}${path.startsWith('/blocks/') ? ' block' : ICON_PAGES.some(icon => icon.to === path) ? ` ${ICON_PAGES.find(icon => icon.to === path).kind} icon` : ''} — MetalUI`,
    description: fit(description),
    canonical: `${origin}${path}`,
    agent: component ? `${origin}/r/${component.name}.md` : `${origin}/AI.md`,
    label,
    component,
  };
}

function staticContent(path, page) {
  const groups = NAV.map((group) => `<section><h2>${group.to ? `<a href="${escapeHtml(group.to)}">${escapeHtml(group.label)}</a>` : escapeHtml(group.label)}</h2><ul>${[...group.items, ...(group.to === '/icons' ? ICON_PAGES : [])].map((item) => `<li><a href="${escapeHtml(item.to)}">${escapeHtml(item.label)}</a></li>`).join('')}</ul></section>`).join('');
  const guide = page.component ? `<p><a href="${escapeHtml(page.agent)}">Read the ${escapeHtml(page.label)} agent guide</a> · <a href="${origin}/r/${escapeHtml(page.component.name)}.json">Copy registry source</a></p>` : '';
  const guideText = page.component ? readFileSync(resolve(dist, `r/${page.component.name}.md`), 'utf8') : '';
  const excerpts = ['Use it for', "Don't use it for"].map((heading) => {
    const section = guideText.split(`## ${heading}\n`)[1]?.split('\n## ')[0];
    const bullets = section?.split('\n').filter((line) => line.startsWith('- ')).map((line) => `<li>${escapeHtml(line.slice(2).replace(/[*`]/g, ''))}</li>`);
    return bullets?.length ? `<section><h2>${escapeHtml(heading)}</h2><ul>${bullets.join('')}</ul></section>` : '';
  }).join('');
  return `<div class="discovery-page"><header><a href="/">MetalUI</a><span> / Soft Hardware</span></header><main><p class="discovery-kicker">React · SwiftUI · agent guides</p><h1>${escapeHtml(page.label)}</h1><p>${escapeHtml(page.description)}</p>${excerpts}${guide}<p><a href="/overview">Explore the documentation</a> · <a href="/llms.txt">Agent index</a> · <a href="https://github.com/vijayksingh/metalui">Source on GitHub</a></p></main><nav aria-label="Documentation">${groups}</nav></div>`;
}

function htmlFor(path, page) {
  const pageType = path === '/' ? 'SoftwareSourceCode' : 'TechArticle';
  const schema = path === '/' ? {
    '@context': 'https://schema.org', '@type': pageType, name: 'MetalUI', description: page.description,
    url: origin, codeRepository: 'https://github.com/vijayksingh/metalui',
    programmingLanguage: ['TypeScript', 'Swift'], license: 'https://opensource.org/license/mit',
  } : {
    '@context': 'https://schema.org', '@type': pageType, headline: page.label,
    description: page.description, url: page.canonical, isPartOf: { '@type': 'WebSite', name: 'MetalUI', url: origin },
  };
  const head = `    <title>${escapeHtml(page.title)}</title>\n` +
    `    <meta name="description" content="${escapeHtml(page.description)}" />\n` +
    `    <link rel="canonical" href="${page.canonical}" />\n` +
    `    <meta property="og:type" content="${path === '/' ? 'website' : 'article'}" />\n` +
    `    <meta property="og:site_name" content="MetalUI" />\n` +
    `    <meta property="og:title" content="${escapeHtml(page.title)}" />\n` +
    `    <meta property="og:description" content="${escapeHtml(page.description)}" />\n` +
    `    <meta property="og:url" content="${page.canonical}" />\n` +
    `    <meta property="og:image" content="${origin}/og.png" />\n` +
    `    <meta property="og:image:width" content="2400" />\n` +
    `    <meta property="og:image:height" content="1260" />\n` +
    `    <meta property="og:image:alt" content="MetalUI: UI components that feel like real objects, for React and SwiftUI" />\n` +
    `    <meta name="twitter:card" content="summary_large_image" />\n` +
    `    <meta name="twitter:image" content="${origin}/og.png" />\n` +
    `    <meta name="twitter:title" content="${escapeHtml(page.title)}" />\n` +
    `    <meta name="twitter:description" content="${escapeHtml(page.description)}" />\n` +
    `    <link rel="alternate" type="text/markdown" href="${page.agent}" title="Agent guide" />\n` +
    `    <script type="application/ld+json">${escapeJson(schema)}</script>`;
  const fallbackStyle = `<style>.discovery-page{font:16px/1.6 system-ui,sans-serif;max-width:1080px;margin:auto;padding:32px;color:#252524;background:#f1eee7}.discovery-page a{color:inherit}.discovery-page header{font-weight:700}.discovery-page header span,.discovery-kicker{color:#62625d}.discovery-page main{padding:80px 0 48px}.discovery-page h1{font-size:clamp(40px,7vw,76px);line-height:1.05;letter-spacing:-.05em}.discovery-page main>p{max-width:680px}.discovery-page nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px;border-top:1px solid #c9c5bb}.discovery-page nav ul{list-style:none;padding:0}.discovery-page nav li{padding:3px 0}</style>`;
  return template
    .replace(/    <title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>\s*<link rel="alternate"[^>]*>/, `${head}\n${fallbackStyle}`)
    .replace('<div id="root"></div>', `<div id="root">${staticContent(path, page)}</div>`);
}

const pages = Object.fromEntries(paths.map((path) => [path, pageFor(path)]));
const byTitle = new Map();
for (const [path, page] of Object.entries(pages)) byTitle.set(page.title, [...(byTitle.get(page.title) ?? []), path]);
for (const [title, at] of byTitle) if (at.length > 1) throw new Error(`Two pages share the title "${title}": ${at.join(', ')}`);
for (const [path, page] of Object.entries(pages)) {
  const filename = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
  const target = resolve(dist, filename);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, htmlFor(path, page));
}
writeFileSync(resolve(dist, 'site-meta.json'), JSON.stringify(Object.fromEntries(Object.entries(pages).map(([path, { title, description, canonical, agent }]) => [path, { title, description, canonical, agent }])), null, 2) + '\n');
// The social card, captured from the landing page by scripts/build-og.mjs.
copyFileSync(resolve(root, 'apps/docs/og.png'), resolve(dist, 'og.png'));
writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
writeFileSync(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(resolve(dist, '404.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found — MetalUI</title></head><body><main><h1>Page not found</h1><p><a href="/">Go to MetalUI</a></p></main></body></html>\n');
console.log(`site discovery: ${paths.length} pages, sitemap, robots.txt, and 404`);
