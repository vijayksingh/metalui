// components/*/meta.json → shadcn registry: registry.json (source) + public/r/<name>.json (served).
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { root, emit, finish } from './lib/emit.mjs';
import { components } from './lib/components.mjs';

const ORIGIN = process.env.METALUI_REGISTRY_ORIGIN ?? 'https://metalui.dev';
const BASE_UI = JSON.parse(readFileSync(root('packages/metalui/package.json'), 'utf8')).dependencies['@base-ui/react'];
const SRC = root('packages/metalui/src');
const PACKAGE = '@unlocalhosted/metalui';

// Targets mirror src/ under the consumer's components/metalui/, so every relative import
// (../../motion/swap, ../../components/surface/surface) resolves there unchanged.
const target = (path) => `components/metalui/${relative(SRC, root(path))}`;
const file = (path, type) => ({ path, type, target: target(path), content: readFileSync(root(path), 'utf8') });
const fileType = (f) => (f.endsWith('.css') ? 'registry:file' : 'registry:ui');

// Files that components share without being components: each becomes one registry item.
const shared = {
  colorway: {
    title: 'MetalUI portal colorway',
    description: 'Reactive inheritance of an anchor colorway across DOM portals.',
    dependsOn: [],
    files: ['theme/portal-colorway.ts'],
  },
  motion: {
    title: 'MetalUI motion',
    description: 'Springs, swap, indicator, refuse, waiting, awake and haptic helpers that MetalUI components use.',
    dependsOn: [],
    files: ['motion/awake.ts', 'motion/haptic.ts', 'motion/hop.ts', 'motion/indicator.tsx', 'motion/layout-effect.ts', 'motion/leave.ts', 'motion/reduced.ts', 'motion/refuse.ts', 'motion/springs.generated.ts', 'motion/swap.tsx', 'motion/waiting.ts', 'motion/waiting.generated.ts'],
  },
  icons: {
    title: 'MetalUI icon runtime',
    description: 'The Icon element, the icon catalog and the tick drawing that components such as Checkbox and Toast use.',
    dependsOn: [],
    files: ['icons/Icon.tsx', 'icons/catalog.generated.ts', 'icons/icons.generated.css', 'icons/tick.generated.ts'],
  },
  'cue-document': {
    title: 'MetalUI source text history',
    description: 'UTF16 source ranges, one gesture per undo entry, and retained selection for editable cues.',
    dependsOn: [],
    files: ['text/cue-document.ts'],
  },
  'life-icons': {
    title: 'MetalUI life glyph runtime',
    description: 'Canonical life glyphs, tuned cuts and finite hover acts.',
    dependsOn: ['motion'],
    files: ['icons/life/LifeIcon.tsx', 'icons/life/catalog.generated.ts', 'icons/life/icons-life.generated.css', 'icons/life/tints.generated.ts'],
  },
  'tick-glyph': {
    title: 'MetalUI selected mark',
    description: 'The shared tick pen: draw, withdraw and dash-to-tick bend on the generated check route.',
    dependsOn: ['icons', 'motion'],
    files: ['icons/TickGlyph.tsx'],
  },
  'morph-icons': {
    title: 'MetalUI glyph morph runtime',
    description: 'The MorphIcon element, canonical glyph geometry and shared-settle morph engine for meaning changes.',
    dependsOn: ['motion'],
    files: ['icons/MorphIcon.tsx', 'icons/morph.ts', 'icons/morph.generated.ts'],
  },
  'icon-components': {
    title: 'MetalUI icon components',
    description: 'Every product icon as a named React component.',
    dependsOn: ['icons'],
    files: ['icons/components.generated.tsx'],
  },
};
const sharedByFile = new Map(Object.entries(shared).flatMap(([name, g]) => g.files.map((f) => [join(SRC, f), name])));

// The tokens and theme come from the package, not a copy: a copied file can only be imported by a path
// relative to the user's own CSS file, which the CLI cannot know (src/index.css, app/globals.css,
// src/app/globals.css), and Next.js fails the build on a wrong one. A package import resolves everywhere.
// TOKENS_SINCE is the first release whose tokens.css/theme.css the components expect; raise it by hand
// when a component starts needing newer tokens.
const TOKENS_SINCE = '0.4.0';
const tokensItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'tokens',
  type: 'registry:style',
  title: 'MetalUI tokens',
  description: 'Soft Hardware colorways (bone, graphite), materials, caps and springs as --mu-* custom properties, and the Tailwind v4 theme built on them. Every component needs it; it installs @unlocalhosted/metalui and imports its tokens.css and theme.css into your global CSS.',
  dependencies: [`${PACKAGE}@^${TOKENS_SINCE}`],
  css: {
    [`@import "${PACKAGE}/tokens.css"`]: {},
    [`@import "${PACKAGE}/theme.css"`]: {},
  },
};

