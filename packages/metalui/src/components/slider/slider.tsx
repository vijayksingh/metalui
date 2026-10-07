'use client';

import * as React from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import { DirectionProvider, useDirection } from '@base-ui/react/direction-provider';
import { Well } from '../well/well';
import { SwapText } from '../../motion/swap';
import { refuse } from '../../motion/refuse';
import { haptic } from '../../motion/haptic';
import { useReducedMotion } from '../../motion/reduced';
import type { IconProps } from '../../icons/Icon';

export type SliderSize = 'compact' | 'regular' | 'large';
type Amount = number | readonly number[];
export interface SliderRootProps<T extends Amount = number> extends Omit<BaseSlider.Root.Props<T>, 'className' | 'children' | 'format' | 'onValueChange'> {
  onValueChange?: (value: T, details: BaseSlider.Root.ChangeEventDetails) => void;
  size?: SliderSize;
  width?: number | string;
  /** Give a vertical host a height; horizontal controls keep their recipe height. */
  height?: number | string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  knobIcon?: React.ReactNode;
  showValue?: boolean;
  valueBubble?: boolean;
  format?: (value: number) => string;
  marks?: number[];
  ticks?: { value: number; label: React.ReactNode }[];
  /** Fill from the midpoint instead of the start; applies to a single knob. */
  centered?: boolean;
  tone?: 'green' | 'neutral';
  /** One haptic catch per accepted stepped value; no haptic on mount. */
  detents?: boolean;
  /** Each range knob keeps its name and independent disabled state. */
  thumbs?: { label?: string; disabled?: boolean }[];
  'aria-label'?: string;
  className?: string;
  children?: React.ReactNode;
}
interface Geometry { width: number; height: number; knob: number }
interface Context {
  values: readonly number[]; fraction: (v: number) => number; geometry: Geometry;
  orientation: 'horizontal' | 'vertical'; rtl: boolean; centered: boolean;
  format: (v: number) => string; bubble: boolean; knobIcon?: React.ReactNode;
  label: string; disabled?: boolean; thumbs?: SliderRootProps['thumbs'];
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
}
const SliderContext = React.createContext<Context | null>(null);
function useSlider() { const c = React.useContext(SliderContext); if (!c) throw new Error('Slider parts must be inside Slider'); return c; }
const ROOT = 'mu-slider group/slider relative flex items-center w-full max-w-full h-full slider-gap type-meta touch-none data-disabled:opacity-slider-disabled data-disabled:pointer-events-none slider-layout';
const SIZES: Record<SliderSize, string> = { compact: 'slider-compact', regular: 'slider-regular', large: 'slider-large' };
const CONTROL = 'mu-slider-control group/control relative flex-1 self-stretch min-w-0 slider-control-box touch-none cursor-pointer';
const GLYPH = 'mu-slider-icon mu-icon-trigger inline-grid flex-none place-items-center text-ink2 [&>svg]:slider-glyph';
const TRACK = 'mu-slider-track absolute left-0 right-0 slider-track-place';
const FILL = 'mu-slider-fill rounded-pill recipe-slider-fill slider-position';
const KNOB = 'mu-slider-knob group/knob slider-knob-box rounded-round cursor-grab slider-position data-thumb-disabled:opacity-slider-disabled data-thumb-disabled:cursor-default group-data-dragging/slider:cursor-grabbing has-focus-visible:focus-ring';
const FACE = 'mu-slider-knob-face grid place-items-center [&>svg]:slider-glyph pointer-events-none absolute inset-0 rounded-round recipe-slider-knob slider-knob-origin transition-slider-knob group-pointer-hover/control:slider-knob-lift group-pointer-hover/control:recipe-slider-knob-hover group-active/control:slider-knob-press! group-active/control:recipe-slider-knob-press! group-data-dragging/slider:slider-knob-press! group-data-dragging/slider:recipe-slider-knob-press! group-data-thumb-disabled/knob:scale-100! group-data-thumb-disabled/knob:recipe-slider-knob!';
const BUBBLE = 'mu-slider-bubble absolute pointer-events-none whitespace-nowrap rounded-tooltip-radius px-tooltip-pad-x py-tooltip-pad-y type-meta tabular-nums text-tooltip-ink recipe-tooltip slider-bubble';
const MEASURE_ALL = 24;

