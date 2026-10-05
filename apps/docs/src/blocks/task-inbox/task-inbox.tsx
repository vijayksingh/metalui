'use client';

import * as React from 'react';
import { motionReduced as reduced } from '@unlocalhosted/metalui';
import {
  AlertDialog, Avatar, Button, Checkbox, Chip, EmptyState, Field, IconButton, Kbd, Menu, MenuItem, Row, Rule, Surface,
  SwapText, Switcher, ToolStrip, useToast,
} from '@unlocalhosted/metalui';
import { Icon, MorphIcon } from '@unlocalhosted/metalui/icons';

/* ─────────────────────────────────────────────────────────
 * TASK INBOX · a team's tasks: find one, finish it, act on several at once
 *
 *   rest      a raised slab: "Inbox" and its count; a search well and a switch (All · Mine ·
 *             Due soon · Done); the tasks as rows: a selection box in the gutter (it shows on
 *             hover, on focus and while anything is selected), the completion box, the title,
 *             its tag, when it's due (late in the invalid ink, in words) and who has it; a footer
 *             of keys under the list
 *
 *   search    typing filters at once; the count turns on the drum; rows that stay travel to their
 *             new place (settle spring); rows that go are gone at once (typing never waits)
 *   view      the switch's thumb glides (part spring); the rows follow as for search
 *
 *   complete  a row's completion box (or e)
 *      0 ms   the pen draws the tick (the checkbox's own act, at rest by ~760 ms); the title
 *             strikes through in ink3; a toast says so, with Undo
 *    900 ms   the beat: the row steps one nest down and fades (release spring); the rows under it
 *             travel up to close the gap (settle spring). In Done, un-ticking settles it back out.
 *
 *   select    the gutter box, x, Space, ⌘-click or ⇧-click (a range): the row takes the lifted plate
 *      0 ms   the first one: the tool strip rises one nest over the footer on the object spring;
 *             its count turns on the drum as more are picked
 *   clear     ⎋ or the strip's ×: the strip sinks one nest and fades (release spring)
 *
 *   act       Complete · Assign ▾ · Snooze ▾ · Delete, on every selected task
 *      0 ms   the change is made; a toast says what, with Undo (⌘Z too)
 *    900 ms   rows that no longer belong in the view settle out, as above
 *   delete    asks first (an alert dialog); yes: the rows leave at once on release, then close up
 *   undo      the tasks come back: rows that had gone land one nest from above (object spring)
 *
 *   open      ↩ or a click on a row: a green rail marks it (the sample opens nothing)
 *   empty     a view with nothing rises as an empty state (settle, its own); every task done is
 *             "Inbox zero", and the check glyph plays its act once
 *
 * Reduce Motion: everything changes at once; the tick is whole; nothing lands, leaves or travels;
 * the drum crossfades. The beat before a finished row goes stays: it is a pause, not a motion.
 * Layout follows the block's own width (a container): under 32rem a row's tag and due date go
 * under its title, and the strip's verbs keep only their glyphs.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  beat:     900, // ms a finished (or snoozed, reassigned) row stays before it settles out of the view
  announce: 450, // ms of quiet typing before the count is said
};

/* ── Data ──────────────────────────────────────────────────── */

type View = 'all' | 'mine' | 'soon' | 'done';
const VIEWS: { value: View; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'soon', label: 'Due soon' },
  { value: 'done', label: 'Done' },
];

interface Person { id: string; name: string }
const PEOPLE: Person[] = [
  { id: 'marta', name: 'Marta Silva' },
  { id: 'joao', name: 'João Pereira' },
  { id: 'ana', name: 'Ana Rocha' },
  { id: 'lena', name: 'Lena Fischer' },
];
const ME = 'marta';
const person = (id: string) => PEOPLE.find((p) => p.id === id) ?? PEOPLE[0];

export interface Task { id: string; title: string; assignee: string; due: number; tag: string; done: boolean }

