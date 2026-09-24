'use client';

import * as React from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import { Well } from '../well/well';
import './slider.css';

/* ─────────────────────────────────────────────────────────
 * SLIDER on Base UI Slider
 *
 *   track    a 10 tall well (the track well)
 *   fill     the green intent fill up to the knob
 *   marks    short tick marks along the track (moments, events)
 *   ticks    labelled ticks under the track
 *   knob     a knurled, anodized knob; arrows step, Shift steps large
 *   motion   a jump (a click, a key) rides the part spring; a drag follows the pointer exactly
 * Slots: Slider.Root, Slider.Track, Slider.Marks, Slider.Ticks, Slider.Knob.
 * ───────────────────────────────────────────────────────── */

export interface SliderRootProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  largeStep?: number;
  onValueChange: (value: number) => void;
  className?: string;
  children: React.ReactNode;
}

function Root({ value, min, max, step, largeStep, onValueChange, className, children }: SliderRootProps) {
  return (
    <BaseSlider.Root value={value} min={min} max={max} step={step} largeStep={largeStep} onValueChange={(v) => onValueChange(v as number)} className={className ? `mu-slider ${className}` : 'mu-slider'}>
      <BaseSlider.Control className="mu-slider-control">{children}</BaseSlider.Control>
    </BaseSlider.Root>
  );
}

/** The track well and its fill. */
function Track() {
  return (
    <BaseSlider.Track render={<Well variant="track" radius="pill" />} className="mu-slider-track">
      <BaseSlider.Indicator className="mu-slider-fill" />
    </BaseSlider.Track>
  );
}

/** Tick marks along the track, at fractions 0…1. */
function Marks({ at }: { at: number[] }) {
  return (
    <div className="mu-slider-marks" aria-hidden>
      {at.map((f, i) => (
        <i key={i} style={{ left: `${(f * 100).toFixed(2)}%` }} />
      ))}
    </div>
  );
}

/** Labelled ticks under the track: { at: 0…1, label }. The label is the caller's (a Label). */
function Ticks({ ticks }: { ticks: { at: number; label: React.ReactNode }[] }) {
  return (
    <div className="mu-slider-ticks" aria-hidden>
      {ticks.map((t, i) => (
        <span key={i} style={{ left: `${(t.at * 100).toFixed(2)}%` }}>
          {t.label}
        </span>
      ))}
    </div>
  );
}

function Knob(props: { 'aria-label': string; getAriaValueText?: (formatted: string, value: number, index: number) => string }) {
  return <BaseSlider.Thumb className="mu-slider-knob" {...props} />;
}

export const Slider = Object.assign(Root, { Root, Track, Marks, Ticks, Knob });
