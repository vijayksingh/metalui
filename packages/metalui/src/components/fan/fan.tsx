'use client';

import * as React from 'react';
import { MorphPart, MorphShape, afterMorph, morphTo, returnFocusAfterMorph } from '../../motion/morph-shape';
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { useIsoLayoutEffect } from '../../motion/layout-effect';
import { useReducedMotion } from '../../motion/reduced';
import { Tooltip, TooltipProvider } from '../tooltip/tooltip';
import { CloseIcon } from '../../icons/components.generated';
import { Toggle } from '@base-ui/react/toggle';
import { INKS, INK_WIDTHS, inkColor, type Ink, type InkWidth } from '../draw-picks/draw-picks';

/* Compact canvas control: one grouped tool grid or contextual tray is open.
 * Caps use the shared tool recipe; all travel uses the part spring. */

type Open = { id: string; restore: () => void } | null;
const FanContext = React.createContext<{ open: Open; setOpen: (o: Open) => void } | null>(null);
const useFan = () => {
  const c = React.useContext(FanContext);
  if (!c) throw new Error('Fan cells go inside <Fan>');
  return c;
};



/* Styled with the theme's utilities: the icon-button tool cap for cells, the toolbar recipe for the tray. */
const ROW = 'mu-fan relative inline-flex items-end gap-toolbar-gap';
const CAP = 'disabled:opacity-button-disabled disabled:cursor-default mu-icon-trigger box-border inline-grid place-items-center flex-none p-0 border-0 cursor-pointer tap-highlight-none size-icon-button-tool-size rounded-icon-button-tool-radius text-icon-button-tool-ink recipe-icon-button-tool transition-icon-button-tool icon-button-tool-hover [&>svg]:size-icon-button-tool-glyph active:translate-y-icon-button-tool-press active:recipe-icon-button-tool-pressed focus-visible:focus-ring-flush';
const LABEL = 'mu-fan-label box-border inline-flex items-center h-icon-button-tool-size px-toolbar-pad rounded-icon-button-tool-radius recipe-icon-button-tool type-toolbar-search text-icon-button-tool-ink whitespace-nowrap';
/** The part spring, from the theme (duration and curve). */
const SPRING = 'duration-part ease-part';

export interface FanProps {
  'aria-label': string;
  className?: string;
  children: React.ReactNode;
}

/** The bar. It keeps which cell is open (one at a time) and folds it on Escape or a press outside. */
function FanRoot({ className, children, ...props }: FanProps) {
  const [open, setOpenState] = React.useState<Open>(null);
  const root = React.useRef<HTMLDivElement>(null);
  // every change of the open cell is a morph (docs/ONE-SHAPE.md): a tray opens and folds as one
  // shape and the cells beside it travel. All of them go through morphTo, so they queue in order and
  // a new one starts from the frame on screen; a plain update during a morph would be dropped.
  const current = React.useRef<Open>(null);
  current.current = open;
  const setOpen = React.useCallback((o: Open) => {
    const was = current.current;
    // a fold clears only the cell it was asked to fold, never one opened since
    morphTo(() => setOpenState((cur) => (o === null && cur !== was ? cur : o)), o ? 'open' : 'close', root.current);
  }, []);
  React.useEffect(() => {
    if (!open) return;
    const fold = () => { const o = open; setOpen(null); o.restore(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); fold(); } };
    // a click outside folds it after what was clicked has handled the click (docs/ONE-SHAPE.md)
    const press = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(null);
        // focus goes back to the cell only if what was clicked did not take it: focus on nothing,
        // or still inside the fan it folded (an option that is hidden now)
        afterMorph(() => { const now = document.activeElement; if (!now || now === document.body || root.current?.contains(now)) open.restore(); });
      }
    };
    window.addEventListener('keydown', key);
    window.addEventListener('click', press, true);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('click', press, true); };
  }, [open, setOpen]);
  // the cells beside a tray are in both states: they travel when it opens or folds, never jump.
  // A tray is its own shape; the picker names only its cap, so its fan-out stays live.
  const cellsId = React.useId().replace(/:/g, '');
  const cells = React.Children.map(children, (child, i) =>
    React.isValidElement(child) && child.type !== FanTray && child.type !== FanPicker
      ? <MorphPart name={`${cellsId}-cell-${i}`}>{child}</MorphPart>
      : child);
  return (
    <FanContext.Provider value={{ open, setOpen }}>
      <TooltipProvider><div ref={root} role="toolbar" aria-label={props['aria-label']} className={className ? `${ROW} ${className}` : ROW}>{cells}</div></TooltipProvider>
    </FanContext.Provider>
  );
}

