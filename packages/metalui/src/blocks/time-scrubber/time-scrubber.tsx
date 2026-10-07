'use client';

import * as React from 'react';
import { Icon } from '../../icons/Icon';
import { Slider } from '../../components/slider/slider';
import { Label } from '../../components/label/label';
import { Glyph } from '../../components/glyph/glyph';
import { Button } from '../../components/button/button';
import { Dial } from '../../components/dial/dial';

/* ─────────────────────────────────────────────────────────
 * TIME SCRUBBER (the reference design's #scrub): a composition
 *   a readout (Label(engraved) with a tiny Glyph, and Button(link) NOW in the past)
 *   over Slider › Track + Marks (moments) + Ticks (days, each a Label(engraved)) + Knob
 *
 *   now       the knob at the right end; the readout says NOW
 *   drag      the knob follows the pointer exactly; within 1 % of now it snaps to now
 *   jump      a click on the track, ← → (an hour), ⇧ ← → (a day): the knob rides the part spring
 *   past      the readout names the moment; NOW returns
 *   dial      where room is short the track winds into a Dial (oldest at seven, now at five) and
 *             the knob grows into its disc: turn it anticlockwise to go back. The readout stands
 *             beside the knob, or above it where even that is short. Given room again it unwinds
 *             into the bar (the one track, on the surface spring) and the bar takes over
 * Scrubbing only looks: it changes nothing.
 * ───────────────────────────────────────────────────────── */

const cssNumber = (name: string, fallback: number) =>
  typeof window === 'undefined' ? fallback : parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
const WD3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY = 86400000;
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/* Layout from the scrubber group: the readout sits over the slider, which fills the box (its track on
 * the box's centre line). The box fills its slot up to 330 wide and narrows with it: days and moments
 * sit at fractions of the track. */
const BOX = 'mu-scrubber relative w-full min-w-0 max-w-scrubber-width h-scrubber-height';
const READ = 'mu-scrubber-read pointer-events-none absolute z-1 left-0 top-0 flex items-center gap-scrubber-readout-gap';
const GLYPH = 'mu-scrubber-glyph mr-scrubber-glyph-gap';
const SLIDER = 'mu-scrubber-slider !absolute inset-0';
const COIL = 'mu-scrubber mu-scrubber-coil relative flex flex-wrap-reverse items-center gap-scrubber-readout-gap min-w-0 max-w-full';
const COIL_READ = 'mu-scrubber-coil-read grid animate-sf-fade';

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
  /** bar: the straight scrubber. dial: wound into a ring where room is short; changing it winds or unwinds. */
  shape?: 'bar' | 'dial';
}

const defaultFormat = (t: number) => {
  const d = new Date(t);
  return `${WD3[d.getDay()]} ${d.getDate()} ${d.toLocaleString('en', { month: 'short' }).toUpperCase()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Time as a dimension of the surface: drag or step back through what was written. */
export function TimeScrubber({ shape = 'bar', className, ...props }: TimeScrubberProps) {
  const first = React.useRef(true);
  const [wound, setWound] = React.useState(shape === 'dial');
  const [from, setFrom] = React.useState<number | undefined>(undefined);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (shape === 'dial' && !wound) { setFrom(0); setWound(true); }
  }, [shape, wound]);
  if (!wound) return <Scrubber {...props} className={className} />;
  return (
    <Coil
      {...props}
      className={className}
      curl={shape === 'dial' ? 1 : 0}
      initialCurl={from}
      onCurlRest={(c) => { if (c === 0) { setWound(false); setFrom(undefined); } }}
    />
  );
}

/** The scrubber wound into a Dial: the same moments and days, the readout in the ring. */
function Coil({ start, end, value, onValueChange, marks = [], format = defaultFormat, title = 'MEMORY', className, curl, initialCurl, onCurlRest }: Omit<TimeScrubberProps, 'shape'> & { curl: number; initialCurl?: number; onCurlRest: (curl: number) => void }) {
  const span = Math.max(1, end - start);
  const frac = (t: number) => (t - start) / span;
  const read = value == null ? 'NOW' : format(value);
  const snap = cssNumber('--mu-scrubber-snap', 0.01);
  const days: number[] = [];
  for (let d = startOfDay(start); d <= end; d += DAY) days.push(d);
  const bar = cssNumber('--mu-scrubber-width', 330) - cssNumber('--mu-r-dial-self-knob', 22);
  return (
    <div className={className ? `${COIL} ${className}` : COIL}>
    <Dial
      value={value ?? end}
      min={start}
      max={end}
      step={cssNumber('--mu-scrubber-step-ms', 3600000)}
      largeStep={cssNumber('--mu-scrubber-large-step-ms', 86400000)}
      onValueChange={(t) => onValueChange(end - t < span * snap ? null : t)}
      curl={curl}
      initialCurl={initialCurl}
      onCurlRest={onCurlRest}
      barLength={bar}
      marks={marks.map(frac)}
      ticks={days.map((d) => ({ at: clamp(frac(d + DAY / 2), 0.04, 0.96), label: <Label variant="engraved">{startOfDay(end) === d ? 'TODAY' : WD3[new Date(d).getDay()]}</Label> }))}
      aria-label="Scrub through time"
      aria-valuetext={value == null ? 'Now' : read}
    />
      <span className={COIL_READ} aria-hidden>
        <Label variant="small">{title}</Label>
        {read.split(' · ').map((line) => <Label key={line} variant="engraved">{line}</Label>)}
      </span>
    </div>
  );
}

function Scrubber({ start, end, value, onValueChange, marks = [], format = defaultFormat, title = 'MEMORY', glyph, className }: Omit<TimeScrubberProps, 'shape'>) {
  const span = Math.max(1, end - start);
  const frac = (t: number) => (t - start) / span;
  const read = value == null ? 'NOW' : format(value);
  const snap = cssNumber('--mu-scrubber-snap', 0.01);
  const days: number[] = [];
  for (let d = startOfDay(start); d <= end; d += DAY) days.push(d);
  const every = Math.ceil(days.length / 6);
  const today = startOfDay(end);
  const earlier = days.filter((d) => d !== today);
  // At Now the knob is the today mark (a TODAY label would sit under it); one earlier day is only
  // the range's margin, not history, so a new surface shows no lone weekday.
  const shown = days
    .filter((_, i) => i % every === 0 || i === days.length - 1)
    .filter((d) => (d === today ? value != null : earlier.length >= 2 || value != null));

  return (
    <div className={className ? `${BOX} ${className}` : BOX}>
      <div className={READ}>
        <Label variant="engraved">
          {glyph && <Glyph size="tiny" tone="inherit" className={GLYPH}>{glyph}</Glyph>}
          {title} · {read}
        </Label>
        {value != null && <Button cap="link" icon={<Icon name="clock" />} className="pointer-events-auto" onClick={() => onValueChange(null)}>NOW</Button>}
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
