import { LAYERS, membersOf, partLabel } from './parts';

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

/* The part pages, grouped by layer from each part's meta.json (app/parts.ts); nothing is filed by hand. */
const LAYER_GROUPS: NavGroup[] = LAYERS.map(({ layer, label }) => ({
  label,
  items: membersOf(layer)
    .filter((m) => m.page)
    .map((m) => ({ to: m.page!, label: partLabel(m) })),
}));

export const NAV: NavGroup[] = [
  {
    label: 'Start',
    items: [
      { to: '/overview', label: 'Overview' },
      { to: '/layers', label: 'How it fits together' },
    ],
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
      { to: '/foundations/sound', label: 'Sound' },
      { to: '/foundations/gadgets', label: 'Gadgets' },
      { to: '/foundations/mechanisms', label: 'Mechanisms' },
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
