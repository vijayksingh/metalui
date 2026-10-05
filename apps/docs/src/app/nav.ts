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

/* The part pages, grouped by layer from each part's meta.json (app/parts.ts); nothing is filed by hand.
 * The nav reads from what people reach for to what it is made of: the controls first, then the blocks
 * built from them, then objects, what the hand and the canvas use, and the parts everything is cut
 * from. The build order (LAYERS, docs/COMPOSITION.md) is unchanged; this is only reading order. */
const READING_ORDER = ['component', 'object', 'instrument', 'place', 'part'] as const;
const LAYER_GROUPS: NavGroup[] = [...LAYERS].sort((a, b) => READING_ORDER.indexOf(a.layer) - READING_ORDER.indexOf(b.layer)).map(({ layer, label }) => ({
  label,
  items: membersOf(layer)
    .filter((m) => m.page)
    .map((m) => ({ to: m.page!, label: partLabel(m) })),
}));

export const NAV: NavGroup[] = [
  {
    label: 'Start',
    items: [
      { to: '/components', label: 'Component library' },
      { to: '/overview', label: 'Overview' },
      { to: '/layers', label: 'How it fits together' },
      { to: '/wip', label: 'Work in progress' },
      { to: '/changelog', label: 'Changelog' },
      { to: '/performance', label: 'Performance' },
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
      { to: '/foundations/motion', label: 'Motion' },
      { to: '/foundations/transitions', label: 'Transitions' },
    ],
  },
  LAYER_GROUPS[0],
  {
    label: 'Blocks',
    items: [
      { to: '/blocks/studio-week', label: 'Studio week' },
      { to: '/blocks/ai-composer', label: 'AI composer' },
      { to: '/blocks/share-panel', label: 'Share panel' },
      { to: '/blocks/availability-picker', label: 'Availability picker' },
      { to: '/blocks/task-inbox', label: 'Task inbox' },
      { to: '/blocks/settings', label: 'Settings' },
    ],
  },
  ...LAYER_GROUPS.slice(1),
  {
    label: 'Assets',
    items: [
      { to: '/icons', label: 'Icons', meta: '40' },
      { to: '/icons/life', label: 'Life icons', meta: '108' },
    ],
  },
];
