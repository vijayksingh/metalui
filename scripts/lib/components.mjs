// Every component and block folder with a meta.json (src/components, src/blocks), sorted by name.
// Each meta carries `dir` (e.g. "components/region" or "blocks/filter-bar") and `layer`.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './emit.mjs';

function scan(layer) {
  const base = root('packages/metalui/src', layer === 'block' ? 'blocks' : 'components');
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(base, d.name, 'meta.json')))
    .map((d) => {
      const meta = JSON.parse(readFileSync(join(base, d.name, 'meta.json'), 'utf8'));
      return { layer, ...meta, dir: `${layer === 'block' ? 'blocks' : 'components'}/${d.name}` };
    });
}

/** Components (primitives) and blocks together. */
export function components() {
  return [...scan('component'), ...scan('block')].sort((a, b) => a.name.localeCompare(b.name));
}

export const primitives = () => scan('component').sort((a, b) => a.name.localeCompare(b.name));
export const blocks = () => scan('block').sort((a, b) => a.name.localeCompare(b.name));
