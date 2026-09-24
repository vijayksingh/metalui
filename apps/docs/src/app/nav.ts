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
  {
    label: 'Components',
    items: [
      { to: '/components/button', label: 'Button' },
      { to: '/components/segmented', label: 'Segmented control' },
      { to: '/components/kbd', label: 'Keycap' },
      { to: '/components/swatch', label: 'Swatch' },
      { to: '/components/checkbox', label: 'Checkbox' },
      { to: '/components/slider', label: 'Slider' },
      { to: '/components/icon-button', label: 'Icon button' },
      { to: '/components/field', label: 'Field' },
      { to: '/components/dialog', label: 'Dialog' },
      { to: '/components/status', label: 'LED and status badge' },
      { to: '/components/toast', label: 'Toast' },
      { to: '/components/toolbar', label: 'Toolbar' },
      { to: '/components/command-palette', label: 'Command palette' },
      { to: '/components/tooltip', label: 'Tooltip' },
      { to: '/components/menu', label: 'Menu' },
    ],
  },
  {
    label: 'Objects',
    items: [
      { to: '/components/selection-frame', label: 'Selection frame' },
      { to: '/components/snap-guides', label: 'Snap guides' },
      { to: '/components/lasso', label: 'Lasso' },
      { to: '/components/block-silhouette', label: 'Block silhouette' },
      { to: '/components/cue', label: 'Cue family' },
      { to: '/components/suggestion-chip', label: 'Suggestion chip' },
      { to: '/components/link-card', label: 'Link card' },
      { to: '/components/hover-engraving', label: 'Hover engraving' },
      { to: '/components/provenance-tooltip', label: 'Provenance tooltip' },
      { to: '/components/region', label: 'Region' },
      { to: '/components/lens-bar', label: 'Lens bar' },
      { to: '/components/memory-scrubber', label: 'Memory scrubber' },
      { to: '/components/past-banner', label: 'Past banner' },
      { to: '/components/tool-strip', label: 'Tool strip' },
      { to: '/components/size-readout', label: 'Size readout' },
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
