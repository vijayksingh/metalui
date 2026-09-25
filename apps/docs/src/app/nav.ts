export interface NavItem {
  to: string;
  label: string;
  /** Short readout shown on the right of the row, e.g. a count. */
  meta?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/* The part pages, grouped by layer (docs/COMPOSITION.md) from each part's meta.json: `layer`, `page`
 * and `nav` (or `title`). Nothing is filed by hand, so the nav can't disagree with the layer check. */
interface PartMeta { name: string; title?: string; nav?: string; layer: string; page?: string }
const METAS = Object.values(import.meta.glob<PartMeta>('../../../../packages/metalui/src/*/*/meta.json', { eager: true, import: 'default' }));

/** Doc pages whose part has no meta.json yet; they move into METAS when it lands. */
const WITHOUT_META: PartMeta[] = [
  { name: 'swatch', title: 'Swatch', layer: 'part', page: '/components/swatch' },
  { name: 'cue', title: 'Cue family', layer: 'instrument', page: '/components/cue' },
];

const LAYERS = [
  { layer: 'part', label: 'Parts' },
  { layer: 'component', label: 'Components' },
  { layer: 'object', label: 'Objects' },
  { layer: 'instrument', label: 'Instruments' },
  { layer: 'place', label: 'Places' },
];

const LAYER_GROUPS: NavGroup[] = LAYERS.map(({ layer, label }) => ({
  label,
  items: [...METAS, ...WITHOUT_META]
    .filter((m) => m.layer === layer && m.page)
    .map((m) => ({ to: m.page!, label: m.nav ?? m.title ?? m.name }))
    .sort((x, y) => x.label.localeCompare(y.label)),
}));

export const NAV: NavGroup[] = [
  {
    label: 'Start',
    items: [{ to: '/overview', label: 'Overview' }],
  },
  {
    label: 'Foundations',
    items: [
      { to: '/foundations', label: 'Principles' },
      { to: '/foundations/color', label: 'Color & ink' },
      { to: '/foundations/typography', label: 'Typography' },
      { to: '/foundations/radius', label: 'Radius' },
      { to: '/foundations/spacing', label: 'Spacing' },
      { to: '/foundations/sizing', label: 'Sizing' },
      { to: '/foundations/elevation', label: 'Elevation' },
      { to: '/foundations/materials', label: 'Materials' },
      { to: '/foundations/motion', label: 'Motion' },
      { to: '/foundations/transitions', label: 'Transitions' },
    ],
  },
  ...LAYER_GROUPS,
  {
    label: 'Assets',
    items: [
      { to: '/icons', label: 'Icons', meta: '40' },
      { to: '/icons/life', label: 'Life icons', meta: '108' },
    ],
  },
];
