'use client';
import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { Button as BaseButton } from '@base-ui/react/button';
import { Mark } from '../mark/mark';
import { Popover } from '../popover/popover';
import { Slider } from '../slider/slider';
import { Well } from '../well/well';
import { SwapText } from '../../motion/swap';
import { haptic } from '../../motion/haptic';
import { useReducedMotion } from '../../motion/reduced';

const TURN = 360, CHANNEL = 255, SECTOR = 60;
const FOOTPRINT = '#' + 'F'.repeat(6);
/** Colour math carries no material or timing decisions. Achromatic hue stays undefined. */
function colourCueHSL(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new TypeError('ColourCue needs a full six-digit hex value');
  const rgb = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16) / CHANNEL);
  const [r, g, b] = rgb, hi = Math.max(...rgb), lo = Math.min(...rgb), delta = hi - lo, lightness = (hi + lo) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const hue = delta === 0 ? undefined : ((hi === r ? (g - b) / delta : hi === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * SECTOR + TURN) % TURN;
  return { hue, saturation, lightness };
}
function hueHex(hue: number, saturation: number, lightness: number) {
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation, h = ((hue % TURN) + TURN) % TURN / SECTOR;
  const x = c * (1 - Math.abs(h % 2 - 1)), m = lightness - c / 2;
  const rgb = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  return '#' + rgb.map(v => Math.round((v + m) * CHANNEL).toString(16).padStart(2, '0')).join('').toUpperCase();
}
export interface ColourCueProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseButton>, 'children' | 'value' | 'onChange' | 'render' | 'nativeButton'> {
  value: string;
  label: string;
  onChange?: (hex: string) => void;
  /** Return false when the host source transaction has gone stale. */
  onSourceChange?: (words: string) => boolean | void;
  onBegin?: () => boolean | void;
  onCommit?: () => void;
  onCancel?: (reason: 'escape' | 'external' | 'unmount') => void;
  editing?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  raw?: boolean;
  className?: string;
}
const ROOT = 'mu-colour-cue inline-grid relative align-baseline type-readout text-ink whitespace-nowrap p-0 bg-transparent border-none cursor-pointer focus-visible:focus-ring disabled:opacity-button-disabled';
const CELL = 'col-start-1 row-start-1';
/** A colour Component: the text opens the shared well and hue Slider; the source owns history. */
export const ColourCue = React.forwardRef<HTMLElement, ColourCueProps>(function ColourCue({ value, label, onChange, onSourceChange, onBegin, onCommit, onCancel, editing, readOnly = false, disabled = false, raw = false, className, ...triggerProps }, forwardedRef) {
  const hsl = colourCueHSL(value);
  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  React.useImperativeHandle(forwardedRef, () => anchor!, [anchor]);
  const reduced = useReducedMotion(anchor);
  const active = React.useRef<{ before: string; last: string; saturation: number; lightness: number } | null>(null);
  const pointerHeld = React.useRef(false), stalePointer = React.useRef(false);
  const latest = React.useRef({ onCancel }); latest.current = { onCancel };
  const begin = () => { if (active.current) return true; if (readOnly || disabled || onBegin?.() === false) return false; active.current = { before: value, last: value, saturation: hsl.saturation, lightness: hsl.lightness }; return true; };
  const commit = () => { if (!active.current) return; active.current = null; onCommit?.(); };
  const cancel = () => {
    const held = active.current; if (!held) return;
    active.current = null; stalePointer.current = pointerHeld.current;
    onSourceChange?.(held.before); onChange?.(held.before); onCancel?.('escape');
  };
  React.useEffect(() => {
    if (active.current && (value !== active.current.last || editing === false || disabled || readOnly)) {
      active.current = null; stalePointer.current = pointerHeld.current; onCancel?.('external');
    }
    if (disabled || readOnly) setOpen(false);
  }, [value, editing, disabled, readOnly, onCancel]);
  React.useEffect(() => () => { if (active.current) latest.current.onCancel?.('unmount'); }, []);
  const change = (hue: number, keyboard: boolean) => {
    if (readOnly || disabled || stalePointer.current) return;
    const basis = active.current ?? hsl;
    const next = hueHex(hue, basis.saturation, basis.lightness);
    if (next === value) return;
    if (!begin()) return;
    if (onSourceChange?.(next) === false) { active.current = null; stalePointer.current = pointerHeld.current; onCancel?.('external'); return; }
    onChange?.(next);
    if (active.current) active.current.last = next;
    haptic('detent');
    if (keyboard) commit();
  };
  const instructions = readOnly ? 'Read only' : 'Open colour well; drag hue or use arrow keys';
  const faceProps: React.ComponentPropsWithoutRef<typeof BaseButton> = {
    disabled, 'aria-disabled': readOnly || undefined,
    'aria-label': `${label}, ${value}${readOnly ? ', read only' : ''}`,
    'aria-description': [instructions, triggerProps['aria-description']].filter(Boolean).join('. '),
    className: className ? `${ROOT} ${className}` : ROOT,
  };
  const face = <BaseButton {...mergeProps(triggerProps, faceProps)} ref={setAnchor}>
    <span aria-hidden className={`invisible ${CELL}`}>{FOOTPRINT}</span>
    <Mark kind="hex" meaning="colour" meaningLabel={label} color={value} raw={raw} className={CELL}><SwapText value={value} /></Mark>
  </BaseButton>;
  if (readOnly || disabled) return face;
  return <Popover open={open} onOpenChange={(next, details) => {
    if (!next && details.reason === 'escape-key') cancel();
    else if (!next) commit();
    setOpen(next);
  }}>
    <Popover.Trigger>{face}</Popover.Trigger>
    <Popover.Content data-mu-motion={reduced ? 'reduce' : undefined} aria-label={`${label} colour well`}>
      <Popover.Title>{label}</Popover.Title>
      <Popover.Description>Hue changes keep saturation and lightness. Escape cancels a held scrub.</Popover.Description>
      <Popover.Body>
        <Well variant="field" radius="field" className="mu-stack gap-mu-group p-mu-space-16">
          <Mark kind="hex" meaning="colour" meaningLabel={label} color={value} className="type-readout mt-mu-space-16">{value}</Mark>
          <Slider value={Math.min(hsl.hue ?? 0, TURN - 1)} min={0} max={TURN - 1} step={1} largeStep={15} tone="neutral" aria-label={`${label} hue`} showValue
            format={v => `${Math.round(v)}°`} onPointerDownCapture={event => { if (event.button === 0) { pointerHeld.current = true; stalePointer.current = !begin(); } }}
            onPointerUpCapture={() => { queueMicrotask(() => { commit(); pointerHeld.current = false; stalePointer.current = false; }); }}
            onPointerCancelCapture={() => { cancel(); pointerHeld.current = false; stalePointer.current = false; }}
            onValueChange={(hue, details) => change(hue, details.reason === 'keyboard')}
            onValueCommitted={commit} />
          {hsl.hue === undefined && <span className="type-meta text-ink2">This colour is achromatic; hue alone keeps it unchanged.</span>}
        </Well>
      </Popover.Body>
    </Popover.Content>
  </Popover>;
});
