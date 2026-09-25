// Every component and block folder with a meta.json (src/components, src/blocks), sorted by name.
// Each meta carries `dir` (e.g. "components/region" or "blocks/filter-bar"), `folder` (component | block,
// where it sits on disk today) and `layer` (docs/COMPOSITION.md: part, component, object, instrument, place).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './emit.mjs';

function scan(folder) {
  const base = root('packages/metalui/src', folder === 'block' ? 'blocks' : 'components');
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(base, d.name, 'meta.json')))
    .map((d) => {
      const meta = JSON.parse(readFileSync(join(base, d.name, 'meta.json'), 'utf8'));
      return { ...meta, folder, dir: `${folder === 'block' ? 'blocks' : 'components'}/${d.name}` };
    });
}

/** Every part, whatever its folder. */
export function components() {
  return [...scan('component'), ...scan('block')].sort((a, b) => a.name.localeCompare(b.name));
}

/** By folder on disk (components/, blocks/), not by layer. */
export const primitives = () => scan('component').sort((a, b) => a.name.localeCompare(b.name));
export const blocks = () => scan('block').sort((a, b) => a.name.localeCompare(b.name));
