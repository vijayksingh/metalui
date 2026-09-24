'use client';

import * as React from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import { Well } from '../well/well';

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

/* Styled with the theme's utilities (the slider recipe on the track well). The root fills its box and the
 * track sits on the box's centre line; a jump rides the part spring, a drag follows the pointer. */
const ROOT = 'mu-slider group/slider relative w-full h-full touch-none';
const CONTROL = 'mu-slider-control relative w-full h-full touch-none cursor-pointer';
const TRACK = 'mu-slider-track absolute left-0 right-0 slider-track-place';
const FILL = 'mu-slider-fill h-full rounded-pill recipe-slider-fill opacity-slider-fill-opacity transition-slider-fill group-data-dragging/slider:transition-none';
const MARKS = 'mu-slider-marks absolute left-slider-track-inset right-slider-track-inset pointer-events-none slider-marks-place';
const MARK = 'absolute w-slider-mark-w h-slider-mark-h rounded-slider-mark-radius bg-slider-mark-color';
const TICKS = 'mu-slider-ticks absolute left-slider-track-inset right-slider-track-inset pointer-events-none slider-ticks-place';
const TICK = 'absolute -translate-x-1/2 before:absolute before:left-1/2 before:-top-slider-tick-lift before:w-slider-tick-w before:h-slider-tick-h before:bg-slider-tick-color';
const KNOB = 'mu-slider-knob top-1/2 size-slider-knob-size rounded-round cursor-grab recipe-slider-knob transition-slider-knob group-data-dragging/slider:cursor-grabbing group-data-dragging/slider:transition-none has-focus-visible:focus-ring';

function Root({ value, min, max, step, largeStep, onValueChange, className, children }: SliderRootProps) {
  return (
    <BaseSlider.Root value={value} min={min} max={max} step={step} largeStep={largeStep} onValueChange={(v) => onValueChange(v as number)} className={className ? `${ROOT} ${className}` : ROOT}>
      <BaseSlider.Control className={CONTROL}>{children}</BaseSlider.Control>
    </BaseSlider.Root>
  );
}

/** The track well and its fill. */
function Track() {
  return (
    <BaseSlider.Track render={<Well variant="track" radius="pill" />} className={TRACK}>
      <BaseSlider.Indicator className={FILL} />
    </BaseSlider.Track>
  );
}

/** Tick marks along the track, at fractions 0…1. */
function Marks({ at }: { at: number[] }) {
  return (
    <div className={MARKS} aria-hidden>
      {at.map((f, i) => (
        <i key={i} className={MARK} style={{ left: `${(f * 100).toFixed(2)}%` }} />
      ))}
    </div>
  );
}

/** Labelled ticks under the track: { at: 0…1, label }. The label is the caller's (a Label). */
function Ticks({ ticks }: { ticks: { at: number; label: React.ReactNode }[] }) {
  return (
    <div className={TICKS} aria-hidden>
      {ticks.map((t, i) => (
        <span key={i} className={TICK} style={{ left: `${(t.at * 100).toFixed(2)}%` }}>
          {t.label}
        </span>
      ))}
    </div>
  );
}

function Knob(props: { 'aria-label': string; getAriaValueText?: (formatted: string, value: number, index: number) => string }) {
  return <BaseSlider.Thumb className={KNOB} {...props} />;
}

export const Slider = Object.assign(Root, { Root, Track, Marks, Ticks, Knob });
