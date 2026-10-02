'use client';

import * as React from 'react';
import { Toolbar } from '@base-ui/react/toolbar';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { Surface } from '../../components/surface/surface';
import { Button, buttonClasses } from '../../components/button/button';
import { Label } from '../../components/label/label';
import { SwapText } from '../../motion/swap';
import { Rule } from '../../components/rule/rule';
import { Tooltip, TooltipProvider } from '../../components/tooltip/tooltip';
import { Menu, MenuItem, menuParts } from '../../components/menu/menu';
import { MoreIcon } from '../../icons/components.generated';
import { useReducedMotion } from '../../motion/reduced';

const STRIP = 'mu-toolstrip relative inline-flex items-center gap-toolstrip-gap p-toolstrip-pad animate-toolstrip-in [&>.mu-rule]:h-toolstrip-sep-height';
const KEY = 'mu-toolstrip-button relative z-1 [&>svg]:size-button-compact-glyph has-[svg]:w-button-strip-height has-[svg]:px-0';
const isElement = (value: unknown): value is Element => typeof Element !== 'undefined' && value instanceof Element;
const identity = (item: ToolStripItem) => item.id ?? item.label;
const durationMs = (css: CSSStyleDeclaration, name: string) => { const value = css.getPropertyValue(name).trim(); return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000); };
const cssNumber = (css: CSSStyleDeclaration, name: string) => parseFloat(css.getPropertyValue(name));

export interface ToolStripSelection { id: string; kind: string }
export interface ToolStripItem {
  /** Stable identity across kind sets and selection changes. Defaults to label. */
  id?: string;
  label: string;
  order?: number;
  icon?: React.ReactNode;
  onSelect?: () => void;
  /** Optional MenuItem children, e.g. export formats. */
  menu?: React.ReactNode;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  destructive?: boolean;
  /** An irreversible destructive action requires a held confirmation. */
  irreversible?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  busy?: boolean;
  singleOnly?: boolean;
  shortcut?: string;
}
export type ToolStripVerbSets = Readonly<Record<string, readonly ToolStripItem[]>>;

/** Intersect the selected kinds; catalog insertion order stays stable across every selection. */
export function verbsFor(selection: readonly ToolStripSelection[], sets: ToolStripVerbSets): ToolStripItem[] {
  if (!selection.length) return [];
  const kinds = [...new Set(selection.map((item) => item.kind))];
  const catalog = new Map<string, ToolStripItem>();
  for (const items of Object.values(sets)) for (const item of items) if (!catalog.has(identity(item))) catalog.set(identity(item), item);
  return [...catalog.values()].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)).flatMap((item) => {
    if (item.singleOnly && selection.length !== 1) return [];
    const matches = kinds.map((kind) => sets[kind]?.find((verb) => identity(verb) === identity(item)));
    if (matches.some((match) => !match)) return [];
    const disabled = matches.find((match) => match?.disabled || match?.disabledReason);
    return [{ ...item, disabled: !!disabled, disabledReason: disabled?.disabledReason, busy: matches.some((match) => match?.busy) }];
  });
}

export interface ToolStripProps {
  items?: readonly ToolStripItem[];
  selection?: readonly ToolStripSelection[];
  verbSets?: ToolStripVerbSets;
  label: string;
  /** A leading selection count; selection.length is used when omitted. */
  count?: number;
  /** Maximum regular keys before More. The destructive key is always visible and last. */
  maxVisible?: number;
  /** Selection bounds in viewport coordinates. Update them when the canvas pans/zooms. */
  anchor?: Element | { x: number; y: number; width: number; height: number };
  /** A canvas element or viewport rectangle limiting placement. */
  boundary?: Element | { x: number; y: number; width: number; height: number };
  className?: string;
}

