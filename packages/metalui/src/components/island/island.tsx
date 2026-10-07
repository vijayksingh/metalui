'use client';

import * as React from 'react';
import { Button } from '../button/button';
import { Surface } from '../surface/surface';
import { Led, type LedKind, type LedGesture } from '../led/led';
import { Label } from '../label/label';
import { SwapText } from '../../motion/swap';
import { MorphIcon } from '../../icons/MorphIcon';
import { useIsoLayoutEffect } from '../../motion/layout-effect';
import { MorphPart, MorphShape, afterMorph, morphTo, returnFocusAfterMorph } from '../../motion/morph-shape';

/* ─────────────────────────────────────────────────────────
 * ISLAND, where you are and how things stand, in one graphite capsule that opens
 *
 * One pill at the top of a place: a status LED, the place's name, one quiet fact, a chevron.
 * With a panel (children) the capsule opens into it: the same graphite body grows down and out
 * from the capsule, so the top of the screen holds one object instead of a row of pills and a
 * menu that hangs off them.
 *
 *   rest       LED · title · detail · chevron, on the graphite cap
 *   hover      the cap's own hover
 *   pressed    the cap sinks by the press travel
 *   focus      the cap's focus ring
 *   open       one shape (docs/ONE-SHAPE.md, MorphShape): the capsule's outline travels to the
 *     0 ms     panel's on the surface spring, painted graphite, corners true; the capsule's row
 *              and the panel dissolve in inside it, pinned to the top; the chevron turns over;
 *              focus moves to the panel's first control
 *   close      Esc, a press outside, or the capsule again: the same shape travels back into the
 *              capsule on the release spring, focus returns to the capsule
 *   announce   a passing event takes the detail's place: the words turn on the swap drum
 *              and the capsule's footprint follows them, then after toast-plain-ms turn back
 *   condition  a lasting state (offline, the past) is the detail itself: it stays until it ends
 *   tone       the LED: live (steady), working (breathes), offline (failed), quiet (off).
 *              The tone is also said in words, never by colour alone
 * Reduce Motion: no travel, a cross-dissolve. Without View Transitions it simply opens.
 * Graphite hardware in both colorways: a graphite-deep Surface with the graphite cap on it, both
 * reading the graphite tokens. Open, it is one surface: the capsule lies flush as the panel's title
 * row (its wash only on hover), and the panel's controls should be flat too (strip buttons, ghost
 * icons), never caps on caps. Without children it stays a capsule (a menu's trigger, say).
 * ───────────────────────────────────────────────────────── */

export type IslandTone = 'live' | 'working' | 'offline' | 'quiet';

const lights: Record<IslandTone, { kind: LedKind; gesture: LedGesture }> = {
  live: { kind: 'live', gesture: 'steady' },
  working: { kind: 'waiting', gesture: 'breathe' },
  offline: { kind: 'failed', gesture: 'steady' },
  quiet: { kind: 'off', gesture: 'steady' },
};

const SHELL = 'mu-island inline-flex flex-col items-center';
const SHELL_OPEN = 'mu-island inline-flex flex-col items-center w-island-panel-width pb-island-panel-pad';
/* Open, the capsule is the panel's title row: flush with the body, its wash only on hover. */
const CAP = 'mu-island-cap gap-island-gap data-flush:not-hover:bg-transparent';
const TITLE = 'mu-island-title max-w-island-title-max truncate';
const DETAIL = 'mu-island-detail';
const CHEVRON = 'mu-island-chevron select-chevron';
const PANEL = 'mu-island-panel flex flex-col self-stretch gap-island-panel-gap px-island-panel-pad pt-island-panel-gap';
const SPOKEN = 'sr-only';

export interface IslandProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  /** Where you are: "Today · Wed 7 Oct". */
  title: string;
  /** One quiet fact about it, or a lasting condition: "8 blocks", "Offline". */
  detail?: string;
  /** The LED. */
  tone?: IslandTone;
  /** The tone in words, for the accessible name: "Recognition live". */
  toneLabel?: string;
  /** A passing event, shown in the detail's place for a moment: "Synced". A new string plays it again. */
  announce?: string | null;
  /** Open: the panel is out (or, with no panel, the menu it triggers is open). */
  open?: boolean;
  /** With a panel: it asks to open or close (the capsule, Esc, a press outside). */
  onOpenChange?: (open: boolean) => void;
  /** The panel the capsule opens into. */
  children?: React.ReactNode;
}

