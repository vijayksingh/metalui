'use client';

import * as React from 'react';
import { Slider } from '@base-ui/react/slider';
import './memory-scrubber.css';

/* ─────────────────────────────────────────────────────────
 * MEMORY SCRUBBER (Kamui 04 §5, the medium demo's #scrub) on Base UI Slider
 *
 *   now       the knob at the right end; the readout says MEMORY · NOW
 *   drag      the knob follows the pointer exactly; within 1 % of now it snaps to now
 *   jump      a click on the track, ← → (an hour), ⇧ ← → (a day): the knob rides the part spring
 *   past      the readout names the moment (MEMORY · TUE 23 SEP · 14:10) and NOW appears
 *   NOW / ⎋   back to the present (⎋ is the host's)
 * The world's past treatment (blocks fading, the sepia) is the host's; this is the control.
 * Reduce Motion: part resolves instant, so a jump lands at once.
 * ───────────────────────────────────────────────────────── */

const cssNumber = (name: string, fallback: number) =>
  typeof window === 'undefined' ? fallback : parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
const WD3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY = 86400000;
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

export interface MemoryScrubberProps {
  /** The first moment (ms): the start of the day of the oldest block. */
  start: number;
  /** Now (ms). */
  end: number;
  /** The viewed moment, or null for now. */
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Moments (ms) with a block or an edit: the tick marks. */
  marks?: number[];
  /** The readout for a past moment: "TUE 23 SEP · 14:10". */
  format?: (t: number) => string;
  /** The clock glyph at 10 before MEMORY, e.g. <ClockIcon size={10} />. */
  glyph?: React.ReactNode;
  className?: string;
}

const defaultFormat = (t: number) => {
  const d = new Date(t);
  return `${WD3[d.getDay()]} ${d.getDate()} ${d.toLocaleString('en', { month: 'short' }).toUpperCase()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Time as a dimension of the surface: drag or step back through what was written. */
export function MemoryScrubber({ start, end, value, onValueChange, marks = [], format = defaultFormat, glyph, className }: MemoryScrubberProps) {
  const span = Math.max(1, end - start);
  const pct = (t: number) => ((t - start) / span) * 100;
  const T = value ?? end;
  const read = value == null ? 'NOW' : format(value);
  const snap = cssNumber('--mu-scrubber-snap', 0.01);
  const days: number[] = [];
  for (let d = startOfDay(start); d <= end; d += DAY) days.push(d);
  const step = Math.ceil(days.length / 6);
  const shown = days.filter((_, i) => i % step === 0 || i === days.length - 1);
  const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

  return (
    <div className={className ? `mu-scrubber ${className}` : 'mu-scrubber'}>
      <div className="mu-scrubber-read">
        <span className="mu-scrubber-label mu-type-label engraved">
          {glyph && <span aria-hidden className="mu-scrubber-glyph">{glyph}</span>}MEMORY · {read}
        </span>
        {value != null && <button type="button" className="mu-scrubber-now mu-type-label" onClick={() => onValueChange(null)}>NOW</button>}
      </div>
      <Slider.Root
        value={T}
        min={start}
        max={end}
        step={cssNumber('--mu-scrubber-step-ms', 3600000)}
        largeStep={cssNumber('--mu-scrubber-large-step-ms', 86400000)}
        onValueChange={(v) => {
          const t = v as number;
          onValueChange(end - t < span * snap ? null : t);
        }}
        className="mu-scrubber-root"
      >
        <Slider.Control className="mu-scrubber-control">
          <Slider.Track className="mu-scrubber-track">
            <Slider.Indicator className="mu-scrubber-fill" />
          </Slider.Track>
          <div className="mu-scrubber-marks" aria-hidden>
            {marks.map((m) => <i key={m} style={{ left: `${pct(m).toFixed(2)}%` }} />)}
          </div>
          <div className="mu-scrubber-days" aria-hidden>
            {shown.map((d) => (
              <span key={d} className="mu-type-label engraved" style={{ left: `${clamp(pct(d + DAY / 2), 4, 96).toFixed(2)}%` }}>
                {startOfDay(end) === d ? 'TODAY' : WD3[new Date(d).getDay()]}
              </span>
            ))}
          </div>
          <Slider.Thumb className="mu-scrubber-knob" aria-label="Scrub through time" getAriaValueText={() => (value == null ? 'Now' : read)} />
        </Slider.Control>
      </Slider.Root>
    </div>
  );
}
