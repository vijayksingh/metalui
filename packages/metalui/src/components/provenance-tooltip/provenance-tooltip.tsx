'use client';

import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import './provenance-tooltip.css';

/* ─────────────────────────────────────────────────────────
 * PROVENANCE TOOLTIP (Kamui 03 §5, the medium demo's #tip) on Base UI Tooltip
 *
 *   rest     the cue, nothing else
 *   380 ms   hovered or focused: the tooltip fades in on settle, 8 above the cue
 *            (34 above a cue that shows its own value chip, so the two never overlap)
 *   edge     near the top of the view it flips below (Base UI collision avoidance)
 *   leave    fades out on settle; moving to the next cue shows it at once
 * The source comes first, then the dimmed detail: "JEV · 0.82", "RULE · DATE PARSER", "YOU".
 * ───────────────────────────────────────────────────────── */

const token = (name: string, fallback: number) => {
  if (typeof window === 'undefined') return fallback;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
};

export interface ProvenanceTooltipProps {
  /** Where the cue came from: "Rule", "Jev", "Region", "Cluster", "Formula", "You". */
  source: string;
  /** The rest, dimmed: ["Date parser"], ["0.82"], ["Done"]. Show the number whenever the app guessed. */
  detail?: string[];
  /** The cue shows its own resolved-value chip on hover: sit above it. */
  clearsChip?: boolean;
  /** The cue element. It must accept a ref and props (a Cue, a span, a button). */
  children: React.ReactElement;
  /** Controlled open state (a docs still, a test). */
  open?: boolean;
}

/** Says where a cue came from, one hover away. Wrap the cue; the tooltip needs no other markup. */
export function ProvenanceTooltip({ source, detail = [], clearsChip, children, open }: ProvenanceTooltipProps) {
  const delay = token('--mu-provenance-delay-ms', 380);
  const offset = token(clearsChip ? '--mu-provenance-chip-offset' : '--mu-provenance-offset', clearsChip ? 34 : 8);
  return (
    <Tooltip.Root open={open}>
      {/* Base UI tooltips are visual; the provenance is also the cue's accessible description. */}
      <Tooltip.Trigger delay={delay} render={children} aria-description={[source, ...detail].join(', ')} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="top" sideOffset={offset} collisionPadding={8}>
          <Tooltip.Popup className="mu-provenance mu-type-readout">
            {source}
            {detail.length > 0 && <span className="mu-provenance-dim"> · {detail.join(' · ')}</span>}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Groups provenance tooltips so moving from one cue to the next shows the next at once. */
export function ProvenanceProvider({ children }: { children: React.ReactNode }) {
  return <Tooltip.Provider delay={token('--mu-provenance-delay-ms', 380)}>{children}</Tooltip.Provider>;
}