/** A graphite action strip. Base UI owns toolbar keys, popover placement, menus and tooltips. */
export function ToolStrip({ items, selection, verbSets, label, count = selection?.length, maxVisible, anchor, boundary, className }: ToolStripProps) {
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null);
  const surface = React.useRef<HTMLElement>(null);
  const reduced = useReducedMotion(root);
  const [capacity, setCapacity] = React.useState(Infinity);
  const all = items ?? (selection && verbSets ? verbsFor(selection, verbSets) : []);
  const normal = all.filter((item) => !item.destructive), danger = all.filter((item) => item.destructive);
  const limit = Math.max(0, Math.min(maxVisible ?? Infinity, capacity));
  const overflow = normal.length > limit ? normal.slice(Math.max(0, limit - 1)) : [];
  const visible = overflow.length ? normal.slice(0, Math.max(0, limit - 1)) : normal;
  const displayed: ToolStripItem[] = [...visible, ...(overflow.length ? [{ id: '__more', label: 'More', icon: <MoreIcon />, menuOpen: overflow.some((item) => item.menuOpen) || undefined, onMenuOpenChange: (open: boolean) => { if (!open) overflow.forEach((item) => item.onMenuOpenChange?.(false)); }, menu: overflow.map((item) => item.menu ? <BaseMenu.Group key={identity(item)}><BaseMenu.GroupLabel className={menuParts.HEADING}>{item.label}</BaseMenu.GroupLabel>{item.menu}</BaseMenu.Group> : <MenuItem key={identity(item)} icon={item.icon} disabled={item.disabled || !!item.disabledReason || item.busy} shortcut={item.shortcut} onSelect={item.onSelect}>{item.label}{item.disabledReason ? ` · ${item.disabledReason}` : ''}</MenuItem>) }] : []), ...danger];
  const signature = displayed.map(identity).join('\u0000');
  const previous = React.useRef<{ width: number; boxes: Map<string, { x: number; y: number; item: ToolStripItem }> }>({ width: 0, boxes: new Map() });
  const [leaving, setLeaving] = React.useState<{ x: number; y: number; item: ToolStripItem }[]>([]);

  React.useLayoutEffect(() => {
    if (!root) return;
    const resize = () => {
      const css = getComputedStyle(root);
      const available = isElement(boundary) ? boundary.clientWidth : boundary?.width ?? window.innerWidth;
      const pad = cssNumber(css, '--mu-toolstrip-pad'), gap = cssNumber(css, '--mu-toolstrip-gap'), key = cssNumber(css, '--mu-r-button-strip-height');
      const countWidth = root.querySelector('[data-count]')?.getBoundingClientRect().width ?? 0;
      const reserve = danger.length * (key + gap) + (danger.length ? cssNumber(css, '--mu-toolstrip-sep-pad') * 2 + cssNumber(css, '--mu-toolstrip-sep-width') : 0);
      setCapacity(Math.max(1, Math.floor((available - pad * 2 - cssNumber(css, '--mu-space-8') * 2 - countWidth - gap - reserve) / (key + gap))));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(isElement(boundary) ? boundary : document.documentElement);
    window.addEventListener('resize', resize);
    return () => { observer.disconnect(); window.removeEventListener('resize', resize); };
  }, [root, boundary, count, danger.length]);

  React.useLayoutEffect(() => {
    if (!root) return;
    const css = getComputedStyle(root);
    const duration = durationMs(css, '--mu-spring-settle-d'), easing = css.getPropertyValue('--mu-spring-settle').trim();
    const old = previous.current, boxes = new Map<string, { x: number; y: number; item: ToolStripItem }>();
    root.querySelectorAll<HTMLElement>('[data-verb]').forEach((key) => {
      const id = key.dataset.verb!, item = displayed.find((item) => identity(item) === id)!;
      const box = { x: key.offsetLeft, y: key.offsetTop, item };
      boxes.set(id, box);
      if (reduced) return;
      const before = old.boxes.get(id);
      if (before) key.animate([{ transform: `translate(${before.x - box.x}px,${before.y - box.y}px)` }, { transform: 'translate(0px,0px)' }], { duration, easing });
      else if (old.width) key.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing });
    });
    if (old.width && !reduced) {
      surface.current?.animate([{ transform: `scaleX(${old.width / root.offsetWidth})` }, { transform: 'scaleX(1)' }], { duration, easing });
      setLeaving([...old.boxes].filter(([id]) => !boxes.has(id)).map(([, box]) => box));
    } else setLeaving([]);
    previous.current = { width: root.offsetWidth, boxes };
    const timer = setTimeout(() => setLeaving([]), duration);
    return () => clearTimeout(timer);
  }, [root, signature, reduced]);

  const content = <TooltipProvider><Toolbar.Root ref={setRoot} aria-label={`Tools for ${label}`} className={[STRIP, className].filter(Boolean).join(' ')}>
    <Surface ref={surface} material="graphite-strip" radius="strip" aria-hidden className="absolute inset-0 z-0 origin-left" />
    {count !== undefined && <Label data-count variant="on-graphite" className="relative z-1 px-toolstrip-gap tabular-nums" aria-label={`${count} selected`}><SwapText value={`${count} selected`} /></Label>}
    {displayed.flatMap((item) => [
      ...(item.destructive ? [<Toolbar.Separator key={`${identity(item)}-rule`} render={<Rule tone="graphite" className="relative z-1" />} />] : []),
      <StripKey key={identity(item)} item={item} />,
    ])}
    {leaving.map(({ item, x, y }) => <span key={identity(item)} aria-hidden inert className={`${buttonClasses(item.destructive ? 'strip-danger' : 'strip')} ${KEY} absolute pointer-events-none`} style={{ position: 'absolute', left: x, top: y }} ref={(el) => { if (el) { const css = getComputedStyle(el); el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: durationMs(css, '--mu-spring-settle-d'), easing: css.getPropertyValue('--mu-spring-settle').trim(), fill: 'forwards' }); } }}>{item.icon ?? item.label}</span>)}
  </Toolbar.Root></TooltipProvider>;
  const [anchorNode, setAnchorNode] = React.useState<HTMLSpanElement | null>(null);
  if (!anchor) return content;
  return <>{!isElement(anchor) && <span key={`${anchor.x},${anchor.y},${anchor.width},${anchor.height}`} ref={setAnchorNode} aria-hidden style={{ position: 'fixed', left: anchor.x, top: anchor.y, width: anchor.width, height: anchor.height, pointerEvents: 'none', opacity: 0 }} />}<Popover.Root open modal={false}><Popover.Portal><Popover.Positioner anchor={isElement(anchor) ? anchor : anchorNode} collisionBoundary={boundary} positionMethod="fixed" side="top" align="center" sideOffset={() => root ? cssNumber(getComputedStyle(root), '--mu-toolstrip-gap-above') : 0} collisionPadding={root ? cssNumber(getComputedStyle(root), '--mu-space-8') : undefined} className="z-menu-z" collisionAvoidance={{ side: 'flip', align: 'shift', fallbackAxisSide: 'none' }}><Popover.Popup initialFocus={false} finalFocus={false} render={<div />}>{content}</Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root></>;
}