/** The sample's today. Use `new Date()` in a real inbox. */
const TODAY = new Date(2026, 8, 30);
const DAY = 86_400_000;
/** Due dates are whole days from today: −2 is two days late. */
const TASKS: Task[] = [
  { id: 't1', title: 'Review the onboarding copy', assignee: 'marta', due: -2, tag: 'Docs', done: false },
  { id: 't2', title: 'Reply to the Lisbon venue about catering', assignee: 'marta', due: -1, tag: 'Ops', done: false },
  { id: 't3', title: 'Fix the cropped invoice PDF', assignee: 'joao', due: 0, tag: 'Bug', done: false },
  { id: 't4', title: 'Draft the Q4 roadmap notes', assignee: 'marta', due: 1, tag: 'Planning', done: false },
  { id: 't5', title: 'Swap the hero photo on pricing', assignee: 'ana', due: 2, tag: 'Design', done: false },
  { id: 't6', title: 'Update the SwiftUI package docs', assignee: 'lena', due: 6, tag: 'Docs', done: false },
  { id: 't7', title: 'Audit colour contrast in graphite', assignee: 'ana', due: 9, tag: 'Design', done: false },
  { id: 't8', title: 'Plan the team offsite', assignee: 'joao', due: 14, tag: 'Ops', done: false },
  { id: 't9', title: 'Ship the share panel', assignee: 'marta', due: -3, tag: 'Eng', done: true },
  { id: 't10', title: 'Book the photographer', assignee: 'ana', due: -1, tag: 'Ops', done: true },
];

const SOON = 2; // days: due soon is late, today, tomorrow or the day after

const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' });
const monthDay = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
const dateOf = (days: number) => new Date(TODAY.getTime() + days * DAY);

/** When it's due, in words: late ones say how late. */
function dueOf(days: number) {
  if (days < 0) return { words: `${plural(-days, 'day', 'days')} late`, late: true };
  if (days === 0) return { words: 'Today', late: false };
  if (days === 1) return { words: 'Tomorrow', late: false };
  if (days < 7) return { words: weekday.format(dateOf(days)), late: false };
  return { words: monthDay.format(dateOf(days)), late: false };
}

/** Next Monday, in days from today. */
const NEXT_WEEK = ((8 - TODAY.getDay()) % 7) || 7;

function inView(t: Task, view: View) {
  if (view === 'done') return t.done;
  if (t.done) return false;
  if (view === 'mine') return t.assignee === ME;
  if (view === 'soon') return t.due <= SOON;
  return true;
}
function matches(t: Task, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [t.title, t.tag, person(t.assignee).name].some((s) => s.toLowerCase().includes(q));
}
const byDue = (a: Task, b: Task) => a.due - b.due;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const short = (s: string, n = 32) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/* ── Motion helpers ────────────────────────────────────────── */



/** A spring's duration (ms, zero under Reduce Motion) and curve, read from the element's own tokens. */
function spring(el: Element, name: 'settle' | 'object' | 'release') {
  const s = getComputedStyle(el);
  const ms = reduced(el) ? 0 : parseFloat(s.getPropertyValue(`--mu-spring-${name}-d`)) * 1000 * (parseFloat(s.getPropertyValue(`--mu-travel-${name}`)) || 0);
  return { ms, easing: s.getPropertyValue(`--mu-spring-${name}`).trim() || 'ease-out' };
}
const nestOf = (el: Element) => parseFloat(getComputedStyle(el).getPropertyValue('--mu-motion-nest')) || 6;

/**
 * Rows in one list: a row in `landing` lands from one nest above on the object spring; rows that
 * moved travel from where they were (FLIP, settle spring). Any other new row simply appears.
 */
function useRows(list: React.RefObject<HTMLElement | null>, order: string, landing: React.RefObject<Set<string>>) {
  const tops = React.useRef<Map<string, number> | null>(null);
  React.useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const glide = spring(el, 'settle');
    const drop = spring(el, 'object');
    const nest = nestOf(el);
    const next = new Map<string, number>();
    el.querySelectorAll<HTMLElement>(':scope > [data-row]').forEach((row) => {
      const key = row.dataset.row!;
      next.set(key, row.offsetTop);
      if (!tops.current) return;
      const was = tops.current.get(key);
      if (was == null) {
        if (landing.current.has(key) && drop.ms > 0) row.animate([{ opacity: 0, transform: `translateY(${-nest}px)` }, { opacity: 1, transform: 'none' }], { duration: drop.ms, easing: drop.easing });
      } else if (was !== row.offsetTop && glide.ms > 0) {
        row.animate([{ transform: `translateY(${was - row.offsetTop}px)` }, { transform: 'none' }], { duration: glide.ms, easing: glide.easing, composite: 'add' });
      }
    });
    landing.current.clear();
    tops.current = next;
  }, [list, order, landing]);
}

