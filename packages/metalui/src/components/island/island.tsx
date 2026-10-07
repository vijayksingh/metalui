'use client';

import * as React from 'react';
import { Button } from '../button/button';
import { Surface } from '../surface/surface';
import { Led, type LedKind, type LedGesture } from '../led/led';
import { Label } from '../label/label';
import { SwapText } from '../../motion/swap';
import { MorphIcon } from '../../icons/MorphIcon';
import { useIsoLayoutEffect } from '../../motion/layout-effect';
import { motionReduced } from '../../motion/reduced';

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
 *   open       the body's outline grows from the capsule's exact outline to the panel's on the
 *     0 ms     surface spring (a clip, round all the way; nothing scales); the chevron turns over
 *   ~80 ms     the panel's content fades in (part spring); focus moves to its first control
 *   close      Esc, a press outside, or the capsule again: the content fades, the outline
 *              shrinks back into the capsule on the surface spring, focus returns to the capsule
 *   announce   a passing event takes the detail's place: the words turn on the swap drum
 *              and the capsule's footprint follows them, then after toast-plain-ms turn back
 *   condition  a lasting state (offline, the past) is the detail itself: it stays until it ends
 *   tone       the LED: live (steady), working (breathes), offline (failed), quiet (off).
 *              The tone is also said in words, never by colour alone
 * Reduce Motion: the outline does not travel; the panel fades.
 * Graphite hardware in both colorways: a graphite-deep Surface with the graphite cap on it, both
 * reading the graphite tokens. Without children it stays a capsule (a menu's trigger, say).
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
const CAP = 'mu-island-cap gap-island-gap';
const TITLE = 'mu-island-title max-w-island-title-max truncate';
const DETAIL = 'mu-island-detail';
const CHEVRON = 'mu-island-chevron select-chevron';
const PANEL = 'mu-island-panel flex flex-col self-stretch gap-island-panel-gap px-island-panel-pad pt-island-panel-gap animate-sf-fade transition-opacity duration-settle ease-settle data-closing:opacity-0';
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

function spring(el: Element) {
  const css = getComputedStyle(el);
  const raw = css.getPropertyValue('--mu-spring-surface-d').trim();
  return { duration: parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000) || 500, easing: css.getPropertyValue('--mu-spring-surface').trim() || 'ease-out' };
}

/** The capsule's outline inside the body, as an inset clip. */
function capsuleClip(body: HTMLElement, cap: HTMLElement) {
  const right = body.offsetWidth - cap.offsetLeft - cap.offsetWidth;
  const bottom = body.offsetHeight - cap.offsetTop - cap.offsetHeight;
  return `inset(${cap.offsetTop}px ${right}px ${bottom}px ${cap.offsetLeft}px round ${cap.offsetHeight / 2}px)`;
}

function panelClip(body: HTMLElement) {
  const r = getComputedStyle(body).getPropertyValue('--mu-r-surface-radius-card').trim() || '24px';
  return `inset(0px 0px 0px 0px round ${r})`;
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
  const [passing, setPassing] = React.useState<string | null>(null);
  // out: the panel is laid out (open, or closing until the outline is back in the capsule)
  const [out, setOut] = React.useState(open && hasPanel);
  const [closing, setClosing] = React.useState(false);

  React.useEffect(() => {
    if (!announce) return;
    setPassing(announce);
    const t = window.setTimeout(() => setPassing(null), holdMs(inner.current));
    return () => window.clearTimeout(t);
  }, [announce]);

  React.useEffect(() => { if (open && hasPanel) { setOut(true); setClosing(false); } }, [open, hasPanel]);

  // opening: the first painted frame is the capsule's outline, then it grows to the panel's
  useIsoLayoutEffect(() => {
    const b = body.current, c = inner.current;
    if (!out || !open || !b || !c) return;
    if (!motionReduced(b)) {
      const from = capsuleClip(b, c), to = panelClip(b);
      b.style.clipPath = from;
      const run = b.animate([{ clipPath: from }, { clipPath: to }], spring(b));
      run.onfinish = () => { b.style.clipPath = ''; };
    }
    const first = panel.current?.querySelector<HTMLElement>('button:not([disabled]), [tabindex="0"], input');
    first?.focus({ preventScroll: true });
  }, [out, open]);

  // closing: the content fades, the outline shrinks back into the capsule, then the panel goes
  useIsoLayoutEffect(() => {
    const b = body.current, c = inner.current;
    if (open || !out || !b || !c) return;
    setClosing(true);
    const done = () => { b.style.clipPath = ''; setOut(false); setClosing(false); };
    if (motionReduced(b)) { done(); return; }
    const from = panelClip(b), to = capsuleClip(b, c);
    const run = b.animate([{ clipPath: from }, { clipPath: to }], { ...spring(b), fill: 'forwards' });
    run.onfinish = () => { run.cancel(); done(); };
    return () => run.cancel();
  }, [open]);

  // Esc and a press outside close it; focus comes back to the capsule. A popup opened from the
  // panel (a menu, a list, a dialog) is the panel's own: presses and Esc inside it are its own
  React.useEffect(() => {
    if (!open || !hasPanel) return;
    const inPopup = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('[role="menu"], [role="listbox"], [role="dialog"]');
    const close = () => { onOpenChange?.(false); inner.current?.focus({ preventScroll: true }); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !inPopup(e.target)) { e.stopPropagation(); close(); } };
    const press = (e: PointerEvent) => { if (!body.current?.contains(e.target as Node) && !inPopup(e.target)) onOpenChange?.(false); };
    document.addEventListener('keydown', key, true);
    document.addEventListener('pointerdown', press, true);
    return () => { document.removeEventListener('keydown', key, true); document.removeEventListener('pointerdown', press, true); };
  }, [open, hasPanel, onOpenChange]);

  const shown = passing ?? detail ?? '';
  const led = lights[tone];
  const name = [title, detail, toneLabel].filter(Boolean).join('. ');
  const shell = out ? SHELL_OPEN : SHELL;
  return (
    <Surface
      ref={body}
      as="span"
      material="graphite-deep"
      radius={out ? 'card' : 'pill'}
      data-mu-colorway="graphite"
      data-open={out ? '' : undefined}
      className={className ? `${shell} ${className}` : shell}
    >
      <Button
        ref={(el: HTMLElement | null) => {
          inner.current = el;
          if (typeof ref === 'function') ref(el as HTMLButtonElement | null);
          else if (ref) ref.current = el as HTMLButtonElement | null;
        }}
        cap="graphite"
        aria-label={name}
        aria-expanded={hasPanel ? open : undefined}
        aria-controls={hasPanel && out ? panelId : undefined}
        className={CAP}
        {...props}
        onClick={hasPanel ? (e) => { props.onClick?.(e); onOpenChange?.(!open); } : props.onClick}
      >
        <Led kind={led.kind} gesture={led.gesture} />
        <span className={TITLE}>{title}</span>
        {shown && <Label variant="readout-dim"><SwapText value={shown} className={DETAIL} /></Label>}
        <MorphIcon name="chevron" turn={open ? 180 : 0} className={CHEVRON} />
        <span className={SPOKEN} role="status" aria-live="polite">{passing ?? ''}</span>
      </Button>
      {hasPanel && out && (
        <div ref={panel} id={panelId} role="group" aria-label={title} className={PANEL} data-closing={closing ? '' : undefined}>
          {children}
        </div>
      )}
    </Surface>
  );
});