function glyph(node: React.ReactNode, sequence: number) {
  return React.isValidElement(node) && typeof node.type !== 'string' ? React.cloneElement(node as React.ReactElement<IconProps>, { act: sequence }) : node;
}
function Root<T extends Amount = number>({ value, defaultValue, min = 0, max = 100, step = 1, largeStep = 10, onValueChange, size = 'regular', width, height, orientation = 'horizontal', startIcon, endIcon, knobIcon, showValue, valueBubble = false, format = String, marks, ticks, centered = false, tone = 'green', detents = false, thumbs, 'aria-label': label = 'Value', disabled, className, children, style: ownStyle, ...props }: SliderRootProps<T>) {
  const [internal, setInternal] = React.useState<T>(() => defaultValue ?? min as T);
  const amount = value ?? internal;
  const values: readonly number[] = Array.isArray(amount) ? amount : [amount as number];
  const fraction = (v: number) => Math.max(0, Math.min(1, (v - min) / Math.max(Number.EPSILON, max - min)));
  const inheritedDirection = useDirection();
  const direction = props.dir === 'rtl' || props.dir === 'ltr' ? props.dir : inheritedDirection;
  const rtl = direction === 'rtl';
  const [control, setControl] = React.useState<HTMLDivElement | null>(null);
  const [geometry, setGeometry] = React.useState<Geometry>({ width: 0, height: 0, knob: 0 });
  const reduced = useReducedMotion(control);
  const [acts, setActs] = React.useState({ start: 0, end: 0 });
  const previous = React.useRef(values);
  React.useEffect(() => {
    const before = previous.current;
    if (!disabled && before.some((v, i) => v !== values[i])) {
      setActs(a => ({ start: a.start + (values[0] === min && before[0] !== min ? 1 : 0), end: a.end + (values.at(-1) === max && before.at(-1) !== max ? 1 : 0) }));
    }
    previous.current = values;
  }, [amount, min, max, disabled]); // Values are a projection of the accepted host amount.
  React.useLayoutEffect(() => {
    if (!control) return;
    // The control's own layout size, never its screen box: in a scaled or turned host (a docs model, a
    // zoomed preview) the screen box is not the travel. The observer reports the exact border box.
    const read = (width: number, height: number) => {
      const knob = parseFloat(getComputedStyle(control).getPropertyValue('--mu-slider-knob'));
      setGeometry(old => old.width === width && old.height === height && old.knob === knob ? old : { width, height, knob });
    };
    read(control.offsetWidth, control.offsetHeight);
    const observer = new ResizeObserver(([entry]) => { const box = entry?.borderBoxSize?.[0]; if (box) read(box.inlineSize, box.blockSize); else read(control.offsetWidth, control.offsetHeight); });
    observer.observe(control); return () => observer.disconnect();
  }, [control, size, orientation]);
  const pointer = React.useRef<{ id: number; side: number } | null>(null);
  React.useEffect(() => {
    if (!control) return;
    const move = (e: PointerEvent) => {
      if (!pointer.current || e.pointerId !== pointer.current.id || disabled) return;
      const box = control.getBoundingClientRect();
      const coordinate = orientation === 'vertical' ? e.clientY : e.clientX;
      const near = orientation === 'vertical' ? box.top : box.left, far = orientation === 'vertical' ? box.bottom : box.right;
      const side = coordinate < near ? -1 : coordinate > far ? 1 : 0;
      if (side && pointer.current.side !== side) { haptic('refusal'); refuse(control, side as 1 | -1, orientation === 'vertical' ? 'y' : 'x'); }
      pointer.current.side = side;
    };
    const release = () => { pointer.current = null; };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release); };
  }, [control, disabled, orientation]);
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (disabled || thumbs?.[index]?.disabled) return;
    const reverse = orientation === 'horizontal' && rtl;
    const increase = (reverse && e.key === 'ArrowLeft') || (!reverse && e.key === 'ArrowRight') || ['ArrowUp', 'PageUp', 'End'].includes(e.key);
    const decrease = (reverse && e.key === 'ArrowRight') || (!reverse && e.key === 'ArrowLeft') || ['ArrowDown', 'PageDown', 'Home'].includes(e.key);
    const gap = (props.minStepsBetweenValues ?? 0) * step;
    const ceiling = values[index + 1] == null ? max : values[index + 1] - gap;
    const floor = values[index - 1] == null ? min : values[index - 1] + gap;
    if (increase && values[index] >= ceiling || decrease && values[index] <= floor) {
      const direction = increase ? 1 : -1;
      haptic('refusal');
      refuse(control, (orientation === 'vertical' || rtl ? -direction : direction) as 1 | -1, orientation === 'vertical' ? 'y' : 'x');
    }
  };
  const context: Context = { values, fraction, geometry, orientation, rtl, centered, format, bubble: valueBubble, knobIcon, label, disabled, thumbs, onKeyDown };
  return <DirectionProvider direction={direction}><BaseSlider.Root {...props} thumbAlignment="edge" dir={direction} orientation={orientation} style={{ ...ownStyle, ...(width !== undefined ? { width } : null), ...(height !== undefined ? { height } : null) }} data-size={size} data-tone={tone} data-reduced={reduced ? '' : undefined} disabled={disabled} value={amount} min={min} max={max} step={step} largeStep={largeStep} onValueChange={(v, details) => { const next = v as T; if (detents && !disabled) haptic('detent'); if (value === undefined) setInternal(next); onValueChange?.(next, details); }} className={[ROOT, SIZES[size], ticks?.length ? 'slider-ticks-room' : '', className].filter(Boolean).join(' ')}>
    {startIcon && <span className={GLYPH} data-disabled={disabled ? '' : undefined} data-end="start" aria-hidden>{glyph(startIcon, acts.start)}</span>}
    <BaseSlider.Control ref={setControl} className={CONTROL} onPointerDown={e => { if (!disabled && !e.defaultPrevented && !(e.target as Element).closest('[data-thumb-disabled]') && values.some((_, i) => !thumbs?.[i]?.disabled)) pointer.current = { id: e.pointerId, side: 0 }; }}>
      <SliderContext.Provider value={context}>{children ?? <><Track />{marks?.length ? <Marks at={marks.map(fraction)} /> : null}{ticks?.length ? <Ticks ticks={ticks.map(t => ({ at: fraction(t.value), label: t.label }))} /> : null}{values.map((_, index) => <Knob key={index} index={index} aria-label={thumbs?.[index]?.label ?? (values.length > 1 ? `${label}, ${index === 0 ? 'lower' : 'upper'}` : label)} disabled={thumbs?.[index]?.disabled} getAriaValueText={(_, v) => format(v)} />)}</>}</SliderContext.Provider>
    </BaseSlider.Control>
    {endIcon && <span className={GLYPH} data-disabled={disabled ? '' : undefined} data-end="end" aria-hidden>{glyph(endIcon, acts.end)}</span>}
    {showValue && <Value values={values} min={min} max={max} step={step} format={format} />}
  </BaseSlider.Root></DirectionProvider>;
}
function Value({ values, min, max, step, format }: { values: readonly number[]; min: number; max: number; step: number; format: (v: number) => string }) {
  const count = step > 0 ? Math.floor((max - min) / step) : 0;
  const sizes = count > 0 && count <= MEASURE_ALL ? Array.from({ length: count + 1 }, (_, i) => min + i * step) : [min, (min + max) / 2, max];
  return <span className="mu-slider-value inline-grid flex-none justify-items-end type-figure tabular-nums text-ink" aria-hidden>{sizes.map(v => <span key={v} className="col-start-1 row-start-1 invisible">{Array(values.length).fill(format(v)).join(' – ')}</span>)}<SwapText className="col-start-1 row-start-1" value={values.map(format).join(' – ')} /></span>;
}
function Track() {
  const c = useSlider();
  const vertical = c.orientation === 'vertical';
  const extent = vertical ? c.geometry.height : c.geometry.width;
  const travel = Math.max(0, extent - c.geometry.knob);
  const coordinate = (v: number) => {
    const point = c.geometry.knob / 2 + c.fraction(v) * travel;
    return vertical || c.rtl ? extent - point : point;
  };
  const from = c.values.length > 1 ? coordinate(c.values[0]) : c.centered ? extent / 2 : vertical || c.rtl ? extent : 0;
  const to = coordinate(c.values.at(-1)!);
  const start = Math.min(from, to), scale = Math.abs(to - from) / Math.max(Number.EPSILON, extent);
  const transform = vertical ? `translateY(${start}px) scaleY(${scale})` : `translateX(${start}px) scaleX(${scale})`;
  return <BaseSlider.Track render={<Well variant="track" radius="pill" />} className={TRACK}><BaseSlider.Indicator className={FILL} style={{ inset: 0, width: '100%', height: '100%', transform, transformOrigin: vertical ? 'top' : 'left' }} /></BaseSlider.Track>;
}
function Marks({ at }: { at: number[] }) {
  const c = useSlider();
  return <div className="mu-slider-marks absolute slider-travel pointer-events-none slider-marks-place" aria-hidden>{at.map((f, index) => <i key={index} className="absolute h-full w-slider-mark-w -translate-x-1/2 rounded-slider-mark-radius bg-slider-mark-color mu-slider-mark" style={c.orientation === 'vertical' ? { bottom: `${f * 100}%` } : c.rtl ? { right: `${f * 100}%` } : { left: `${f * 100}%` }} />)}</div>;
}
function Ticks({ ticks }: { ticks: { at: number; label: React.ReactNode }[] }) {
  const c = useSlider();
  return <div className="mu-slider-ticks absolute slider-travel pointer-events-none slider-ticks-place" aria-hidden>{ticks.map((t, index) => <span key={index} className="absolute flex -translate-x-1/2 flex-col items-center gap-slider-tick-gap type-meta text-ink2 whitespace-nowrap mu-slider-tick" style={c.orientation === 'vertical' ? { bottom: `${t.at * 100}%` } : c.rtl ? { right: `${t.at * 100}%` } : { left: `${t.at * 100}%` }}><i className="block w-slider-tick-w h-slider-tick-h bg-slider-tick-color" />{t.label}</span>)}</div>;
}
function Knob({ index = 0, className, style, onKeyDown, ...props }: BaseSlider.Thumb.Props) {
  const c = useSlider();
  const at = c.fraction(c.values[index] ?? c.values[0]);
  const vertical = c.orientation === 'vertical';
  const extent = vertical ? c.geometry.height : c.geometry.width;
  const offset = ((vertical || c.rtl ? 1 - at : at) - .5) * Math.max(0, extent - c.geometry.knob);
  const transform = vertical ? `translate(-50%, calc(-50% + ${offset}px))` : `translate(calc(-50% + ${offset}px), -50%)`;
  return <BaseSlider.Thumb {...props} data-thumb-disabled={props.disabled ? '' : undefined} index={index} className={`${KNOB}${className ? ` ${className}` : ''}`} style={{ ...style, left: '50%', right: 'auto', top: '50%', bottom: 'auto', translate: 'none', transform, '--mu-slider-at': at } as React.CSSProperties} onKeyDown={e => { c.onKeyDown(e, index); onKeyDown?.(e); }}>
    <span className={`${FACE} text-ink`} data-mu-colorway="bone" aria-hidden>{c.knobIcon}</span>
    {c.bubble && <span className={BUBBLE} aria-hidden><SwapText value={c.format(c.values[index])} /></span>}
  </BaseSlider.Thumb>;
}
export const Slider = Object.assign(Root, { Root, Track, Marks, Ticks, Knob, });
