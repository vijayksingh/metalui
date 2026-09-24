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

export const NAV: NavGroup[] = [
  {
    label: 'Start',
    items: [{ to: '/', label: 'Overview' }],
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
  {
    label: 'Components',
    items: [
      { to: '/components/button', label: 'Button' },
    ],
  },
  {
    label: 'Objects',
    items: [
      { to: '/components/selection-frame', label: 'Selection frame' },
      { to: '/components/cue', label: 'Cue family' },
      { to: '/components/suggestion-chip', label: 'Suggestion chip' },
      { to: '/components/hover-engraving', label: 'Hover engraving' },
      { to: '/components/provenance-tooltip', label: 'Provenance tooltip' },
      { to: '/components/region', label: 'Region' },
    ],
  },
  {
    label: 'Assets',
    items: [
      { to: '/icons', label: 'Icons', meta: '40' },
      { to: '/icons/life', label: 'Life icons', meta: '108' },
    ],
  },
];
