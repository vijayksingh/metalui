'use client';

import * as React from 'react';
import { Button } from '@base-ui/react/button';
import './past-banner.css';

/* ─────────────────────────────────────────────────────────
 * PAST BANNER (Kamui 04 §13)
 *   scrubbed  drops in one nest from above on the surface spring (a crossfade under Reduce Motion)
 *   shows     MEMORY · the moment viewed · Back to Now ⎋
 *   back      the cap presses 1; the host returns to the present and unmounts it
 * The only chrome that changes while in the past. It is a live status, so the moment is announced.
 * ───────────────────────────────────────────────────────── */

export interface PastBannerProps {
  /** The moment viewed, as a person reads it: "viewing Tue 23 Sep · 14:10". */
  moment: string;
  onBack: () => void;
  className?: string;
}

/** Says the canvas is showing the past, and brings it back. Shown only while scrubbed. */
export function PastBanner({ moment, onBack, className }: PastBannerProps) {
  return (
    <div role="status" className={['mu-pastbanner', 'mu-frost-graphite', 'type-ui', className].filter(Boolean).join(' ')}>
      <span className="mu-pastbanner-engrave mu-type-label">MEMORY</span>
      <span>{moment}</span>
      <Button className="mu-pastbanner-back type-ui" onClick={onBack} aria-keyshortcuts="Escape">
        Back to Now <span aria-hidden className="mu-pastbanner-key">⎋</span>
      </Button>
    </div>
  );
}
