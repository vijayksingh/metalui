'use client';

import * as React from 'react';
import { Slider } from '../../components/slider/slider';
import { Label } from '../../components/label/label';
import { Glyph } from '../../components/glyph/glyph';
import { Button } from '../../components/button/button';

/* ─────────────────────────────────────────────────────────
 * TIME SCRUBBER (the reference design's #scrub): a composition
 *   a readout (Label(engraved) with a tiny Glyph, and Button(link) NOW in the past)
 *   over Slider › Track + Marks (moments) + Ticks (days, each a Label(engraved)) + Knob
 *
 *   now       the knob at the right end; the readout says NOW
 *   drag      the knob follows the pointer exactly; within 1 % of now it snaps to now
 *   jump      a click on the track, ← → (an hour), ⇧ ← → (a day): the knob rides the part spring
 *   past      the readout names the moment; NOW returns
 * Scrubbing only looks: it changes nothing.
 * ───────────────────────────────────────────────────────── */

const cssNumber = (name: string, fallback: number) =>
  typeof window === 'undefined' ? fallback : parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
const WD3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY = 86400000;
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/* Layout from the scrubber group: the readout sits over the slider, which fills the 330 × 50 box (its
 * track on the box's centre line). */
const BOX = 'mu-scrubber relative w-scrubber-width h-scrubber-height';
const READ = 'mu-scrubber-read absolute z-1 left-0 top-0 flex items-center gap-scrubber-readout-gap';
const GLYPH = 'mu-scrubber-glyph mr-scrubber-glyph-gap';
const SLIDER = 'mu-scrubber-slider !absolute inset-0';

export interface TimeScrubberProps {
  /** The first moment (ms): the start of the day of the oldest item. */
  start: number;
  /** Now (ms). */
  end: number;
  /** The viewed moment, or null for now. */
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Moments (ms) with an item or an edit: the tick marks. */
  marks?: number[];
  /** The readout for a past moment: "TUE 23 SEP · 14:10". */
  format?: (t: number) => string;
  /** The word before the moment. Default MEMORY. */
  title?: string;
  /** The clock glyph at 10 before the title, e.g. <ClockIcon size={10} />. */
  glyph?: React.ReactNode;
  className?: string;
}

const defaultFormat = (t: number) => {
  const d = new Date(t);
  return `${WD3[d.getDay()]} ${d.getDate()} ${d.toLocaleString('en', { month: 'short' }).toUpperCase()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Time as a dimension of the surface: drag or step back through what was written. */
export function TimeScrubber({ start, end, value, onValueChange, marks = [], format = defaultFormat, title = 'MEMORY', glyph, className }: TimeScrubberProps) {
  const span = Math.max(1, end - start);
  const frac = (t: number) => (t - start) / span;
  const read = value == null ? 'NOW' : format(value);
  const snap = cssNumber('--mu-scrubber-snap', 0.01);
  const days: number[] = [];
  for (let d = startOfDay(start); d <= end; d += DAY) days.push(d);
  const every = Math.ceil(days.length / 6);
  const shown = days.filter((_, i) => i % every === 0 || i === days.length - 1);

  return (
    <div className={className ? `${BOX} ${className}` : BOX}>
      <div className={READ}>
        <Label variant="engraved">
          {glyph && <Glyph size="tiny" tone="inherit" className={GLYPH}>{glyph}</Glyph>}
          {title} · {read}
        </Label>
        {value != null && <Button cap="link" onClick={() => onValueChange(null)}>NOW</Button>}
      </div>
      <Slider.Root
        className={SLIDER}
        value={value ?? end}
        min={start}
        max={end}
        step={cssNumber('--mu-scrubber-step-ms', 3600000)}
        largeStep={cssNumber('--mu-scrubber-large-step-ms', 86400000)}
        onValueChange={(t) => onValueChange(end - t < span * snap ? null : t)}
      >
        <Slider.Track />
        <Slider.Marks at={marks.map(frac)} />
        <Slider.Ticks
          ticks={shown.map((d) => ({
            at: clamp(frac(d + DAY / 2), 0.04, 0.96),
            label: <Label variant="engraved">{startOfDay(end) === d ? 'TODAY' : WD3[new Date(d).getDay()]}</Label>,
          }))}
        />
        <Slider.Knob aria-label="Scrub through time" getAriaValueText={() => (value == null ? 'Now' : read)} />
      </Slider.Root>
    </div>
  );
}

/** The earlier name. */
export const MemoryScrubber = TimeScrubber;
export type MemoryScrubberProps = TimeScrubberProps;
