'use client';

import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Combobox } from '@base-ui/react/combobox';
import { Kbd } from '../kbd/kbd';
import './command-palette.css';

/* ─────────────────────────────────────────────────────────
 * COMMAND PALETTE (KAMUI-06; Kamui 04 §3; the medium demo's openPalette)
 * Base UI Dialog around an inline Combobox (the list is always open inside the plate).
 *   open      rises one nest (y −6, scale .985) on the surface spring over a page scrim at .25;
 *             focus lands in the field with the query already there (initial query)
 *   type      the list refilters at once; the first row is selected again (demo: idx = 0)
 *   ↑ ↓       move the selection; hover moves it too (demo: mousemove sets idx)
 *   ↩         runs the selected row and closes; ⇧↩ runs it pinned (a lens kept as a region)
 *   ⎋ / click outside   close at once, nothing runs
 *   selected  a raised cap with a 2.5 green-deep bar; instant (the list is scanned, not watched)
 * ───────────────────────────────────────────────────────── */

export interface CommandPaletteItem {
  /** Unique within the palette. */
  id: string;
  /** What the row says. Matches of the query are marked in it. */
  label: string;
  /** The section heading this row sits under: LENS, LENSES, FRAGMENTS, ACTIONS. Rows of one section must be adjacent. */
  section: string;
  /** The 14 glyph at the left, e.g. <LensIcon size={14} />. */
  icon?: React.ReactNode;
  /** The right side: a keycap (<Kbd>⌘Z</Kbd>) or a readout ("8:52", "RULES"). A string renders as an engraving. */
  hint?: React.ReactNode;
  /** More words the filter matches but the row does not show. */
  keywords?: string[];
  /** A destructive action: the row is red. */
  danger?: boolean;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The rows. By default the palette filters them by the query; pass `filter={false}` when the host filters. */
  items: CommandPaletteItem[];
  /** Runs a row. `pin` is true for ⇧↩. The palette closes first. */
  onRun: (item: CommandPaletteItem, options: { pin: boolean }) => void;
  /** The query, controlled. The host usually listens to add rows that depend on it (“See “q””). */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** The query the palette opens with (uncontrolled). */
  defaultQuery?: string;
  /** false: show `items` as given (the host filtered them). */
  filter?: boolean;
  placeholder?: string;
  /** The 15 search glyph in the field. */
  icon?: React.ReactNode;
  /** Right of the footer keys: where answers come from, e.g. "NATURAL LANGUAGE VIA JEV". */
  status?: string;
  /** Whether ⇧↩ pins (shows in the footer). */
  pinnable?: boolean;
  /** What the list says when nothing matches. */
  empty?: React.ReactNode;
  'aria-label'?: string;
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The label with each query word marked: weight 650, a 1.5 green underline. */
function Marked({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.map(escape).join('|')})`, 'gi'));
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i} className="mu-palette-mark">{p}</mark> : p))}</>;
}

function matches(item: CommandPaletteItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [item.label, ...(item.keywords ?? [])].join(' ').toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}

/** ⌘K: lenses and actions. One field, sections of rows, a footer of keys. */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  onRun,
  query: queryProp,
  onQueryChange,
  defaultQuery = '',
  filter = true,
  placeholder = 'Try “open tasks about the poster”',
  icon,
  status,
  pinnable = true,
  empty = 'Nothing matches',
  'aria-label': ariaLabel = 'Lenses and actions',
}: CommandPaletteProps) {
  const [own, setOwn] = React.useState(defaultQuery);
  const query = queryProp ?? own;
  const setQuery = (q: string) => {
    if (queryProp === undefined) setOwn(q);
    onQueryChange?.(q);
  };
  React.useEffect(() => {
    if (open && queryProp === undefined) setOwn(defaultQuery);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = React.useMemo(() => (filter ? items.filter((it) => matches(it, query)) : items), [items, query, filter]);
  const sections = React.useMemo(() => {
    const out: { name: string; rows: { item: CommandPaletteItem; index: number }[] }[] = [];
    shown.forEach((item, index) => {
      const last = out[out.length - 1];
      if (last && last.name === item.section) last.rows.push({ item, index });
      else out.push({ name: item.section, rows: [{ item, index }] });
    });
    return out;
  }, [shown]);

  const highlighted = React.useRef<CommandPaletteItem | undefined>(undefined);
  const run = (item: CommandPaletteItem | undefined, pin: boolean) => {
    if (!item) return;
    onOpenChange(false);
    onRun(item, { pin });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="mu-palette-scrim" />
        <Dialog.Popup aria-label={ariaLabel} className="mu-palette mu-frost-plate">
          <Combobox.Root
            inline
            open
            items={shown}
            filteredItems={shown}
            itemToStringLabel={(it: CommandPaletteItem) => it.label}
            isItemEqualToValue={(a: CommandPaletteItem, b: CommandPaletteItem) => a.id === b.id}
            highlightItemOnHover
            // The first row is selected from the moment the palette opens, and the selection stays when
            // the pointer leaves (the demo's idx). Root's types narrow these; it forwards them unchanged.
            {...({ autoHighlight: 'always', keepHighlight: true } as object)}
            inputValue={query}
            onInputValueChange={(v) => setQuery(v)}
            value={null}
            onValueChange={(v) => run(v ?? undefined, false)}
            onItemHighlighted={(v) => { highlighted.current = v; }}
          >
            <label className="mu-palette-field">
              {icon && <span aria-hidden className="mu-palette-field-glyph">{icon}</span>}
              <Combobox.Input
                className="mu-palette-input mu-type-content"
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                aria-label={ariaLabel}
                onKeyDown={(e) => {
                  // ⇧↩ runs pinned; Base UI handles plain ↩ through onValueChange.
                  if (e.key === 'Enter' && e.shiftKey && pinnable) {
                    e.preventDefault();
                    e.stopPropagation();
                    run(highlighted.current ?? shown[0], true);
                  }
                }}
              />
              <Kbd size="small" label="Escape closes">⎋</Kbd>
            </label>
            <Combobox.List className="mu-palette-list">
              {sections.map((sec) => (
                <Combobox.Group key={sec.name} className="mu-palette-group">
                  <Combobox.GroupLabel className="mu-palette-sec mu-type-label">
                    <span className="mu-palette-eng">{sec.name}</span>
                    <span className="mu-palette-eng" aria-hidden>{sec.rows.length}</span>
                  </Combobox.GroupLabel>
                  {sec.rows.map(({ item, index }) => (
                    <Combobox.Item key={item.id} value={item} index={index} className="mu-palette-row mu-type-ui mu-icon-trigger" data-danger={item.danger ? '' : undefined}>
                      {item.icon && <span aria-hidden className="mu-palette-row-glyph">{item.icon}</span>}
                      <span className="mu-palette-row-text"><Marked text={item.label} query={query} /></span>
                      {item.hint != null && (
                        <span className="mu-palette-row-hint">
                          {typeof item.hint === 'string' ? <span className="mu-palette-eng mu-type-label">{item.hint}</span> : item.hint}
                        </span>
                      )}
                    </Combobox.Item>
                  ))}
                </Combobox.Group>
              ))}
            </Combobox.List>
            <Combobox.Empty className="mu-palette-empty mu-type-ui">{empty}</Combobox.Empty>
            <div className="mu-palette-foot mu-type-label" aria-hidden>
              <span><Kbd size="small">↑</Kbd><Kbd size="small">↓</Kbd><span className="mu-palette-eng">MOVE</span></span>
              <span><Kbd size="small">↩</Kbd><span className="mu-palette-eng">OPEN</span></span>
              {pinnable && <span><Kbd size="small">⇧↩</Kbd><span className="mu-palette-eng">PIN</span></span>}
              {status && <span className="mu-palette-status mu-palette-eng">{status}</span>}
            </div>
          </Combobox.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
