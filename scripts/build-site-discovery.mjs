// Publish one crawlable HTML document per docs route, plus discovery files.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAV } from '../apps/docs/src/app/nav.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'apps/docs/dist');
const origin = 'https://metalui.dev';
const template = readFileSync(resolve(dist, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>') || !template.includes('<title>MetalUI</title>')) {
  throw new Error('Unexpected Vite HTML template; update site discovery replacements');
}
const manifest = JSON.parse(readFileSync(resolve(dist, 'components.json'), 'utf8'));
const components = new Map(manifest.components.map((item) => [item.name, item]));

const descriptions = {
  '/': 'MetalUI makes Soft Hardware components for React and SwiftUI: soft plastic, smoked glass, metal, and controls that respond like physical objects.',
  '/overview': 'Explore MetalUI: Soft Hardware components, material recipes, motion, React and SwiftUI implementations, and guides for coding agents.',
  '/foundations': 'The principles behind MetalUI materials, color, typography, spacing, radius, elevation, and motion, with live adjustable examples.',
  '/foundations/color': 'Bone and graphite colorways, ink contrast, status signals, and feeling tints for the MetalUI design system.',
  '/foundations/typography': 'MetalUI type roles, font families, weights, and line spacing for legible hardware interfaces.',
  '/foundations/radius': 'The MetalUI radius ladder, nested corners, slabs, and pill shapes, explained with live examples.',
  '/foundations/spacing': 'A four-point spacing base and named relationships between MetalUI interface elements.',
  '/foundations/sizing': 'MetalUI control height and icon sizing rules across buttons, fields, and other components.',
  '/foundations/elevation': 'Five MetalUI elevation levels, each tied to a material recipe and a clear place in the interface.',
  '/foundations/materials': 'MetalUI material recipes for bone, graphite, frost, metal, wells, and glass, with shared CSS and SwiftUI rendering.',
  '/foundations/motion': 'MetalUI motion classes, physical springs, travel distances, and reduced-motion behavior.',
  '/foundations/transitions': 'MetalUI state-change recipes for press, selection, panels, labels, and icons.',
  '/icons': 'Browse MetalUI Soft Hardware icons: animated monoline and duotone glyphs for React, SwiftUI, and SVG.',
  '/icons/life': 'Browse MetalUI life icons for meals, feelings, people, places, weather, and everyday moments.',
  '/components/swatch': 'A glossy color chip with a readable color code; click it to choose a new color.',
  '/components/cue': 'Cues mark recognized dates, amounts, tags, and other meaning in text without shifting the letters.',
  '/components/lens-bar': 'A frosted bar that names a question, counts matches, shows provenance, and changes the view of a live lens.',
  '/components/memory-scrubber': 'A time slider that moves the canvas into its past and returns it to the present with NOW.',
};

const labelOf = (path) => path === '/' ? 'MetalUI' : NAV.flatMap((group) => group.items).find((item) => item.to === path)?.label;
const paths = ['/', ...NAV.flatMap((group) => group.items.map((item) => item.to))];
const routerSource = readFileSync(resolve(root, 'apps/docs/src/main.tsx'), 'utf8');
const routerPaths = [...routerSource.matchAll(/\bpath:\s*'([^']+)'/g)]
  .map((match) => match[1] === '/' ? '/' : `/${match[1]}`)
  .filter((path) => path !== '/*');
if (paths.length !== routerPaths.length || paths.some((path) => !routerPaths.includes(path))) {
  throw new Error('Docs navigation and router routes differ; update both before publishing discovery pages');
}
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const escapeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

function pageFor(path) {
  const name = path.split('/').at(-1);
  const component = path.startsWith('/components/') ? components.get(name) : undefined;
  const label = labelOf(path);
  if (!label) throw new Error(`Missing navigation label for ${path}`);
  const description = component?.description ?? descriptions[path];
  if (!description) throw new Error(`Missing search description for ${path}`);
  return {
    title: path === '/' ? 'MetalUI — Soft Hardware for React and SwiftUI' : `${label} — MetalUI`,
    description,
    canonical: `${origin}${path}`,
    agent: component ? `${origin}/r/${component.name}.md` : `${origin}/AI.md`,
    label,
    component,
  };
}

function staticContent(path, page) {
  const groups = NAV.map((group) => `<section><h2>${escapeHtml(group.label)}</h2><ul>${group.items.map((item) => `<li><a href="${escapeHtml(item.to)}">${escapeHtml(item.label)}</a></li>`).join('')}</ul></section>`).join('');
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
    `    <meta name="twitter:card" content="summary" />\n` +
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
for (const [path, page] of Object.entries(pages)) {
  const filename = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
  const target = resolve(dist, filename);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, htmlFor(path, page));
}
writeFileSync(resolve(dist, 'site-meta.json'), JSON.stringify(Object.fromEntries(Object.entries(pages).map(([path, { title, description, canonical, agent }]) => [path, { title, description, canonical, agent }])), null, 2) + '\n');
writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
writeFileSync(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(resolve(dist, '404.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found — MetalUI</title></head><body><main><h1>Page not found</h1><p><a href="/">Go to MetalUI</a></p></main></body></html>\n');
console.log(`site discovery: ${paths.length} pages, sitemap, robots.txt, and 404`);
