/* Every part of the system with its layer (docs/COMPOSITION.md), read from each part's meta.json.
 * The nav and the layers page both read this, so neither files anything by hand. */

export interface PartMeta { name: string; title?: string; nav?: string; layer: string; page?: string }

const FROM_META = Object.values(import.meta.glob<PartMeta>('../../../../packages/metalui/src/*/*/meta.json', { eager: true, import: 'default' }));

/** Doc pages whose part has no meta.json yet; they move into FROM_META when it lands. */
const WITHOUT_META: PartMeta[] = [
  { name: 'swatch', title: 'Swatch', layer: 'part', page: '/components/swatch' },
  { name: 'cue', title: 'Cue family', layer: 'instrument', page: '/components/cue' },
];

export const PARTS: PartMeta[] = [...FROM_META, ...WITHOUT_META];

export const LAYERS = [
  { layer: 'part', label: 'Parts' },
  { layer: 'component', label: 'Components' },
  { layer: 'object', label: 'Objects' },
  { layer: 'instrument', label: 'Instruments' },
  { layer: 'place', label: 'Places' },
] as const;

export const partLabel = (m: PartMeta) => m.nav ?? m.title ?? m.name;

/** The members of one layer, by label. */
export const membersOf = (layer: string) => PARTS.filter((m) => m.layer === layer).sort((a, b) => partLabel(a).localeCompare(partLabel(b)));
