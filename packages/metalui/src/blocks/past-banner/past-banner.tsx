'use client';

import * as React from 'react';
import { Surface } from '../../components/surface/surface';
import { Label } from '../../components/label/label';
import { Button } from '../../components/button/button';
import { Kbd } from '../../components/kbd/kbd';
import './past-banner.css';

/* ─────────────────────────────────────────────────────────
 * PAST BANNER (the reference design's #pastBanner): a composition
 *   Surface(graphite-plain, pill) › Label(dark) MEMORY + Label(on-graphite) the moment + Button(graphite) Back to Now + Kbd ⎋
 *
 *   scrubbed  drops in one nest from above on the surface spring (a crossfade under Reduce Motion)
 *   back      the cap presses; the host returns to the present and unmounts it
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
    <Surface material="graphite-plain" radius="pill" role="status" className={className ? `mu-pastbanner ${className}` : 'mu-pastbanner'}>
      <Label variant="dark">MEMORY</Label>
      <Label variant="on-graphite">{moment}</Label>
      <Button cap="graphite" className="mu-pastbanner-back" onClick={onBack} aria-keyshortcuts="Escape">
        Back to Now <Kbd aria-hidden>⎋</Kbd>
      </Button>
    </Surface>
  );
}
