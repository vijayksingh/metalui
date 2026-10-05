import * as React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { CommandPalette, type CommandPaletteItem } from '@unlocalhosted/metalui';
import { Icon, SearchIcon, DocumentIcon } from '@unlocalhosted/metalui/icons';
import { LifeIcon } from '@unlocalhosted/metalui/icons/life';
import { NAV } from './nav';

/* ─────────────────────────────────────────────────────────
 * SITE SEARCH · the masthead's "Search the system", on MetalUI's CommandPalette
 *
 * Opens on ⌘K / Ctrl+K anywhere in the shell, or from the masthead (a `metalui:search` event).
 * The Command Palette page keeps ⌘K for its own demo, as its page says.
 *   empty     the sections, to jump to
 *   typing    pages whose label, section or description has every word, then glyphs whose
 *             name, category, motion or synonyms do; eight of each, best first
 *   ↩         goes to the page; ⎋ or the scrim closes
 * The glyph index (both catalogs) loads on first open, so no page pays for it up front.
 * ───────────────────────────────────────────────────────── */

export const OPEN_SEARCH = 'metalui:search';
const PALETTE_DEMO = '/components/command-palette';
const LIMIT = 8;

type Entry = { to: string; label: string; section: string; text: string; glyph?: { kind: 'product' | 'life'; name: string } };

const PAGES: Entry[] = NAV.flatMap(group => [
  ...(group.to ? [{ to: group.to, label: group.label, section: group.label, text: `${group.label} ${group.description ?? ''}` }] : []),
  ...group.items.map(item => ({ to: item.to, label: item.label, section: group.label, text: `${item.label} ${group.label}` })),
]);
const SECTIONS = NAV.filter(group => group.to);

/** Every word must appear; a label that starts with the query ranks first. */
function match(entries: Entry[], query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const q = query.trim().toLowerCase();
  return entries
    .filter(entry => words.every(word => entry.text.toLowerCase().includes(word)))
    .map(entry => ({ entry, rank: entry.label.toLowerCase().startsWith(q) ? 0 : entry.label.toLowerCase().includes(q) ? 1 : 2 }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, LIMIT)
    .map(({ entry }) => entry);
}

export function SiteSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [glyphs, setGlyphs] = React.useState<Entry[]>([]);

  React.useEffect(() => {
    const show = () => { setQuery(''); setOpen(true); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || !event.isTrusted) return;
      if (window.location.pathname === PALETTE_DEMO) return;
      event.preventDefault();
      show();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_SEARCH, show);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener(OPEN_SEARCH, show); };
  }, []);

  React.useEffect(() => {
    if (!open || glyphs.length) return;
    import('./icon-pages').then(({ ICON_PAGES }) => setGlyphs(ICON_PAGES.map(icon => ({
      to: icon.to, label: icon.label, section: icon.kind === 'life' ? 'Life icons' : 'Icons',
      text: `${icon.label} ${icon.name} ${icon.category} ${icon.description} ${icon.keywords} icon`, glyph: { kind: icon.kind, name: icon.name },
    }))));
  }, [open, glyphs.length]);

  React.useEffect(() => setOpen(false), [pathname]);

  const items: CommandPaletteItem[] = query.trim()
    ? [
        ...match(PAGES, query).map(entry => ({ id: entry.to, section: 'PAGES', label: entry.label, icon: <DocumentIcon size={14} />, hint: <span className="mu-palette-eng mu-type-label">{entry.section}</span> })),
        ...match(glyphs, query).map(entry => ({ id: entry.to, section: 'ICONS', label: entry.label, icon: entry.glyph!.kind === 'life' ? <LifeIcon name={entry.glyph!.name as never} size={14} animate={false} /> : <Icon name={entry.glyph!.name as never} size={14} animate={false} />, hint: <span className="mu-palette-eng mu-type-label">{entry.section}</span> })),
      ]
    : SECTIONS.map(group => ({ id: group.to!, section: 'SECTIONS', label: group.label, icon: <DocumentIcon size={14} /> }));

  return <CommandPalette
    open={open}
    onOpenChange={setOpen}
    query={query}
    onQueryChange={setQuery}
    items={items}
    filter={false}
    pinnable={false}
    icon={<SearchIcon size={15} />}
    status={glyphs.length ? 'PAGES AND ICONS · KEYWORDS' : 'PAGES · LOADING ICONS'}
    onRun={item => navigate(item.id)}
  />;
}