function holdMs(el: Element | null) {
  if (!el || typeof window === 'undefined') return 2600;
  return parseFloat(getComputedStyle(el).getPropertyValue('--mu-toast-plain-ms')) || 2600;
}

/** Where you are and how things stand: one capsule that opens into the place's panel. */
export const Island = React.forwardRef<HTMLButtonElement, IslandProps>(function Island(
  { title, detail, tone = 'quiet', toneLabel, announce, open = false, onOpenChange, children, className, ...props },
  ref,
) {
  const inner = React.useRef<HTMLElement | null>(null);
  const body = React.useRef<HTMLElement | null>(null);
  const panel = React.useRef<HTMLDivElement | null>(null);
  const panelId = React.useId();
  const hasPanel = children != null;
  const out = open && hasPanel;
  const [passing, setPassing] = React.useState<string | null>(null);
  const was = React.useRef(out);

  React.useEffect(() => {
    if (!announce) return;
    setPassing(announce);
    const t = window.setTimeout(() => setPassing(null), holdMs(inner.current));
    return () => window.clearTimeout(t);
  }, [announce]);

  // focus follows the shape: into the panel when it opens, back to the capsule when it closes
  useIsoLayoutEffect(() => {
    if (out) afterMorph(() => panel.current?.querySelector<HTMLElement>('button:not([disabled]), [tabindex="0"], input')?.focus({ preventScroll: true }));
    else if (was.current) returnFocusAfterMorph(() => inner.current);
    was.current = out;
  }, [out]);

  // Esc and a press outside close it. A popup opened from the panel (a menu, a list, a dialog)
  // is the panel's own: presses and Esc inside it are its own
  React.useEffect(() => {
    if (!out) return;
    const inPopup = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('[role="menu"], [role="listbox"], [role="dialog"]');
    const close = () => morphTo(() => onOpenChange?.(false), 'close', body.current);
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !inPopup(e.target)) { e.stopPropagation(); close(); } };
    const press = (e: MouseEvent) => { if (!body.current?.contains(e.target as Node) && !inPopup(e.target)) close(); };
    // a click outside, not a press: what was clicked handles its own click first, then the island
    // folds (starting a morph on the press would hold the page and lose that click)
    document.addEventListener('keydown', key, true);
    document.addEventListener('click', press, true);
    return () => { document.removeEventListener('keydown', key, true); document.removeEventListener('click', press, true); };
  }, [out, onOpenChange]);

  const shown = passing ?? detail ?? '';
  const led = lights[tone];
  const name = [title, detail, toneLabel].filter(Boolean).join('. ');
  const shell = out ? SHELL_OPEN : SHELL;
  const capsule = (
    <Button
      ref={(el: HTMLElement | null) => {
        inner.current = el;
        if (typeof ref === 'function') ref(el as HTMLButtonElement | null);
        else if (ref) ref.current = el as HTMLButtonElement | null;
      }}
      cap="graphite"
      aria-label={name}
      aria-expanded={hasPanel ? open : undefined}
      aria-controls={out ? panelId : undefined}
      data-flush={out ? '' : undefined}
      className={CAP}
      {...props}
      onClick={hasPanel ? (e) => { props.onClick?.(e); morphTo(() => onOpenChange?.(!open), open ? 'close' : 'open', body.current); } : props.onClick}
    >
      <Led kind={led.kind} gesture={led.gesture} />
      <span className={TITLE}>{title}</span>
      {shown && <Label variant="readout-dim"><SwapText value={shown} className={DETAIL} /></Label>}
      <MorphIcon name="chevron" turn={open ? 180 : 0} className={CHEVRON} />
      <span className={SPOKEN} role="status" aria-live="polite">{passing ?? ''}</span>
    </Button>
  );
  const surface = (
    <Surface
      ref={body}
      as="span"
      material="graphite-deep"
      radius="card"
      data-mu-colorway="graphite"
      data-open={out ? '' : undefined}
      className={className ? `${out ? SHELL_OPEN : SHELL} ${className}` : out ? SHELL_OPEN : SHELL}
    >
      {hasPanel ? <MorphPart name={`${panelId.replace(/:/g, '')}-cap`}>{capsule}</MorphPart> : capsule}
      {out && (
        <div ref={panel} id={panelId} role="group" aria-label={title} className={PANEL}>
          {children}
        </div>
      )}
    </Surface>
  );
  return hasPanel ? <MorphShape material="graphite-deep">{surface}</MorphShape> : surface;
});
