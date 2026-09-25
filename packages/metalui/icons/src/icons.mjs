// MetalUI Soft Hardware icon set: the catalog (name, category, label), in display order.
// 24×24 grid, stroke 1.7 (var --sw), round caps/joins. Each icon is drawn and animated in its own
// file, acts/<name>.mjs (docs/ICON-MOTION.md): its body with named parts, its act (study) and its
// construction note. Classes: .f = stroked + duotone fill, .s = solid fill, .d = duotone fill only,
// .ac = an accent, hidden at rest.
import { readdirSync } from 'node:fs';

export const ICONS = [
  { name: 'select', cat: 'Tools', label: 'Select' },
  { name: 'text', cat: 'Tools', label: 'Text' },
  { name: 'note', cat: 'Tools', label: 'Note' },
  { name: 'image', cat: 'Tools', label: 'Image' },
  { name: 'link', cat: 'Tools', label: 'Link' },
  { name: 'draw', cat: 'Tools', label: 'Draw' },
  { name: 'pen', cat: 'Tools', label: 'Pen' },
  { name: 'marker', cat: 'Tools', label: 'Marker' },
  { name: 'line', cat: 'Tools', label: 'Line' },
  { name: 'arrow', cat: 'Tools', label: 'Arrow' },
  { name: 'rectangle', cat: 'Tools', label: 'Rectangle' },
  { name: 'ellipse', cat: 'Tools', label: 'Ellipse' },
  { name: 'eraser', cat: 'Tools', label: 'Eraser' },
  { name: 'layout', cat: 'Tools', label: 'Layout' },
  { name: 'tidy', cat: 'Tools', label: 'Tidy' },
  { name: 'search', cat: 'Tools', label: 'Search' },
  { name: 'zoom-in', cat: 'Tools', label: 'Zoom In' },
  { name: 'zoom-out', cat: 'Tools', label: 'Zoom Out' },
  { name: 'fit', cat: 'Tools', label: 'Fit' },
  { name: 'duplicate', cat: 'Actions', label: 'Duplicate' },
  { name: 'send-away', cat: 'Actions', label: 'Delete · Send away' },
  { name: 'trash', cat: 'Actions', label: 'Delete · Trash' },
  { name: 'group', cat: 'Actions', label: 'Group · Stack' },
  { name: 'ungroup', cat: 'Actions', label: 'Ungroup' },
  { name: 'pin', cat: 'Actions', label: 'Pin' },
  { name: 'board', cat: 'Actions', label: 'Board' },
  { name: 'share', cat: 'Actions', label: 'Share · Export' },
  { name: 'undo', cat: 'Actions', label: 'Undo' },
  { name: 'redo', cat: 'Actions', label: 'Redo' },
  { name: 'more', cat: 'Actions', label: 'More' },
  { name: 'close', cat: 'Actions', label: 'Close' },
  { name: 'check', cat: 'Actions', label: 'Check' },
  { name: 'synced', cat: 'Status', label: 'Synced' },
  { name: 'offline', cat: 'Status', label: 'Offline' },
  { name: 'sync-error', cat: 'Status', label: 'Sync Error' },
  { name: 'capture', cat: 'Status', label: 'Capture' },
  { name: 'paste', cat: 'Status', label: 'Paste' },
  { name: 'keeper', cat: 'Status', label: 'Keeper' },
  { name: 'plus', cat: 'Actions', label: 'New' },
  { name: 'region', cat: 'Tools', label: 'Region' },
  { name: 'task', cat: 'Tools', label: 'Task' },
  { name: 'tag', cat: 'Tools', label: 'Tag' },
  { name: 'calendar', cat: 'Tools', label: 'Calendar' },
  { name: 'document', cat: 'Tools', label: 'Document' },
  { name: 'clock', cat: 'Status', label: 'Time' },
  { name: 'me', cat: 'Tools', label: 'Me' },
  { name: 'seed', cat: 'Actions', label: 'Seed sample' },
];

// MU_ICON_ACTS=a,b loads only those acts (the film tool, so one icon in progress never breaks another).
const only = process.env.MU_ICON_ACTS?.split(',');
const files = readdirSync(new URL('./acts/', import.meta.url)).filter((f) => f.endsWith('.mjs'));
for (const ic of ICONS) if (!only && !files.includes(`${ic.name}.mjs`)) throw new Error(`icon ${ic.name} has no act (acts/${ic.name}.mjs)`);
for (const file of files.filter((f) => !only || only.includes(f.slice(0, -4))).sort()) {
  const name = file.slice(0, -4);
  const ic = ICONS.find((i) => i.name === name);
  if (!ic) throw new Error(`acts/${file}: no icon named ${name}`);
  const { act } = await import(new URL(`./acts/${file}`, import.meta.url));
  Object.assign(ic, { body: act.body, defs: act.defs, study: act.study, shape: act.shape, hover: act.study.caption, press: 'plays the same act' });
}
