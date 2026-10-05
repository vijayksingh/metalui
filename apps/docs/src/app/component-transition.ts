// Match a control's resting body. Portalled overlays travel through their trigger;
// no popup is opened just to make a navigation snapshot.
export const COMPONENT_TARGETS: Record<string, string> = {
  button: '.mu-button', 'icon-button': '.mu-icon-button', 'button-group': '.mu-button-group',
  toggle: '.mu-toggle', menu: '.mu-button', toolbar: '.mu-toolbar',
  field: '.mu-field', textarea: '.mu-textarea', select: '.mu-select-trigger', combobox: '.mu-combobox',
  checkbox: '.mu-dimple', 'checkbox-group': '.mu-checkbox-group', radio: '.mu-radio',
  switch: '.mu-switch', slider: '.mu-slider', 'number-field': '.mu-number-field', switcher: '.mu-switcher',
  calendar: '.mu-date-picker', 'form-field': '.mu-form-field', 'rename-editor': '.mu-button',
  tabs: '.mu-tabs', accordion: '.mu-accordion', link: '.mu-link', breadcrumbs: '.mu-breadcrumbs',
  pagination: '.mu-pagination', menubar: '.mu-menubar', 'navigation-menu': '.mu-navigation-menu',
  'scroll-area': '.mu-scroll-area', dialog: '.mu-button', 'alert-dialog': '.mu-button', sheet: '.mu-button',
  popover: '.mu-button', tooltip: '.mu-icon-button', 'preview-card': '.mu-link',
  'command-palette': '.mu-button', status: '.mu-badge', progress: '.mu-progress', meter: '.mu-meter',
  spinner: '.mu-button', toast: '.mu-button', fan: '.mu-fan', 'draw-tools': '.mu-toolbar',
  'tool-strip': '.mu-button', settings: '.mu-settings', 'colour-cue': '.mu-colour-cue',
  'date-cue': '.mu-date-cue', 'numeric-cue': '.mu-numeric-cue', 'enum-cue': '.mu-enum-cue',
  'person-cue': '.mu-person-cue', 'tag-cue': '.mu-enum-cue', 'link-cue': '.mu-link-cue',
};

// Waiting and selection tools have action hosts at rest; their transient controls only
// exist after an action. Preserve that resting state on arrival.
const RESTING_DETAIL_TARGETS: Record<string, string> = {
  spinner: '.stage [data-testid="waiting-action"] .mu-button',
  tooltip: '.stage [data-testid="loose"] button',
  'tool-strip': '.stage .mu-button',
};

export function componentDetailTarget(path: string): string | undefined {
  if (!path.startsWith('/components/')) return;
  const name = path.split('/').at(-1)!;
  return RESTING_DETAIL_TARGETS[name] ?? (COMPONENT_TARGETS[name] && `.stage ${COMPONENT_TARGETS[name]}`);
}