/** Elements leave one nest down, fading, on the release spring; then `done`. At once under Reduce Motion. */
function leave(els: HTMLElement[], done: () => void) {
  const live = els.filter(Boolean);
  const { ms, easing } = live[0] ? spring(live[0], 'release') : { ms: 0, easing: '' };
  if (!ms) return done();
  const nest = nestOf(live[0]);
  Promise.all(live.map((el) => {
    el.style.pointerEvents = 'none';
    return el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${nest}px)` }], { duration: ms, easing, fill: 'forwards' }).finished;
  })).then(done, done);
}

/** An element arrives from one nest below on the object spring (the tool strip over its footer). */
function rise(el: HTMLElement | null) {
  if (!el) return;
  const { ms, easing } = spring(el, 'object');
  if (ms) el.animate([{ opacity: 0, transform: `translateY(${nestOf(el)}px)` }, { opacity: 1, transform: 'none' }], { duration: ms, easing });
}

/** Which inbox on the page made the last change: it alone answers a ⌘Z from the page. */
const lastActor = { current: '' };

/* ── Parts ─────────────────────────────────────────────────── */

const X = <svg aria-hidden viewBox="0 0 10 10" className="size-attachment-remove-glyph" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" /></svg>;

// The row: gutter (selection), completion, then one cell with everything a person reads. Narrow, the
// tag and due date go under the title; from 32rem they take their own columns.
const ROW = 'grid grid-cols-[1.25rem_1.25rem_minmax(0,1fr)] items-start gap-x-10 cursor-default';
const CELL = 'grid min-h-[1.375rem] items-center';
const MAIN = 'grid min-w-0 -mx-6 px-6 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-12 gap-y-4 rounded-row-list-radius outline-none focus-visible:focus-ring @lg/block:grid-cols-[minmax(0,1fr)_auto_6.5rem_auto]';
// The gutter's box shows on hover, on focus, while anything is selected, and always on a touch screen.
const GUTTER = `${CELL} opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-aria-selected/row:opacity-100 group-data-selecting/grid:opacity-100 pointer-coarse:opacity-100`;

// A key on the graphite strip: the strip cap's look; the verb hides under 32rem, the glyph stays.
const STRIP_GLYPH = 'size-16';
// The icon set has no person glyph yet: a head and shoulders, drawn to the set's 24 grid and stroke.
const PERSON = <svg aria-hidden viewBox="0 0 24 24" className={STRIP_GLYPH} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><circle cx="12" cy="8.6" r="3.6" /><path d="M5.2 19.4c.9-3.3 3.6-5.2 6.8-5.2s5.9 1.9 6.8 5.2" /></svg>;

/* ── The block ─────────────────────────────────────────────── */

export interface TaskInboxProps {
  /** Tasks to start with (the sample by default). */
  tasks?: Task[];
  className?: string;
}

/** A team's inbox of tasks: search and views, complete with a tick, select several and act on them, with Undo. */
export function TaskInbox({ tasks: initial = TASKS, className }: TaskInboxProps) {
  const ids = React.useId();
  const toast = useToast();
  const root = React.useRef<HTMLElement>(null);
  const grid = React.useRef<HTMLDivElement>(null);
  const search = React.useRef<HTMLInputElement>(null);
  const strip = React.useRef<HTMLDivElement>(null);
  const landing = React.useRef(new Set<string>());
  const anchor = React.useRef<string | null>(null);
  const undos = React.useRef<{ run: () => void; toast: string }[]>([]);
  const timers = React.useRef<number[]>([]);
  const afterDelete = React.useRef<string | null>(null);

  const [tasks, setTasks] = React.useState<Task[]>(initial);
  const [view, setView] = React.useState<View>('all');
  const [query, setQuery] = React.useState('');
  const [linger, setLinger] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [active, setActive] = React.useState<{ id: string | null; col: number }>({ id: null, col: 2 });
  const [opened, setOpened] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<string[] | null>(null);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [snoozeOpen, setSnoozeOpen] = React.useState(false);
  const [status, setStatus] = React.useState('');

  // The latest state, for timers that fire after a beat.
  const latest = React.useRef({ tasks, view, query });
  latest.current = { tasks, view, query };
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const counted = tasks.filter((t) => inView(t, view) && matches(t, query));
  const visible = tasks.filter((t) => (inView(t, view) && matches(t, query)) || linger.includes(t.id)).sort(byDue);
  const order = visible.map((t) => t.id);
  const activeId = active.id && order.includes(active.id) ? active.id : order[0] ?? null;
  const allDone = tasks.length > 0 && tasks.every((t) => t.done);

  useRows(grid, order.join('|'), landing);

  /* The count, said once typing pauses. */
  const said = `${plural(counted.length, 'task', 'tasks')}${query.trim() ? ` matching “${query.trim()}”` : ''}`;
  React.useEffect(() => {
    if (root.current?.closest('[inert]')) return;
    const t = window.setTimeout(() => setStatus(said), TIMING.announce);
    return () => window.clearTimeout(t);
  }, [said]);

  /* A new view or search starts clean: nothing lingers. */
  React.useEffect(() => { setLinger([]); }, [view, query]);

  /* Selection never holds a task the view no longer shows. */
  React.useEffect(() => {
    setSelected((s) => (s.every((id) => order.includes(id)) ? s : s.filter((id) => order.includes(id))));
  }, [order.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  /* The strip: it rises with the first selection and sinks when the last one goes. */
  const [stripUp, setStripUp] = React.useState(false);
  const shown = React.useRef(0);
  if (selected.length) shown.current = selected.length;
  const any = selected.length > 0;
  React.useLayoutEffect(() => {
    if (any) { if (!stripUp) setStripUp(true); return; }
    if (stripUp) leave([strip.current!], () => setStripUp(false));
  }, [any]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useLayoutEffect(() => { if (stripUp && any) rise(strip.current); }, [stripUp]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Focus ───────────────────────────────────────────────── */

  const cellOf = (id: string, col: number) => grid.current?.querySelector<HTMLElement>(`[data-row="${id}"] [data-col="${col}"]`);
  const focusCell = (id: string | null, col = active.col) => {
    if (!id) return;
    setActive({ id, col });
    requestAnimationFrame(() => cellOf(id, col)?.focus());
  };
  /** Before rows go: if focus is in one of them, it moves to the nearest row that stays. */
  const handOff = (going: string[]) => {
    const inside = going.some((id) => grid.current?.querySelector(`[data-row="${id}"]`)?.contains(document.activeElement));
    const at = order.indexOf(activeId ?? '');
    const stays = order.filter((id) => !going.includes(id));
    const next = order.slice(at + 1).find((id) => !going.includes(id)) ?? [...order.slice(0, at)].reverse().find((id) => !going.includes(id)) ?? null;
    if (going.includes(activeId ?? '')) setActive((a) => ({ ...a, id: next }));
    if (inside) {
      if (next) cellOf(next, active.col)?.focus();
      else if (!stays.length) search.current?.focus();
    }
    return next;
  };

  /* ── Changes, each with an undo that puts the tasks back as they were ─── */

  /** Rows the change took out of the view stay a beat, then settle out. */
  const settleOut = (changed: string[]) => {
    setLinger((l) => [...new Set([...l, ...changed])]);
    const t = window.setTimeout(() => {
      const { tasks: now, view: v, query: q } = latest.current;
      const going = changed.filter((id) => { const t = now.find((x) => x.id === id); return t && !(inView(t, v) && matches(t, q)); });
      handOff(going);
      const rows = going.map((id) => grid.current?.querySelector<HTMLElement>(`[data-row="${id}"]`)).filter(Boolean) as HTMLElement[];
      leave(rows, () => setLinger((l) => l.filter((id) => !changed.includes(id))));
    }, TIMING.beat);
    timers.current.push(t);
  };

  const commit = (changed: string[], update: (t: Task) => Task | null, say: { title: string; sub?: string }) => {
    const before = tasks.map((t, i) => ({ t, i })).filter(({ t }) => changed.includes(t.id));
    setTasks((all) => all.flatMap((t) => (changed.includes(t.id) ? (update(t) ?? []) : [t])));
    const undo = () => {
      const { tasks: now, view: v, query: q } = latest.current;
      // Rows that had left the view land as they come back; the rest change in place.
      before.forEach(({ t }) => {
        const was = now.find((x) => x.id === t.id);
        if (!was || !(inView(was, v) && matches(was, q))) landing.current.add(t.id);
      });
      setTasks((all) => {
        const next = all.filter((t) => !changed.includes(t.id));
        before.forEach(({ t, i }) => next.splice(Math.min(i, next.length), 0, t));
        return next;
      });
      setLinger((l) => l.filter((id) => !changed.includes(id)));
      undos.current = undos.current.filter((u) => u.run !== undo);
      setStatus(`Undone: ${say.title}${say.sub ? `, ${say.sub}` : ''}`);
    };
    lastActor.current = ids;
    const id = toast.show({ ...say, undo });
    undos.current.push({ run: undo, toast: id });
  };

  const complete = (list: string[], done: boolean) => {
    const one = tasks.find((t) => t.id === list[0]);
    commit(list, (t) => ({ ...t, done }), list.length === 1
      ? { title: done ? 'Completed' : 'Reopened', sub: short(one?.title ?? '') }
      : { title: `${done ? 'Completed' : 'Reopened'} ${plural(list.length, 'task', 'tasks')}` });
    settleOut(list);
  };

  const assign = (list: string[], to: string) => {
    const name = to === ME ? 'you' : person(to).name;
    commit(list, (t) => ({ ...t, assignee: to }), { title: `Assigned ${list.length === 1 ? short(tasks.find((t) => t.id === list[0])?.title ?? '', 24) : plural(list.length, 'task', 'tasks')}`, sub: `to ${name}` });
    settleOut(list);
  };

  const snooze = (list: string[], days: number, words: string) => {
    commit(list, (t) => ({ ...t, due: days }), { title: `Snoozed ${plural(list.length, 'task', 'tasks')}`, sub: `until ${words}` });
    setSelected([]);
    settleOut(list);
    focusCell(activeId);
  };

  const remove = (list: string[]) => {
    const rows = list.map((id) => grid.current?.querySelector<HTMLElement>(`[data-row="${id}"]`)).filter(Boolean) as HTMLElement[];
    setSelected([]);
    afterDelete.current = handOff(list);
    const say = list.length === 1 ? { title: 'Deleted', sub: short(tasks.find((t) => t.id === list[0])?.title ?? '') } : { title: `Deleted ${plural(list.length, 'task', 'tasks')}` };
    leave(rows, () => commit(list, () => null, say));
  };

  /* ── Selection ───────────────────────────────────────────── */

  const toggleSelect = (id: string, on?: boolean) => {
    anchor.current = id;
    setSelected((s) => {
      const has = s.includes(id);
      const want = on ?? !has;
      return want === has ? s : want ? [...s, id] : s.filter((x) => x !== id);
    });
  };
  const selectRange = (to: string) => {
    const from = anchor.current && order.includes(anchor.current) ? anchor.current : to;
    const [a, b] = [order.indexOf(from), order.indexOf(to)].sort((x, y) => x - y);
    setSelected((s) => [...new Set([...s, ...order.slice(a, b + 1)])]);
  };
  const clearSelection = () => { setSelected([]); anchor.current = null; };

  React.useEffect(() => {
    if (!any) return;
    setStatus(`${plural(selected.length, 'task', 'tasks')} selected`);
  }, [selected.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Acting on the selection, or on the focused row when nothing is selected. */
  const targets = () => (selected.length ? order.filter((id) => selected.includes(id)) : activeId ? [activeId] : []);
  const completeTargets = () => {
    const list = targets();
    if (!list.length) return;
    const done = !list.every((id) => tasks.find((t) => t.id === id)?.done);
    setSelected([]);
    complete(list, done);
  };

  const openConfirm = () => {
    const list = targets();
    if (!list.length) return;
    afterDelete.current = null;
    setConfirm(list);
  };

  const open = (id: string) => {
    setOpened(id);
    setStatus(`Opened ${tasks.find((t) => t.id === id)?.title ?? ''}`);
  };

  /* ── Keys ────────────────────────────────────────────────── */

  const onGridKey = (e: React.KeyboardEvent) => {
    const at = order.indexOf(activeId ?? '');
    if (at < 0) return;
    const move = (to: number, extend = false) => {
      const id = order[Math.max(0, Math.min(order.length - 1, to))];
      if (extend) { if (!anchor.current) anchor.current = activeId; selectRange(id); }
      focusCell(id);
    };
    const mod = e.metaKey || e.ctrlKey;
    const onControl = !!(e.target as HTMLElement).closest('button,input,[role=checkbox]');
    switch (e.key) {
      case 'ArrowDown': move(at + 1, e.shiftKey); break;
      case 'ArrowUp': move(at - 1, e.shiftKey); break;
      case 'Home': move(0); break;
      case 'End': move(order.length - 1); break;
      case 'ArrowLeft': focusCell(activeId, Math.max(0, active.col - 1)); break;
      case 'ArrowRight': focusCell(activeId, Math.min(2, active.col + 1)); break;
      case 'x': if (mod) return; toggleSelect(activeId!); break;
      case ' ': if (onControl) return; toggleSelect(activeId!); break;
      case 'e': if (mod) return; completeTargets(); break;
      case 'Enter': if (onControl) return; open(activeId!); break;
      case 'Delete': case 'Backspace': openConfirm(); break;
      case 'a': if (!mod) return; setSelected(order); break;
      default: return;
    }
    e.preventDefault();
  };

  const onRootKey = (e: React.KeyboardEvent) => {
    // Only keys from inside the block's own DOM: a menu's or dialog's keys reach here through
    // React (they are portalled) and must not clear the selection.
    if (!root.current?.contains(e.target as Node)) return;
    const typing = (e.target as HTMLElement).tagName === 'INPUT';
    if (e.key === 'Escape') {
      if (typing && query) { setQuery(''); e.preventDefault(); return; }
      if (selected.length) { clearSelection(); focusCell(activeId); e.preventDefault(); }
      return;
    }
    if (typing) {
      if (e.key === 'ArrowDown' && order.length) { e.preventDefault(); focusCell(activeId, 2); }
      return;
    }
    if (e.key === '/') { e.preventDefault(); search.current?.focus(); return; }
  };

  /* ⌘Z undoes this inbox's last change: from inside it, or from nowhere in particular (focus on the
     page), as long as this inbox made the page's last change. A text field keeps its own ⌘Z. */
  const undoLast = React.useRef<() => boolean>(() => false);
  undoLast.current = () => {
    const last = undos.current.at(-1);
    if (!last) return false;
    toast.dismiss(last.toast);
    last.run();
    return true;
  };
  React.useEffect(() => {
    if (root.current?.closest('[inert]')) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' || e.shiftKey || lastActor.current !== ids) return;
      const t = e.target as HTMLElement;
      if (t.closest('input,textarea,[contenteditable=""],[contenteditable="true"]')) return;
      if (t !== document.body && !root.current?.contains(t)) return;
      if (undoLast.current()) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ids]);

  /* A click on the row itself (not a box) opens it; ⌘ adds or takes it away; ⇧ picks a range. */
  const onRowClick = (e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).closest('button,input,a,[role=checkbox]')) return;
    if (e.metaKey || e.ctrlKey) { toggleSelect(id); focusCell(id, 2); return; }
    if (e.shiftKey) { e.preventDefault(); selectRange(id); focusCell(id, 2); return; }
    focusCell(id, 2);
    open(id);
  };

  /* ── Empty ───────────────────────────────────────────────── */

  const zero = allDone && view === 'all' && !query.trim() && visible.length === 0;

  const empty = (() => {
    if (visible.length) return null;
    if (query.trim()) {
      return <EmptyState icon={<Icon name="search" />} title={`No tasks match “${short(query.trim(), 24)}”`} description="Try a title, a tag or a person’s name." action={<Button onClick={() => { setQuery(''); search.current?.focus(); }}>Clear search</Button>} />;
    }
    if (zero) {
      return <EmptyState icon={<Icon name="check" act={zero ? 1 : 0} />} title="Inbox zero" description="Every task is done. Enjoy the quiet." action={<Button onClick={() => setView('done')}>See what’s done</Button>} />;
    }
    const words: Record<View, [string, string]> = {
      all: ['Nothing open', 'New tasks for the team land here.'],
      mine: ['Nothing on your plate', 'Tasks assigned to you land here.'],
      soon: ['Nothing due soon', 'Nothing is late or due in the next two days.'],
      done: ['Nothing done yet', 'Tick a task and it settles here.'],
    };
    return <EmptyState icon={<Icon name={view === 'soon' ? 'clock' : 'task'} />} title={words[view][0]} description={words[view][1]} />;
  })();

  /* ── Render ──────────────────────────────────────────────── */

  const count = counted.length;
  const stripCount = selected.length || shown.current;

  return (
    <section
      ref={root}
      aria-labelledby={`${ids}-title`}
      onKeyDown={onRootKey}
      className={`block-task-inbox @container/block grid w-full max-w-[44rem] gap-16 p-20 rounded-surface-radius-hero recipe-surface-raise max-[30rem]:p-12 ${className ?? ''}`}
    >
      <header className="grid gap-12">
        <div className="flex items-baseline gap-8">
          <h2 id={`${ids}-title`} className="m-0 type-display text-ink">Inbox</h2>
          <span aria-hidden className="type-title tabular-nums text-ink3"><SwapText value={String(count)} /></span>
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <div role="search" className="min-w-[12rem] flex-1">
            <Field size="regular">
              <Field.Icon><Icon name="search" /></Field.Icon>
              <Field.Input
                ref={search}
                type="search"
                aria-label="Search tasks"
                aria-keyshortcuts="/"
                placeholder="Search tasks"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="[&::-webkit-search-cancel-button]:appearance-none"
              />
              <Field.Trail>
                {query
                  ? <IconButton variant="mini" label="Clear search" icon={X} onClick={() => { setQuery(''); search.current?.focus(); }} />
                  : <Kbd size="small" className="pointer-coarse:hidden">/</Kbd>}
              </Field.Trail>
            </Field>
          </div>
          <Switcher size="compact" aria-label="Show" options={VIEWS} value={view} onValueChange={(v) => { setView(v); clearSelection(); }} />
        </div>
      </header>

      <div
        ref={grid}
        role="grid"
        aria-label="Tasks"
        aria-multiselectable="true"
        aria-rowcount={visible.length}
        data-selecting={any ? '' : undefined}
        onKeyDown={onGridKey}
        className="group/grid relative -mx-8 grid gap-2 empty:hidden max-[30rem]:mx-0"
      >
        {visible.map((t, i) => {
          const due = dueOf(t.due);
          const who = person(t.assignee);
          const isSelected = selected.includes(t.id);
          const stop = (col: number) => (t.id === activeId && active.col === col ? 0 : -1);
          return (
            <Row.Root
              key={t.id}
              as="div"
              variant="panel"
              role="row"
              aria-rowindex={i + 1}
              selected={isSelected}
              opened={opened === t.id}
              data-row={t.id}
              onClick={(e) => onRowClick(e, t.id)}
              onMouseDown={(e) => { if (e.shiftKey) e.preventDefault(); }}
              className={ROW}
            >
              <span role="gridcell" className={GUTTER}>
                <Checkbox
                  size="row"
                  data-col={0}
                  tabIndex={stop(0)}
                  aria-label={`Select ${t.title}`}
                  checked={isSelected}
                  onCheckedChange={(on) => { toggleSelect(t.id, on); setActive({ id: t.id, col: 0 }); }}
                  onClick={(e) => { if (e.shiftKey) { e.preventDefault(); selectRange(t.id); } }}
                />
              </span>
              <span role="gridcell" className={CELL}>
                <IconButton
                  variant="mini"
                  data-col={1}
                  tabIndex={stop(1)}
                  label={`Complete ${t.title}`}
                  pressed={t.done}
                  accept
                  icon={<MorphIcon name={t.done ? 'check' : 'task'} size={14} />}
                  className="aria-pressed:text-success"
                  onClick={() => { setActive({ id: t.id, col: 1 }); complete([t.id], !t.done); }}
                />
              </span>
              <span role="gridcell" data-col={2} tabIndex={stop(2)} onFocus={() => setActive({ id: t.id, col: 2 })} className={MAIN}>
                <span className={`col-start-1 row-start-1 line-clamp-2 type-ui transition-colors @lg/block:block @lg/block:truncate ${t.done ? 'text-ink3 line-through' : 'text-ink'}`}>{t.title}</span>
                <span className="col-start-1 row-start-2 flex min-w-0 items-center gap-8 @lg/block:contents">
                  <span className={`type-meta tabular-nums @lg/block:col-start-3 @lg/block:row-start-1 @lg/block:text-right ${due.late && !t.done ? 'text-form-field-error-ink' : due.words === 'Today' && !t.done ? 'text-ink' : 'text-ink3'}`}>
                    {due.late && !t.done ? due.words : <><span className="sr-only">Due </span>{due.words}</>}
                  </span>
                  <Chip variant="tag" className="@lg/block:col-start-2 @lg/block:row-start-1 @lg/block:justify-self-end"><Chip.Text>{t.tag}</Chip.Text></Chip>
                </span>
                <span title={who.id === ME ? `${who.name} (you)` : who.name} className="col-start-2 row-span-2 row-start-1 self-center @lg/block:col-start-4 @lg/block:row-span-1">
                  <Avatar name={who.name} size="small" />
                </span>
              </span>
            </Row.Root>
          );
        })}
      </div>
      {empty}

      {/* The foot: the keys at rest; the tool strip over them while anything is selected. It stays in
          view at the bottom of the screen as the list scrolls. */}
      <div className="sticky bottom-12 z-1 grid min-h-toolstrip-button-height place-items-center">
        {stripUp ? (
          <div ref={strip} className="col-start-1 row-start-1">
            <ToolStrip label={plural(stripCount, 'selected task', 'selected tasks')} count={stripCount} items={[
              { label: 'Complete', icon: <Icon name="check" />, shortcut: 'E', onSelect: completeTargets },
              { label: 'Assign', icon: PERSON, menuOpen: assignOpen, onMenuOpenChange: setAssignOpen, menu: PEOPLE.map((p) => <MenuItem key={p.id} onSelect={() => assign(targets(), p.id)}>{p.id === ME ? `${p.name} (you)` : p.name}</MenuItem>) },
              { label: 'Snooze', icon: <Icon name="clock" />, menuOpen: snoozeOpen, onMenuOpenChange: setSnoozeOpen, menu: <><MenuItem onSelect={() => snooze(targets(), 1, 'tomorrow')}>Tomorrow</MenuItem><MenuItem onSelect={() => snooze(targets(), NEXT_WEEK, `${weekday.format(dateOf(NEXT_WEEK))} ${monthDay.format(dateOf(NEXT_WEEK))}`)}>Next week</MenuItem></> },
              { label: 'Clear selection', icon: <Icon name="close" />, shortcut: 'Escape', onSelect: () => { clearSelection(); focusCell(activeId); } },
              { label: 'Delete', icon: <Icon name="trash" />, destructive: true, shortcut: 'Delete', onSelect: () => openConfirm() },
            ]} />
          </div>
        ) : visible.length > 0 && (
          <p aria-hidden className="col-start-1 row-start-1 m-0 hidden flex-wrap items-center justify-center gap-x-12 gap-y-4 type-meta text-ink3 @md/block:flex pointer-coarse:hidden">
            <span><Kbd size="small">↑</Kbd> <Kbd size="small">↓</Kbd> move</span>
            <span><Kbd size="small">x</Kbd> select</span>
            <span><Kbd size="small">e</Kbd> complete</span>
            <span><Kbd size="small">↩</Kbd> open</span>
            <span><Kbd size="small">/</Kbd> search</span>
          </p>
        )}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        {/* Focus goes to the row after the deleted ones, not to the strip that is leaving. Popup
            passes finalFocus through to Base UI, but its props don't type it. */}
        <AlertDialog.Popup {...({ finalFocus: () => (afterDelete.current ? cellOf(afterDelete.current, 2) ?? search.current : true) } as object)}>
          <AlertDialog.Title>{confirm?.length === 1 ? `Delete “${short(tasks.find((t) => t.id === confirm[0])?.title ?? '', 40)}”?` : `Delete ${plural(confirm?.length ?? 0, 'task', 'tasks')}?`}</AlertDialog.Title>
          <AlertDialog.Description>{confirm?.length === 1 ? 'It leaves' : 'They leave'} the inbox for everyone on the team. You can undo it for a few seconds.</AlertDialog.Description>
          <AlertDialog.Actions>
            <AlertDialog.Cancel />
            <AlertDialog.Confirm onClick={() => { const list = confirm ?? []; setConfirm(null); remove(list); }}>Delete</AlertDialog.Confirm>
          </AlertDialog.Actions>
        </AlertDialog.Popup>
      </AlertDialog>

      <p role="status" className="sr-only">{status}</p>
    </section>
  );
}
