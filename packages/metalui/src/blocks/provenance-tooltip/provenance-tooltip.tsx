'use client';

import * as React from 'react';
import { Tooltip, TooltipProvider } from '../../components/tooltip/tooltip';

/* ─────────────────────────────────────────────────────────
 * PROVENANCE TOOLTIP (the reference design's #tip): a composition
 *   Tooltip(wrap, 380 ms, 8 or 34 above) › the source + Tooltip.Dim "· detail · detail"
 *
 *   rest     the cue, nothing else
 *   380 ms   hovered or focused: the tooltip fades in on settle, 8 above the cue
 *            (34 above a cue that shows its own value chip, so the two never overlap)
 *   edge     near the top of the view it flips below (Base UI collision avoidance)
 *   leave    fades out on settle; moving to the next cue shows it at once
 * The source comes first, then the dimmed detail: "Rule · date parser", "Recognizer · 0.82", "You".
 * ───────────────────────────────────────────────────────── */

const token = (name: string, fallback: number) => {
  if (typeof window === 'undefined') return fallback;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
};

export interface ProvenanceTooltipProps {
  /** Where the cue came from: "Rule", "Recognizer", "Region", "Cluster", "Formula", "You". */
  source: string;
  /** The rest, dimmed: ["date parser"], ["0.82"], ["Done"]. Show the number whenever the app guessed. */
  detail?: string[];
  /** The cue shows its own resolved-value chip on hover: sit above it. */
  clearsChip?: boolean;
  /** The cue element. It must accept a ref and props (a Mark, a span, a button). */
  children: React.ReactElement<Record<string, unknown>>;
  /** Controlled open state (a docs still, a test). */
  open?: boolean;
}

/** Says where a cue came from, one hover away. */
export function ProvenanceTooltip({ source, detail = [], clearsChip, children, open }: ProvenanceTooltipProps) {
  // Tooltips are visual; the provenance is also the cue's accessible description.
  const trigger = React.cloneElement(children, { 'aria-description': [source, ...detail].join(', ') });
  return (
    <Tooltip
      wrap
      open={open}
      className="mu-provenance"
      delay={token('--mu-provenance-delay-ms', 380)}
      offset={token(clearsChip ? '--mu-provenance-chip-offset' : '--mu-provenance-offset', clearsChip ? 34 : 8)}
      label={
        <>
          {source}
          {detail.length > 0 && <Tooltip.Dim> · {detail.join(' · ')}</Tooltip.Dim>}
        </>
      }
    >
      {trigger}
    </Tooltip>
  );
}

/** Groups provenance tooltips at their 380 ms delay: after one shows, the next cue shows its own at once. */
export function ProvenanceProvider({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delay={token('--mu-provenance-delay-ms', 380)}>{children}</TooltipProvider>;
}