const resolve = (from, spec) => {
  const base = join(dirname(from), spec);
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}.css`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  throw new Error(`${relative(SRC, from)} imports ${spec}, which does not exist`);
};
const imports = (f) => [...readFileSync(f, 'utf8').matchAll(/(?:from|import)\s+['"](\.{1,2}\/[^'"]+)['"]/g)].map((m) => m[1]);

const metas = components();
const byDir = new Map(metas.map((m) => [m.dir, m]));
const ownerOf = (abs) => {
  if (sharedByFile.has(abs)) return { shared: sharedByFile.get(abs) };
  const rel = relative(SRC, abs);
  const m = byDir.get(dirname(rel));
  if (m) return { component: m.name };
  throw new Error(`${rel} is imported by a component but belongs to no component or shared item`);
};

const items = metas.map((meta) => {
  const own = new Set(meta.react.files.map((f) => join(SRC, meta.dir, f)));
  const deps = new Set([`${ORIGIN}/r/tokens.json`]);
  for (const f of own) {
    for (const spec of imports(f)) {
      const abs = resolve(f, spec);
      if (own.has(abs)) continue;
      const owner = ownerOf(abs);
      deps.add(`${ORIGIN}/r/${owner.shared ?? owner.component}.json`);
    }
  }
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: meta.name,
    type: 'registry:ui',
    title: meta.title,
    description: meta.description,
    dependencies: meta.base?.startsWith('@base-ui') ? [`@base-ui/react@${BASE_UI}`] : [],
    registryDependencies: [...deps].sort(),
    files: meta.react.files.map((f) => file(`packages/metalui/src/${meta.dir}/${f}`, fileType(f))),
    dir: meta.dir,
    docs: `Agent guide: ${ORIGIN}/r/${meta.name}.md. SwiftUI: ${meta.swift.symbol} in the MetalUI Swift package.`,
  };
});

// Blocks: whole screens that the docs site builds from the published package. Copied into a project,
// not imported; they depend on the package (and Base UI) from npm, so they need the release in `since`.
const BLOCKS = root('apps/docs/src/blocks');
const blockItems = readdirSync(BLOCKS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(BLOCKS, d.name, 'meta.json')))
  .map((d) => {
    const meta = JSON.parse(readFileSync(join(BLOCKS, d.name, 'meta.json'), 'utf8'));
    const deps = new Set();
    for (const f of meta.react.files) {
      const path = join(BLOCKS, d.name, f);
      const text = readFileSync(path, 'utf8');
      if (imports(path).length) throw new Error(`${meta.name}: a block imports only packages, not relative files (${f})`);
      for (const [, spec] of text.matchAll(/(?:from|import)\s+['"]([^.'"][^'"]*)['"]/g)) {
        if (spec === 'react' || spec === 'react-dom') continue;
        if (spec === PACKAGE || spec.startsWith(`${PACKAGE}/`)) deps.add(`${PACKAGE}@^${meta.since}`);
        else if (spec.startsWith('@base-ui/react/')) deps.add(`@base-ui/react@${BASE_UI}`);
        else throw new Error(`${meta.name} imports ${spec}, which no registry item provides`);
      }
    }
    const blockFile = (f) => ({ path: `apps/docs/src/blocks/${d.name}/${f}`, type: 'registry:block', target: `components/metalui/screens/${d.name}/${f}`, content: readFileSync(join(BLOCKS, d.name, f), 'utf8') });
    return {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name: meta.name,
      type: 'registry:block',
      title: meta.title,
      description: meta.description,
      dependencies: [...deps].sort(),
      registryDependencies: [`${ORIGIN}/r/tokens.json`],
      files: meta.react.files.map(blockFile),
      docs: `Docs: ${ORIGIN}${meta.page}. Import it from components/metalui/screens/${d.name}/${d.name}. Needs ${PACKAGE}@^${meta.since}.`,
    };
  });

const sharedItems = Object.entries(shared).map(([name, g]) => ({
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name,
  type: 'registry:lib',
  title: g.title,
  description: g.description,
  registryDependencies: g.dependsOn.map((d) => `${ORIGIN}/r/${d}.json`),
  files: g.files.map((f) => file(`packages/metalui/src/${f}`, fileType(f))),
}));

for (const item of [tokensItem, ...sharedItems, ...blockItems]) emit(`packages/metalui/public/r/${item.name}.json`, JSON.stringify(item, null, 2) + '\n');
for (const { dir, ...item } of items) {
  emit(`packages/metalui/public/r/${item.name}.json`, JSON.stringify(item, null, 2) + '\n');
  item.dir = dir;
  emit(`packages/metalui/public/r/${item.name}.md`, readFileSync(root('packages/metalui/src', item.dir, `${item.name}.agent.md`), 'utf8'));
}

const strip = ({ $schema, dir, ...item }) => ({ ...item, ...(item.files && { files: item.files.map(({ content, ...f }) => f) }) });
emit('packages/metalui/registry.json', JSON.stringify({
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'metalui',
  homepage: ORIGIN,
  items: [strip(tokensItem), ...sharedItems.map(strip), ...items.map(strip), ...blockItems.map(strip)],
}, null, 2) + '\n');
// Items whose source is gone must not keep being served (a removed component stays installable otherwise).
const served = new Set([tokensItem, ...sharedItems, ...blockItems, ...items].flatMap(({ name }) => [`${name}.json`, `${name}.md`]));
for (const f of readdirSync(root('packages/metalui/public/r'))) {
  if (served.has(f)) continue;
  if (process.argv.includes('--check')) emit(`packages/metalui/public/r/${f}`, null);
  else unlinkSync(root('packages/metalui/public/r', f));
}
finish(`registry (${items.length} components, ${blockItems.length} blocks)`);
