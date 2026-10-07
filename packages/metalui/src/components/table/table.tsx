'use client';

import * as React from 'react';
import { MorphIcon } from '../../icons/MorphIcon';
import { Checkbox } from '../checkbox/checkbox';
import { useIsoLayoutEffect } from '../../motion/layout-effect';

/* ─────────────────────────────────────────────────────────
 * TABLE, rows of a person's things, read across and compared down
 *
 *   rest      engraved column labels over rows parted by engraved hairlines
 *   hover     a row sinks a touch (the switcher's track look)
 *   sort      a sortable label is a button; its shared arrow morphs on the settle spring, and every row
 *             travels from where it was to where it now belongs on the settle spring
 *   select    the row checkbox; select-all in the head is mixed when some are chosen; chosen rows
 *             carry a quiet green tint
 *   empty     one quiet line says there is nothing
 * Reduce Motion: rows jump to their places; the arrow turns at once.
 * An object: it stands for a person's things. It uses the label, the rule and the checkbox.
 * ───────────────────────────────────────────────────────── */

export interface TableColumn<Row> {
  key: string;
  header: string;
  /** What the cell shows (the row's field by default). */
  cell?: (row: Row) => React.ReactNode;
  /** Makes the column sortable by this value. */
  sortBy?: (row: Row) => string | number;
  align?: 'start' | 'end';
}

export type SortState = { key: string; direction: 'ascending' | 'descending' } | null;

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Names the table: a caption above it (visible) or only for assistive tech (`captionHidden`). */
  caption: string;
  captionHidden?: boolean;
  sort?: SortState;
  defaultSort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** Turns on the checkbox column. */
  selected?: Set<string>;
  /** Names a row's checkbox ("Select Lisbon"); the first column's value by default. */
  rowLabel?: (row: Row) => string;
  onSelectedChange?: (selected: Set<string>) => void;
  /** What to say when there are no rows. */
  empty?: React.ReactNode;
  className?: string;
}

const TABLE = 'mu-table w-full table-reset';
const CAPTION = 'mu-table-caption caption-top text-left pb-table-caption-gap type-title text-ink';
const TH = 'mu-table-th align-middle h-table-head-height px-table-row-pad-x type-label engraved text-left font-normal table-rule data-end:text-right';
const SORT = 'mu-table-sort inline-flex items-center gap-table-sort-gap border-0 bg-transparent p-0 table-sort-button cursor-pointer outline-none focus-visible:focus-ring';
// The authored arrow points north-east; a fixed -45 degree alignment puts its axis on the column.
const ARROW = 'mu-table-arrow size-table-sort-glyph table-sort-arrow -rotate-45';
const TR = 'mu-table-row transition-row pointer-hover:not-data-selected:recipe-switcher data-selected:bg-table-select-tint';
const TD = 'mu-table-td align-middle h-table-row-height px-table-row-pad-x type-ui text-ink table-rule data-end:text-right data-end:tabular-nums';
const EMPTY = 'mu-table-empty h-table-row-height px-table-row-pad-x type-body text-ink3 text-center';
const CHECK = 'mu-table-check w-table-row-height px-table-row-pad-x';

function readMotion(el: Element) {
  const s = getComputedStyle(el);
  const ms = parseFloat(s.getPropertyValue('--mu-spring-settle-d')) * 1000 * (parseFloat(s.getPropertyValue('--mu-travel-settle')) || 0);
  return { ms, easing: s.getPropertyValue('--mu-spring-settle').trim() || 'ease-out' };
}

/** Rows of things, sortable and selectable. */
export function Table<Row>({ columns, rows, rowKey, caption, captionHidden, sort, defaultSort = null, onSortChange, selected, onSelectedChange, rowLabel, empty = 'Nothing here yet.', className }: TableProps<Row>) {
  const [ownSort, setOwnSort] = React.useState<SortState>(defaultSort);
  const current = sort !== undefined ? sort : ownSort;
  const body = React.useRef<HTMLTableSectionElement>(null);
  const tops = React.useRef(new Map<string, number>());

  const sorted = React.useMemo(() => {
    const col = current && columns.find((c) => c.key === current.key);
    if (!col?.sortBy) return rows;
    const by = col.sortBy;
    const dir = current!.direction === 'ascending' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = by(a), y = by(b);
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }, [rows, columns, current]);

  // Each row travels from where it was to where it now is (FLIP), measured inside the table body.
  useIsoLayoutEffect(() => {
    const tb = body.current;
    if (!tb) return;
    const next = new Map<string, number>();
    const { ms, easing } = readMotion(tb);
    tb.querySelectorAll<HTMLTableRowElement>('tr[data-key]').forEach((tr) => {
      const key = tr.dataset.key!;
      const top = tr.offsetTop;
      const was = tops.current.get(key);
      next.set(key, top);
      if (was != null && was !== top && ms > 0) tr.animate([{ transform: `translateY(${was - top}px)` }, { transform: 'none' }], { duration: ms, easing });
    });
    tops.current = next;
  }, [sorted]);

  const toggleSort = (key: string) => {
    const next: SortState = current?.key === key ? { key, direction: current.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' };
    if (sort === undefined) setOwnSort(next);
    onSortChange?.(next);
  };

  const selectable = selected != null;
  const all = rows.length > 0 && selectable && rows.every((r) => selected!.has(rowKey(r)));
  const some = selectable && !all && rows.some((r) => selected!.has(rowKey(r)));
  const setAll = (on: boolean) => onSelectedChange?.(on ? new Set(rows.map(rowKey)) : new Set());
  const setOne = (key: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(key); else next.delete(key);
    onSelectedChange?.(next);
  };

  return (
    <table className={className ? `${TABLE} ${className}` : TABLE}>
      <caption className={captionHidden ? 'sr-only' : CAPTION}>{caption}</caption>
      <thead>
        <tr>
          {selectable && (
            <th scope="col" className={`${TH} ${CHECK}`}>
              <Checkbox size="row" aria-label="Select all" checked={all} mixed={some} onCheckedChange={(on) => setAll(!!on)} />
            </th>
          )}
          {columns.map((c) => {
            const sorted = current?.key === c.key ? current.direction : undefined;
            return (
              <th key={c.key} scope="col" aria-sort={c.sortBy ? sorted ?? 'none' : undefined} data-end={c.align === 'end' ? '' : undefined} className={TH}>
                {c.sortBy ? (
                  <button type="button" className={SORT} onClick={() => toggleSort(c.key)}>
                    {c.header}
                    <MorphIcon name="arrow" turn={sorted === 'descending' ? 180 : 0} className={ARROW} />
                  </button>
                ) : c.header}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody ref={body}>
        {sorted.length === 0 ? (
          <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className={EMPTY}>{empty}</td></tr>
        ) : sorted.map((r) => {
          const key = rowKey(r);
          const on = selectable && selected!.has(key);
          return (
            <tr key={key} data-key={key} data-selected={on ? '' : undefined} aria-selected={selectable ? on : undefined} className={TR}>
              {selectable && (
                <td className={`${TD} ${CHECK}`}>
                  <Checkbox size="row" aria-label={`Select ${rowLabel ? rowLabel(r) : String((r as Record<string, unknown>)[columns[0].key] ?? key)}`} checked={on} onCheckedChange={(v) => setOne(key, !!v)} />
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} data-end={c.align === 'end' ? '' : undefined} className={TD}>
                  {c.cell ? c.cell(r) : String((r as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
