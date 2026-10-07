'use client';

import * as React from 'react';
import { Button } from '../button/button';
import { Surface } from '../surface/surface';
import { Led, type LedKind, type LedGesture } from '../led/led';
import { Label } from '../label/label';
import { SwapText } from '../../motion/swap';
import { MorphIcon } from '../../icons/MorphIcon';

/* ─────────────────────────────────────────────────────────
 * ISLAND, where you are and how things stand, in one graphite capsule
 *
 * One pill at the top of a place: a status LED, the place's name, one quiet fact, a chevron.
 * It is the trigger of the place's menu (boards, appearance, settings), so the top of the
 * screen holds one object instead of a row of pills.
 *
 *   rest       LED · title · detail · chevron, on the graphite cap
 *   hover      the cap's own hover; the chevron is its trigger
 *   pressed    the cap sinks by the press travel
 *   focus      the cap's focus ring
 *   open       its menu hangs below; the chevron turns over (180) on the part spring
 *   announce   a passing event takes the detail's place: the words turn on the swap drum
 *              and the capsule's footprint follows them (growing first, shrinking after the
 *              old words leave), then after toast-plain-ms the detail turns back
 *   condition  a lasting state (offline, the past) is the detail itself: it stays until it ends
 *   tone       the LED: live (steady), working (breathes), offline (failed), quiet (off).
 *              The tone is also said in words, never by colour alone
 * Reduce Motion: the swap and the chevron resolve without travel (their own rules).
 * It is graphite hardware in both colorways: a graphite-deep Surface with the graphite cap on it,
 * both reading the graphite tokens. A composition of Surface, Button(graphite), Led, Label,
 * SwapText and the chevron MorphIcon: it paints nothing of its own.
 * ───────────────────────────────────────────────────────── */

export type IslandTone = 'live' | 'working' | 'offline' | 'quiet';

const lights: Record<IslandTone, { kind: LedKind; gesture: LedGesture }> = {
  live: { kind: 'live', gesture: 'steady' },
  working: { kind: 'waiting', gesture: 'breathe' },
  offline: { kind: 'failed', gesture: 'steady' },
  quiet: { kind: 'off', gesture: 'steady' },
};

const SHELL = 'mu-island inline-flex';
const CAP = 'mu-island-cap gap-island-gap';
const TITLE = 'mu-island-title max-w-island-title-max truncate';
const DETAIL = 'mu-island-detail';
const CHEVRON = 'mu-island-chevron select-chevron';
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
  /** Its menu is open: the chevron turns over. */
  open?: boolean;
}

function holdMs(el: Element | null) {
  if (!el || typeof window === 'undefined') return 2600;
  return parseFloat(getComputedStyle(el).getPropertyValue('--mu-toast-plain-ms')) || 2600;
}

/** Where you are and how things stand: one capsule that opens the place's menu. */
export const Island = React.forwardRef<HTMLButtonElement, IslandProps>(function Island(
  { title, detail, tone = 'quiet', toneLabel, announce, open = false, className, ...props },
  ref,
) {
  const inner = React.useRef<HTMLElement | null>(null);
  const [passing, setPassing] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!announce) return;
    setPassing(announce);
    const t = window.setTimeout(() => setPassing(null), holdMs(inner.current));
    return () => window.clearTimeout(t);
  }, [announce]);
  const shown = passing ?? detail ?? '';
  const led = lights[tone];
  const name = [title, detail, toneLabel].filter(Boolean).join('. ');
  return (
    <Surface as="span" material="graphite-deep" radius="pill" data-mu-colorway="graphite" className={className ? `${SHELL} ${className}` : SHELL}>
    <Button
      ref={(el: HTMLElement | null) => {
        inner.current = el;
        if (typeof ref === 'function') ref(el as HTMLButtonElement | null);
        else if (ref) ref.current = el as HTMLButtonElement | null;
      }}
      cap="graphite"
      aria-label={name}
      className={CAP}
      {...props}
    >
      <Led kind={led.kind} gesture={led.gesture} />
      <span className={TITLE}>{title}</span>
      {shown && <Label variant="readout-dim"><SwapText value={shown} className={DETAIL} /></Label>}
      <MorphIcon name="chevron" turn={open ? 180 : 0} className={CHEVRON} />
      <span className={SPOKEN} role="status" aria-live="polite">{passing ?? ''}</span>
    </Button>
    </Surface>
  );
});
