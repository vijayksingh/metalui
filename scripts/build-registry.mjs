// components/*/meta.json → shadcn registry: registry.json (source) + public/r/<name>.json (served).
// Targets mirror this repository's layout, so each component's relative
// `../tokens.css` import keeps working in the consumer's project.
import { readFileSync } from 'node:fs';
import { root, emit, finish } from './lib/emit.mjs';
import { components } from './lib/components.mjs';

const ORIGIN = 'https://metalui.dev';
const BASE_UI = JSON.parse(readFileSync(root('package.json'), 'utf8')).dependencies['@base-ui/react'];

const file = (path, type, target) => ({ path, type, target, content: readFileSync(root(path), 'utf8') });

const tokensItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'tokens',
  type: 'registry:style',
  title: 'MetalUI tokens',
  description: 'Soft Hardware colorways (bone, graphite), materials, caps and springs as --mu-* custom properties. Every component imports it.',
  files: [file('components/tokens.css', 'registry:file', 'components/metalui/tokens.css')],
};

const items = components().map((meta) => ({
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: meta.name,
  type: 'registry:ui',
  title: meta.title,
  description: meta.description,
  dependencies: [`@base-ui/react@${BASE_UI}`],
  registryDependencies: [`${ORIGIN}/r/tokens.json`],
  files: meta.react.files.map((f) => file(`components/${meta.name}/${f}`, f.endsWith('.css') ? 'registry:file' : 'registry:ui', `components/metalui/${meta.name}/${f}`)),
  docs: `Agent guide: ${ORIGIN}/r/${meta.name}.md. SwiftUI: ${meta.swift.symbol} in the MetalUI Swift package.`,
}));

emit('public/r/tokens.json', JSON.stringify(tokensItem, null, 2) + '\n');
for (const item of items) {
  emit(`public/r/${item.name}.json`, JSON.stringify(item, null, 2) + '\n');
  emit(`public/r/${item.name}.md`, readFileSync(root('components', item.name, `${item.name}.agent.md`), 'utf8'));
}

const strip = ({ $schema, ...item }) => ({ ...item, files: item.files.map(({ content, ...f }) => f) });
emit('registry.json', JSON.stringify({
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'metalui',
  homepage: ORIGIN,
  items: [strip(tokensItem), ...items.map(strip)],
}, null, 2) + '\n');
finish(`registry (${items.length} components)`);