function StripKey({ item }: { item: ToolStripItem }) {
  const reasonId = React.useId();
  const disabled = item.disabled || !!item.disabledReason || item.busy;
  const key = <Toolbar.Button data-verb={identity(item)} render={<Button cap={item.destructive ? 'strip-danger' : 'strip'} hold={item.irreversible && !disabled} icon={item.icon} iconOnly={!!item.icon} state={item.busy ? 'waiting' : undefined} waitingLabel={`${item.label} in progress`} className={`${KEY}${item.icon || item.busy ? ' w-button-strip-height px-0' : ''}`} />} aria-label={item.label} aria-keyshortcuts={item.shortcut} aria-busy={item.busy || undefined} aria-describedby={item.disabledReason ? reasonId : undefined} aria-disabled={disabled || undefined} data-disabled={disabled ? '' : undefined} onKeyDown={(event) => { if (item.irreversible && !disabled && (event.key === ' ' || event.key === 'Enter')) event.preventBaseUIHandler(); }} onClick={() => { if (!disabled && !item.menu) item.onSelect?.(); }}>{item.icon ? null : item.label}</Toolbar.Button>;
  if (item.menu) return <Menu trigger={React.cloneElement(key, { title: item.label })} heading={item.label} side="top" open={disabled ? false : item.menuOpen} onOpenChange={item.onMenuOpenChange}>{item.menu}</Menu>;
  return <><Tooltip label={item.disabledReason ? `${item.label} · ${item.disabledReason}` : item.busy ? `${item.label} in progress` : item.irreversible ? `${item.label} · Hold to confirm` : item.label} shortcut={item.shortcut}><span className="inline-flex">{key}</span></Tooltip>{item.disabledReason && <span id={reasonId} className="sr-only">{item.disabledReason}</span>}</>;
}
