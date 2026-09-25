// components/*/meta.json → shadcn registry: registry.json (source) + public/r/<name>.json (served).
// Targets mirror this repository's layout, so each component's relative
// `../tokens.css` import keeps working in the consumer's project.
import { readFileSync, readdirSync } from 'node:fs';
import { root, emit, finish } from './lib/emit.mjs';
import { components } from './lib/components.mjs';

const ORIGIN = 'https://metalui.dev';
const BASE_UI = JSON.parse(readFileSync(root('packages/metalui/package.json'), 'utf8')).dependencies['@base-ui/react'];

const file = (path, type, target) => ({ path, type, target, content: readFileSync(root(path), 'utf8') });

const tokensItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'tokens',
  type: 'registry:style',
  title: 'MetalUI tokens',
  description: 'Soft Hardware colorways (bone, graphite), materials, caps and springs as --mu-* custom properties. Every component imports it.',
  files: [file('packages/metalui/src/components/tokens.css', 'registry:file', 'components/metalui/tokens.css')],
};

// The gadget foundations a gadget Part draws from (meta.json "recipe": "gadgets"): the generated tables,
// colour, the one light, the host, and the Part drawings. Targets mirror the package (src/gadgets →
// components/gadgets), so a Part's relative ../../gadgets imports keep working.
const GADGET_LIB = ['gadgets.generated.ts', 'color.ts', 'light.ts', 'host.ts', ...readdirSync(root('packages/metalui/src/gadgets/parts')).filter((f) => f.endsWith('.ts')).map((f) => `parts/${f}`)];
const gadgetsItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'gadgets',
  type: 'registry:lib',
  title: 'MetalUI gadget foundations',
  description: 'The seven materials lit by one light (OKLCH pigments, SVG lighting filters), the host, and the drawings of the gadget Parts.',
  files: GADGET_LIB.map((f) => file(`packages/metalui/src/gadgets/${f}`, 'registry:lib', `components/gadgets/${f}`)),
};

const items = components().map((meta) => ({
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: meta.name,
  type: 'registry:ui',
  title: meta.title,
  description: meta.description,
  dependencies: meta.base?.startsWith('@base-ui') ? [`@base-ui/react@${BASE_UI}`] : [],
  registryDependencies: [`${ORIGIN}/r/tokens.json`, ...(meta.recipe === 'gadgets' ? [`${ORIGIN}/r/gadgets.json`] : [])],
  files: meta.react.files.map((f) => file(`packages/metalui/src/${meta.dir}/${f}`, f.endsWith('.css') ? 'registry:file' : 'registry:ui', `components/metalui/${meta.dir.split('/')[0] === 'blocks' ? 'blocks/' : ''}${meta.name}/${f}`)),
  dir: meta.dir,
  docs: `Agent guide: ${ORIGIN}/r/${meta.name}.md. SwiftUI: ${meta.swift.symbol} in the MetalUI Swift package.`,
}));

emit('packages/metalui/public/r/tokens.json', JSON.stringify(tokensItem, null, 2) + '\n');
emit('packages/metalui/public/r/gadgets.json', JSON.stringify(gadgetsItem, null, 2) + '\n');
for (const { dir, ...item } of items) {
  emit(`packages/metalui/public/r/${item.name}.json`, JSON.stringify(item, null, 2) + '\n');
  item.dir = dir;
  emit(`packages/metalui/public/r/${item.name}.md`, readFileSync(root('packages/metalui/src', item.dir, `${item.name}.agent.md`), 'utf8'));
}

const strip = ({ $schema, dir, ...item }) => ({ ...item, files: item.files.map(({ content, ...f }) => f) });
emit('packages/metalui/registry.json', JSON.stringify({
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'metalui',
  homepage: ORIGIN,
  items: [strip(tokensItem), strip(gadgetsItem), ...items.map(strip)],
}, null, 2) + '\n');
finish(`registry (${items.length} components)`);
