'use client';

import * as React from 'react';
import { Surface } from '../../components/surface/surface';
import { Label } from '../../components/label/label';
import { Button } from '../../components/button/button';
import { Kbd } from '../../components/kbd/kbd';

/* ─────────────────────────────────────────────────────────
 * PAST BANNER (the reference design's #pastBanner): a composition
 *   Surface(graphite-plain, pill) › Label(dark) MEMORY + Label(on-graphite) the moment + Button(graphite) Back to Now + Kbd ⎋
 *
 *   scrubbed  drops in one nest from above on the surface spring (a crossfade under Reduce Motion)
 *   back      the cap presses; the host returns to the present and unmounts it
 * The only chrome that changes while in the past. It is a live status, so the moment is announced.
 * ───────────────────────────────────────────────────────── */

/* Layout from the pastbanner group; it drops one nest from above on the surface spring. The key sits
 * the group's key gap after Back to Now (important: it overrides the cap's own gap). */
const BANNER = 'mu-pastbanner inline-flex items-center gap-pastbanner-gap h-pastbanner-height pl-pastbanner-pad-start pr-pastbanner-pad-end whitespace-nowrap animate-pastbanner-in';
const BACK = 'mu-pastbanner-back !gap-pastbanner-key-gap';

export interface PastBannerProps {
  /** The moment viewed, as a person reads it: "viewing Tue 23 Sep · 14:10". */
  moment: string;
  onBack: () => void;
  className?: string;
}

/** Says the canvas is showing the past, and brings it back. Shown only while scrubbed. */
export function PastBanner({ moment, onBack, className }: PastBannerProps) {
  return (
    <Surface material="graphite-plain" radius="pill" role="status" className={className ? `${BANNER} ${className}` : BANNER}>
      <Label variant="dark">MEMORY</Label>
      <Label variant="on-graphite">{moment}</Label>
      <Button cap="graphite" className={BACK} onClick={onBack} aria-keyshortcuts="Escape">
        Back to Now <Kbd aria-hidden>⎋</Kbd>
      </Button>
    </Surface>
  );
}
