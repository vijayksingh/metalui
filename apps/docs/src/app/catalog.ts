import { membersOf, partLabel } from './parts';

// Purpose is a discovery aid, not a composition layer. Identity, routes and descriptions
// still come from the package's meta.json through parts.ts.
export const CATALOG_GROUPS = [
  { id: 'actions', title: 'Actions', description: 'Make something happen.', keywords: 'action press click save command', names: ['button', 'icon-button', 'button-group', 'toggle', 'menu', 'toolbar'] },
  { id: 'input', title: 'Input & selection', description: 'Write, choose and adjust.', keywords: 'form choose one many type edit upload value', names: ['field', 'textarea', 'select', 'combobox', 'checkbox', 'radio', 'switch', 'slider', 'number-field', 'switcher', 'checkbox-group', 'calendar', 'form-field', 'rename-editor'] },
  { id: 'navigation', title: 'Navigation', description: 'Move through content without losing your place.', keywords: 'navigate find page section scroll', names: ['tabs', 'accordion', 'link', 'breadcrumbs', 'pagination', 'menubar', 'navigation-menu', 'scroll-area'] },
  { id: 'overlays', title: 'Overlays', description: 'Reveal detail, context or a decision.', keywords: 'confirm modal popup drawer help explain', names: ['dialog', 'alert-dialog', 'sheet', 'popover', 'tooltip', 'preview-card', 'command-palette'] },
  { id: 'feedback', title: 'Feedback', description: 'Show what happened and what comes next.', keywords: 'loading busy wait success error notification status', names: ['status', 'progress', 'meter', 'spinner', 'toast'] },
  { id: 'canvas', title: 'Canvas controls', description: 'Tools for working directly with objects.', keywords: 'draw canvas ink selection settings tools', names: ['fan', 'draw-tools', 'tool-strip', 'settings'] },
  { id: 'inline', title: 'Inline editing', description: 'Change meaning right where it appears.', keywords: 'text source words date colour color amount person tag url', names: ['colour-cue', 'date-cue', 'numeric-cue', 'enum-cue', 'person-cue', 'tag-cue', 'link-cue'] },
] as const;

export const CATALOG = membersOf('component').filter(part => part.page).map(part => ({
  ...part,
  label: partLabel(part),
  group: CATALOG_GROUPS.find(group => (group.names as readonly string[]).includes(part.name)),
  // Keep the short opening from the authored description, rather than duplicating product facts.
  summary: (part.description ?? '').split(/[;:]|\.\s/)[0].replace(/\.$/, '') + '.',
}));

export function catalogMatches(part: typeof CATALOG[number], query: string) {
  const words = `${part.label} ${part.name} ${part.description ?? ''} ${part.group?.title ?? ''} ${part.group?.keywords ?? ''}`.toLocaleLowerCase();
  return query.trim().toLocaleLowerCase().split(/\s+/).every(word => words.includes(word));
}