/** What the bar is about right now: "Canvas", "Text", "Ink", "3 selected". */
function FanLabel({ children, label }: { children: React.ReactNode; label?: string }) {
  const content = <div className={label ? `${CAP} mu-fan-label` : LABEL} aria-label={label}>{children}</div>;
  return label ? <Tooltip label={label}>{content}</Tooltip> : content;
}

export interface FanOption<V extends string> { value: V; label: string; icon: React.ReactNode; shortcut?: string }

export interface FanPickerProps<V extends string> {
  /** The group's name: "Tool". */
  label: string;
  value: V;
  options: FanOption<V>[];
  onValueChange: (value: V) => void;
  /** up: the fan rises from the cap (a bar at the bottom). both: it opens above and below, centred. */
  direction?: 'up' | 'both';
}

/** The current choice; pressing it fans the other choices out from behind it. */
function FanPicker<V extends string>({ label, value, options, onValueChange, direction = 'up' }: FanPickerProps<V>) {
  const { open, setOpen } = useFan();
  const id = React.useId();
  const isOpen = open?.id === id;
  const cap = React.useRef<HTMLButtonElement>(null);
  const items = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [step, setStep] = React.useState(0);
  const current = options.find((o) => o.value === value) ?? options[0];
  const choices = options;
  const rows = Math.ceil(choices.length / 3);

  // One slot is a cap plus the bar's gap, measured as the fan opens so it follows the theme (and
  // never reads a size from before the styles arrived).
  const measure = () => {
    const el = cap.current; if (!el) return;
    const bar = el.closest('.mu-fan');
    const gap = bar ? parseFloat(getComputedStyle(bar).columnGap) || 0 : 0;
    setStep(el.offsetHeight + gap);
  };
  // focus moves to the chosen option once the morph lands; a focus set while it starts is lost (ONE-SHAPE M4b)
  React.useEffect(() => { if (isOpen) afterMorph(() => items.current[Math.max(0, choices.indexOf(current))]?.focus()); }, [isOpen]);

  const cell = (k: number) => {
    const row = Math.floor(k / 3);
    const centre = Math.ceil(rows / 2);
    return { x: (k % 3 - 1) * step, y: (direction === 'up' ? row - rows : row - centre + (row >= centre ? 1 : 0)) * step };
  };
  const choose = (v: V) => { onValueChange(v); setOpen(null); afterMorph(() => cap.current?.focus()); };
  const toggle = () => { if (!isOpen) measure(); setOpen(isOpen ? null : { id, restore: () => cap.current?.focus() }); };
  const move = (e: React.KeyboardEvent, k: number) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const next = k + delta;
    if (next >= 0 && next < choices.length && (Math.abs(delta) === 3 || Math.floor(next / 3) === Math.floor(k / 3))) items.current[next]?.focus();
  };
  const still = useReducedMotion(cap.current);

  if (!current) return null;
  return (
    <div className="mu-fan-picker relative">
      <div role="listbox" aria-label={label} aria-hidden={!isOpen} className="absolute inset-0 pointer-events-none">
        {choices.map((o, k) => {
          const { x, y } = cell(k);
          return (
            <button
              key={o.value}
              ref={(el) => { items.current[k] = el; }}
              type="button"
              role="option"
              aria-selected={o.value === value}
              aria-label={o.shortcut ? `${o.label} · ${o.shortcut}` : o.label}
              title={o.shortcut ? `${o.label} · ${o.shortcut}` : o.label}
              tabIndex={isOpen ? 0 : -1}
              className={`${CAP} absolute inset-0 ${SPRING} aria-selected:recipe-icon-button-tool-pressed`}
              style={{
                transform: isOpen ? `translate(${x}px, ${y}px)` : 'translate(0, 0)',
                opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none',
                transitionProperty: still ? 'opacity' : 'transform, opacity',
                transitionDelay: !still && isOpen ? `calc(${Math.abs(k % 3 - 1) + Math.abs(Math.floor(k / 3) - rows)} * var(--mu-motion-fan-stagger))` : undefined,
              }}
              onClick={() => choose(o.value)}
              onKeyDown={(e) => move(e, k)}
            >
              {o.icon}
            </button>
          );
        })}
      </div>
      <MorphPart name={`${id.replace(/:/g, '')}-pick`}>
      <button
        ref={cap}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label}: ${current.label}`}
        title={`${label}: ${current.label}`}
        className={`${CAP} relative`}
        onClick={toggle}
      >
        {current.icon}
      </button>
      </MorphPart>
    </div>
  );
}

export interface FanTrayProps {
  /** The options' name: "Ink", "Actions". */
  label: string;
  /** The cap's glyph when folded. */
  icon: React.ReactNode;
  children: React.ReactNode;
}

/** An options cap that opens sideways into a tray of more controls, as one shape (docs/ONE-SHAPE.md); × folds it. */
function FanTray({ label, icon, children }: FanTrayProps) {
  const { open, setOpen } = useFan();
  const id = React.useId();
  const isOpen = open?.id === id;
  const cap = React.useRef<HTMLButtonElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const was = React.useRef(isOpen);
  // focus follows the shape: into the tray when it opens, back to the cap when it folds
  useIsoLayoutEffect(() => {
    if (isOpen) afterMorph(() => inner.current?.querySelector<HTMLElement>('button, [tabindex="0"]')?.focus());
    else if (was.current) returnFocusAfterMorph(() => cap.current);
    was.current = isOpen;
  }, [isOpen]);

  const toggle = () => { setOpen(isOpen ? null : { id, restore: () => cap.current?.focus() }); };

  return (
    <MorphShape material="tool" from="left">
      <div className={`mu-fan-tray relative inline-flex items-center min-h-icon-button-tool-size rounded-icon-button-tool-radius${isOpen ? ' recipe-icon-button-tool' : ''}`}>
        {isOpen ? (
          <BaseToolbar.Root
            ref={inner}
            aria-label={label}
            className="mu-fan-tray-inner relative inline-flex flex-wrap items-center gap-toolbar-gap p-toolbar-pad"
            style={{ maxWidth: 'calc(100vw - var(--mu-r-icon-button-tool-size) * 2 - var(--mu-space-32) * 2)' }}
          >
            {children}
            <BaseToolbar.Button aria-label={`Fold ${label}`} title="Fold" className={`${CAP} mu-fan-fold`} onClick={() => setOpen(null)}>
              <CloseIcon />
            </BaseToolbar.Button>
          </BaseToolbar.Root>
        ) : (
          <button ref={cap} type="button" aria-expanded={false} aria-label={label} title={label} className={CAP} onClick={toggle}>
            {icon}
          </button>
        )}
      </div>
    </MorphShape>
  );
}

export interface FanActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}
/** A named glyph key in a contextual tray. Icon acts follow hover and press. */
function FanAction({ label, icon, shortcut, className, ...props }: FanActionProps) {
  return <Tooltip label={label} shortcut={shortcut}><BaseToolbar.Button {...props} aria-label={label} title={label} className={`${CAP}${className ? ` ${className}` : ''}`}>{icon}</BaseToolbar.Button></Tooltip>;
}
function FanInk({ value, onValueChange }: { value: Ink; onValueChange: (ink: Ink) => void }) {
  return <BaseToolbar.Group aria-label="Ink" className="draw-picks">{INKS.map((ink) => <Tooltip key={ink.value} label={`Ink: ${ink.label.toLowerCase()}`}><BaseToolbar.Button aria-label={`Ink: ${ink.label.toLowerCase()}`} className="mu-draw-pick draw-pick" render={<Toggle pressed={value === ink.value} onPressedChange={() => onValueChange(ink.value)} />}><span aria-hidden className="draw-bead draw-lift reduced-motion:transition-none" style={{ '--mu-self': ink.value === 'ink' ? 'var(--mu-r-draw-ink-on-dark)' : inkColor(ink.value) } as React.CSSProperties} /></BaseToolbar.Button></Tooltip>)}</BaseToolbar.Group>;
}
const WIDTH_CLASSES = { fine: 'draw-w-fine', regular: 'draw-w-regular', bold: 'draw-w-bold' };
function FanWidth({ value, onValueChange, ink = 'ink' }: { value: InkWidth; onValueChange: (width: InkWidth) => void; ink?: Ink }) {
  return <BaseToolbar.Group aria-label="Width" className="draw-picks">{INK_WIDTHS.map((width) => <Tooltip key={width.value} label={`Width: ${width.label.toLowerCase()}`}><BaseToolbar.Button aria-label={`Width: ${width.label.toLowerCase()}`} className="mu-draw-pick draw-pick" render={<Toggle pressed={value === width.value} onPressedChange={() => onValueChange(width.value)} />}><span aria-hidden className={`draw-dot ${WIDTH_CLASSES[width.value]} draw-lift reduced-motion:transition-none`} style={{ '--mu-self': ink === 'ink' ? 'var(--mu-r-draw-ink-on-dark)' : inkColor(ink), width: 'var(--mu-r-draw-self-bead)' } as React.CSSProperties} /></BaseToolbar.Button></Tooltip>)}</BaseToolbar.Group>;
}
// Bind once so a bundler can drop the complete component.
export const Fan = Object.assign(FanRoot, { Label: FanLabel, Picker: FanPicker, Tray: FanTray, Action: FanAction, Ink: FanInk, Width: FanWidth });
