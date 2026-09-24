'use client';

import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Combobox } from '@base-ui/react/combobox';
import { Kbd } from '../kbd/kbd';

/* ─────────────────────────────────────────────────────────
 * COMMAND PALETTE (the reference's openPalette)
 * Base UI Dialog around an inline Combobox (the list is always open inside the plate).
 *   open      rises one nest (y −6, scale .985) on the surface spring over a page scrim at .25;
 *             focus lands in the field with the query already there (initial query)
 *   type      the list refilters at once; the first row is selected again (demo: idx = 0)
 *   ↑ ↓       move the selection; hover moves it too (demo: mousemove sets idx)
 *   ↩         runs the selected row and closes; ⇧↩ runs it pinned (a lens kept as a region)
 *   ⎋ / click outside   close at once, nothing runs
 *   selected  a raised cap with a 2.5 green-deep bar; instant (the list is scanned, not watched)
 * ───────────────────────────────────────────────────────── */

/* Every value is the palette group. The plate rises one nest from its trigger on the surface spring over
 * a page scrim, and closes on release. */
const SCRIM = 'mu-palette-scrim fixed inset-0 palette-scrim transition-opacity duration-surface ease-surface data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-release data-ending-style:ease-release';
const POPUP = 'mu-palette fixed palette-at p-palette-pad rounded-card outline-none material-frost-plate palette-motion data-starting-style:palette-away data-ending-style:palette-away data-ending-style:palette-motion-release';
/* The field: a 44 well in the content role, caret green-deep. */
const FIELD = 'mu-palette-field flex items-center gap-palette-field-gap h-palette-field-height pl-palette-field-pad-start pr-palette-field-pad-end rounded-palette-field-radius material-well cursor-text';
const FIELD_GLYPH = 'mu-palette-field-glyph inline-grid flex-none text-ink3 [&>svg]:size-palette-field-glyph';
const INPUT = 'mu-palette-input flex-1 min-w-0 p-0 border-0 outline-none bg-transparent text-ink caret-green-deep placeholder:text-ink3 type-content';
/* The list: sections of 36 rows; scrolls past 52 % of the window. The selected row's bar sits 2 outside
 * the row: room for it inside the scroll clip. */
const LIST = 'mu-palette-list palette-list-max overflow-auto mx-palette-bar-left pt-palette-list-pad-top px-palette-bar-outset pb-palette-list-pad-bottom scroll-py-palette-list-pad-top scroll-px-0 outline-none empty:hidden';
const ENG = 'mu-palette-eng palette-eng';
const SEC = 'mu-palette-sec flex justify-between pt-palette-sec-pad-top px-palette-row-pad pb-palette-sec-pad-bottom type-label';
/* Selected: a raised cap with a green-deep bar at the left. Instant: the list is scanned, not watched. */
const ROW = 'mu-palette-row group/prow relative flex items-center gap-palette-row-gap h-palette-row-height px-palette-row-pad rounded-row text-ink cursor-pointer outline-none select-none type-ui data-highlighted:palette-row-on data-highlighted:before:palette-row-bar data-danger:text-red data-disabled:opacity-40 data-disabled:cursor-default';
const ROW_GLYPH = 'mu-palette-row-glyph inline-grid flex-none text-ink2 group-data-danger/prow:text-red [&>svg]:size-palette-row-glyph';
const ROW_TEXT = 'mu-palette-row-text min-w-0 overflow-hidden text-ellipsis whitespace-nowrap';
const ROW_HINT = 'mu-palette-row-hint flex flex-none items-center gap-palette-hint-gap ml-auto';
const HINT_TEXT = 'mu-palette-eng palette-eng type-label';
const MARK = 'mu-palette-mark palette-mark';
const EMPTY = 'mu-palette-empty type-ui not-empty:py-palette-empty-pad-y not-empty:px-palette-row-pad not-empty:text-ink3';
/* The footer: keys above an engraved rule. */
const FOOT = 'mu-palette-foot flex items-center gap-palette-foot-gap mt-palette-foot-margin-top pt-palette-foot-pad-top px-palette-row-pad pb-palette-foot-pad-bottom palette-foot-rule type-label';
const FOOT_KEYS = 'flex items-center gap-palette-foot-key-gap';
const STATUS = 'mu-palette-status palette-eng flex items-center gap-palette-foot-key-gap ml-auto';

export interface CommandPaletteItem {
  /** Unique within the palette. */
  id: string;
  /** What the row says. Matches of the query are marked in it. */
  label: string;
  /** The section heading this row sits under: LENS, LENSES, BLOCKS, ACTIONS. Rows of one section must be adjacent. */
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
  /** Right of the footer keys: where answers come from, e.g. "NATURAL LANGUAGE". */
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
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i} className={MARK}>{p}</mark> : p))}</>;
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
        <Dialog.Backdrop className={SCRIM} />
        <Dialog.Popup aria-label={ariaLabel} className={POPUP}>
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
            <label className={FIELD}>
              {icon && <span aria-hidden className={FIELD_GLYPH}>{icon}</span>}
              <Combobox.Input
                className={INPUT}
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
            <Combobox.List className={LIST}>
              {sections.map((sec) => (
                <Combobox.Group key={sec.name} className="mu-palette-group">
                  <Combobox.GroupLabel className={SEC}>
                    <span className={ENG}>{sec.name}</span>
                    <span className={ENG} aria-hidden>{sec.rows.length}</span>
                  </Combobox.GroupLabel>
                  {sec.rows.map(({ item, index }) => (
                    <Combobox.Item key={item.id} value={item} index={index} className={`${ROW} mu-icon-trigger`} data-danger={item.danger ? '' : undefined}>
                      {item.icon && <span aria-hidden className={ROW_GLYPH}>{item.icon}</span>}
                      <span className={ROW_TEXT}><Marked text={item.label} query={query} /></span>
                      {item.hint != null && (
                        <span className={ROW_HINT}>
                          {typeof item.hint === 'string' ? <span className={HINT_TEXT}>{item.hint}</span> : item.hint}
                        </span>
                      )}
                    </Combobox.Item>
                  ))}
                </Combobox.Group>
              ))}
            </Combobox.List>
            <Combobox.Empty className={EMPTY}>{empty}</Combobox.Empty>
            <div className={FOOT} aria-hidden>
              <span className={FOOT_KEYS}><Kbd size="small">↑</Kbd><Kbd size="small">↓</Kbd><span className={ENG}>MOVE</span></span>
              <span className={FOOT_KEYS}><Kbd size="small">↩</Kbd><span className={ENG}>OPEN</span></span>
              {pinnable && <span className={FOOT_KEYS}><Kbd size="small">⇧↩</Kbd><span className={ENG}>PIN</span></span>}
              {status && <span className={STATUS}>{status}</span>}
            </div>
          </Combobox.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
