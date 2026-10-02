'use client';

import * as React from 'react';
import { SwapText } from '../../motion/swap';
import { useAwake } from '../../motion/awake';
import { motionReduced } from '../../motion/reduced';
import { Button as BaseButton } from '@base-ui/react/button';

/**
 * Which cap the button wears. `standard` is soft-touch in the colorway,
 * `primary` is the dark cap, and `destructive` is the one red cap. Use at
 * most one primary or destructive cap per group. `link`, `graphite`, `strip`
 * and `strip-danger` set their own size.
 */
export type ButtonCap = 'standard' | 'primary' | 'destructive' | 'link' | 'graphite' | 'strip' | 'strip-danger';

export type ButtonState = 'idle' | 'waiting' | 'done' | 'error';

export interface ButtonProps extends BaseButton.Props {
  cap?: ButtonCap;
  /** default: 32 tall. compact: 26, 12 pt, raise-sm (the canvas pills: "seed a sample day", "lenses ⌘K"). The link, graphite and strip caps set their own size. */
  size?: 'default' | 'compact';
  /**
   * The action's glyph, placed before the label and sized by the cap (16 in a 32 cap, 14 in a
   * compact one; pass it without a size). An action names itself with a glyph and a verb:
   * `<Button icon={<ShareIcon />}>Share</Button>`. A plain choice (Cancel, Done) has none. When
   * the same control changes meaning, pass a `MorphIcon` whose name changes, and turn the label
   * with `SwapText`. The button is the icon's trigger, so it plays its act on hover and press.
   */
  icon?: React.ReactNode;
  /** Irreversible destructive and strip-danger actions only. Hold Space, Enter or pointer for 800ms; false restores ordinary activation. */
  hold?: boolean | number;
  /** The host owns the request and result. Idle and error accept another press; waiting and done refuse it. */
  state?: ButtonState;
  /** Glyph-only key, square at the cap height; keep its spoken verb in aria-label or text children. */
  iconOnly?: boolean;
  waitingLabel?: string;
  doneLabel?: string;
  errorLabel?: string;
  /** Override the shared 400ms delay / 300ms minimum visible wait, in milliseconds. */
  showDelay?: number;
  minVisible?: number;
}

/* Styled with the theme's utilities: the button recipe's sizes, type and layered looks
 * (recipe-button[-<part>][-pressed]). While held it sinks by the recipe's travel in the press time,
 * linear, into its pressed look; it springs back on release. */
const FRAME = 'box-border inline-flex items-center justify-center m-0 border-0 whitespace-nowrap cursor-pointer select-none antialiased tap-highlight-none [&>svg]:flex-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-deep data-disabled:cursor-default data-disabled:opacity-button-disabled';
const PRESS = 'not-data-disabled:active:translate-y-button-travel not-data-disabled:active:duration-button-press not-data-disabled:active:ease-linear';
const REGULAR = 'gap-button-gap h-button-height px-button-pad rounded-pill type-ui transition-button [&>svg]:size-button-glyph';

const CAPS: Record<ButtonCap, string> = {
  standard: `${REGULAR} text-ink recipe-button ${PRESS} not-data-disabled:active:recipe-button-pressed`,
  primary: `${REGULAR} text-button-primary-ink recipe-button-primary ${PRESS} not-data-disabled:active:recipe-button-primary-pressed`,
  destructive: `${REGULAR} text-button-destructive-ink recipe-button-destructive ${PRESS} not-data-disabled:active:recipe-button-destructive-pressed`,
  link: 'gap-button-gap [&>svg]:size-button-compact-glyph h-auto p-0 rounded-none bg-transparent type-button-link text-button-link-ink transition-button',
  graphite: `[&>svg]:size-button-compact-glyph gap-button-gap h-button-graphite-height px-button-graphite-pad rounded-pill type-button-graphite text-button-graphite-ink recipe-button-graphite transition-button ${PRESS}`,
  strip: `[&>svg]:size-button-compact-glyph gap-button-gap h-button-strip-height px-button-strip-pad rounded-button-strip-radius type-button-strip text-button-strip-ink bg-transparent transition-button hover:text-button-strip-ink-hover hover:recipe-button-strip-hover ${PRESS} not-data-disabled:active:recipe-button-strip-pressed focus-visible:outline-none focus-visible:recipe-button-strip-focus`,
  'strip-danger': `[&>svg]:size-button-compact-glyph gap-button-gap h-button-strip-height px-button-strip-pad rounded-button-strip-radius type-button-strip text-button-strip-danger-ink bg-transparent transition-button hover:recipe-button-strip-hover ${PRESS} not-data-disabled:active:recipe-button-strip-pressed focus-visible:outline-none focus-visible:recipe-button-strip-focus`,
};
const COMPACT = `gap-button-compact-gap h-button-compact-height px-button-compact-pad rounded-pill type-button-compact text-ink2 hover:text-ink recipe-button-compact transition-button-compact [&>svg]:size-button-compact-glyph ${PRESS} not-data-disabled:active:recipe-button-compact-pressed`;

/** The cap's frame and regular size without its press, for keys that travel their own way (Toggle). */
export const buttonParts = { FRAME, REGULAR } as const;

/** The utilities for a cap and size: the caps that set their own size ignore `size`. */
export function buttonClasses(cap: ButtonCap = 'standard', size: 'default' | 'compact' = 'default') {
  const compact = size === 'compact' && ['standard', 'primary', 'destructive'].includes(cap);
  if (compact && cap !== 'standard') {
    const dimensions = 'gap-button-compact-gap h-button-compact-height px-button-compact-pad rounded-pill type-button-compact [&>svg]:size-button-compact-glyph transition-button';
    return `${FRAME} ${dimensions} ${cap === 'primary' ? 'text-button-primary-ink recipe-button-primary not-data-disabled:active:recipe-button-primary-pressed' : 'text-button-destructive-ink recipe-button-destructive not-data-disabled:active:recipe-button-destructive-pressed'} ${PRESS}`;
  }
  return `${FRAME} ${compact ? COMPACT : CAPS[cap]}`;
}

/**
 * A press-in pill button. While held it sinks 1px and its shadow
 * collapses into a well; on release it springs back. Its `icon` leads the label, and
 * MetalUI icons inside it play their act from the whole button.
 */
export const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  { cap = 'standard', size = 'default', icon, hold = false, state, waitingLabel = 'Working…', doneLabel = 'Done', errorLabel = 'Try again', iconOnly = false, showDelay, minVisible, className, children, ...props },
  ref,
) {
  const element = React.useRef<HTMLElement>(null);
  React.useImperativeHandle(ref, () => element.current!);
  const face = useButtonFace(state, element, showDelay, minVisible);
  const blocked = state === 'waiting' || state === 'done' || face === 'waiting';
  const fill = React.useRef<HTMLSpanElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const animation = React.useRef<Animation | undefined>(undefined);
  const started = React.useRef(false);
  const confirmed = React.useRef(false);
  const [holding, setHolding] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const hintId = React.useId();
  // One clock drives the informational fill and icon gesture. No frame loop or layout reads.
  const holdEnabled = Boolean(hold) && (cap === 'destructive' || cap === 'strip-danger');
  const notifyIcon = (phase: 'start' | 'cancel' | 'complete', duration?: number) => {
    element.current?.dispatchEvent(new CustomEvent('mu-hold', { detail: { phase, duration } }));
  };
  const cancel = React.useCallback(() => {
    if (!started.current) return;
    clearTimeout(timer.current);
    started.current = false;
    setHolding(false);
    setHint(true);
    const el = fill.current;
    if (el) {
      const current = getComputedStyle(el).transform;
      animation.current?.cancel();
      const css = getComputedStyle(el);
      animation.current = el.animate([{ transform: current }, { transform: 'scaleX(0)' }], {
        duration: parseFloat(css.getPropertyValue('--mu-spring-release-d')) || 178,
        easing: css.getPropertyValue('--mu-spring-release').trim() || 'ease-out',
        fill: 'forwards',
      });
    }
    notifyIcon('cancel');
  }, []);
  const start = () => {
    if (!holdEnabled || props.disabled || blocked || started.current) return;
    confirmed.current = false;
    started.current = true;
    setHolding(true);
    setHint(false);
    const css = getComputedStyle(element.current!);
    const duration = typeof hold === 'number' ? Math.max(0, hold) : parseFloat(css.getPropertyValue('--mu-r-button-hold-duration'));
    if (!Number.isFinite(duration) || duration <= 0) { started.current = false; setHolding(false); setHint(true); return; }
    animation.current?.cancel();
    animation.current = fill.current?.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration, easing: 'linear', fill: 'forwards' });
    notifyIcon('start', duration);
    timer.current = setTimeout(() => {
      if (!started.current) return;
      started.current = false;
      confirmed.current = true;
      setHolding(false);
      if (element.current && !motionReduced(element.current)) {
        element.current.animate([{ transform: 'translateY(calc(-1 * var(--mu-r-button-self-travel)))' }, { transform: 'translateY(0px)' }], { duration: parseFloat(css.getPropertyValue('--mu-spring-object-d')), easing: css.getPropertyValue('--mu-spring-object').trim() });
      }
      notifyIcon('complete');
      element.current?.click();
    }, duration);
  };
  React.useEffect(() => {
    const onHidden = () => { if (document.hidden) cancel(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => { clearTimeout(timer.current); animation.current?.cancel(); document.removeEventListener('visibilitychange', onHidden); };
  }, [cancel]);
  React.useEffect(() => { if (props.disabled || blocked || !holdEnabled) cancel(); }, [props.disabled, blocked, holdEnabled, cancel]);
  const pressed = face === 'waiting' ? cap === 'standard' ? size === 'compact' ? 'recipe-button-compact-pressed' : 'recipe-button-pressed' : cap === 'primary' ? 'recipe-button-primary-pressed' : cap === 'destructive' ? 'recipe-button-destructive-pressed' : '' : '';
  const label = face === 'waiting' ? waitingLabel : face === 'done' ? doneLabel : face === 'error' ? errorLabel : typeof children === 'string' ? children : '';
  const content = state === undefined ? <>{icon}{!iconOnly && children}</> : <>
    <span className={`relative inline-grid flex-none place-items-center ${size === 'compact' || ['link', 'graphite', 'strip', 'strip-danger'].includes(cap) ? 'size-button-compact-glyph [&_svg]:size-button-compact-glyph' : 'size-button-glyph [&_svg]:size-button-glyph'}`}>
      <span className={`col-start-1 row-start-1 inline-flex ${face === 'waiting' ? 'opacity-0' : 'opacity-100'}`}>{icon}</span>
      {face === 'waiting' && <ButtonWaitArc />}
    </span>
    {!iconOnly && <span className="inline-grid place-items-center">
      {[children, waitingLabel, doneLabel, errorLabel].map((value, i) => <span key={i} className="col-start-1 row-start-1 invisible pointer-events-none" aria-hidden>{value}</span>)}
      <span className="col-start-1 row-start-1">{label ? <SwapText value={label} /> : children}</span>
    </span>}
  </>;
  const square = iconOnly ? ['strip', 'strip-danger'].includes(cap) ? 'w-button-strip-height px-0!' : cap === 'graphite' ? 'w-button-graphite-height px-0!' : size === 'compact' ? 'w-button-compact-height px-0!' : 'w-button-height px-0!' : '';
  const own = `mu-button mu-icon-trigger ${buttonClasses(cap, size)} ${square} ${pressed} ${face === 'waiting' ? 'translate-y-button-travel cursor-default' : ''} ${holdEnabled ? `relative overflow-hidden data-holding:translate-y-button-travel ${cap === 'strip-danger' ? 'data-holding:recipe-button-strip-pressed' : 'data-holding:recipe-button-destructive-pressed'} data-holding:duration-button-press data-holding:ease-linear` : ''}`;
  return (
    <>
    <BaseButton
      ref={element}
      data-cap={cap}
      data-size={size}
      data-state={face}
      data-hold={holdEnabled ? '' : undefined}
      data-holding={holding ? '' : undefined}
      className={(state) => {
        const extra = typeof className === 'function' ? className(state) : className;
        return extra ? `${own} ${extra}` : own;
      }}
      {...props}
      aria-label={props['aria-label'] ?? (iconOnly ? label || (typeof children === 'string' ? children : undefined) : undefined)}
      aria-busy={state === 'waiting' || props['aria-busy']}
      aria-disabled={blocked || props['aria-disabled']}
      aria-describedby={holdEnabled ? [props['aria-describedby'], hintId].filter(Boolean).join(' ') : props['aria-describedby']}
      onClick={(event) => {
        if (blocked) { event.preventDefault(); return; }
        if (holdEnabled && !confirmed.current) { event.preventDefault(); setHint(true); return; }
        confirmed.current = false;
        props.onClick?.(event);
      }}
      onPointerDown={(event) => { props.onPointerDown?.(event); if (!event.defaultPrevented && event.button === 0) start(); }}
      onPointerUp={(event) => { props.onPointerUp?.(event); cancel(); }}
      onPointerLeave={(event) => { props.onPointerLeave?.(event); cancel(); }}
      onPointerCancel={(event) => { props.onPointerCancel?.(event); cancel(); }}
      onBlur={(event) => { props.onBlur?.(event); cancel(); }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (blocked && (event.key === ' ' || event.key === 'Enter')) { event.preventDefault(); return; }
        if (holdEnabled && !event.defaultPrevented && (event.key === ' ' || event.key === 'Enter')) { event.preventDefault(); if (!event.repeat) start(); }
        if (event.key === 'Escape') cancel();
      }}
      onKeyUp={(event) => {
        props.onKeyUp?.(event);
        if (holdEnabled && (event.key === ' ' || event.key === 'Enter')) { event.preventDefault(); cancel(); }
      }}
    >
      {holdEnabled ? <>
        <span ref={fill} aria-hidden style={{ transform: 'scaleX(0)' }} className="absolute inset-0 rounded-pill recipe-button-hold origin-left pointer-events-none" />
        <span className={size === 'compact' ? 'relative inline-flex items-center gap-button-compact-gap [&>svg]:size-button-compact-glyph' : 'relative inline-flex items-center gap-button-gap [&>svg]:size-button-glyph'}>{content}</span>
      </> : content}
    </BaseButton>
    {state !== undefined && <span className="sr-only" aria-live="polite">{state === 'waiting' ? waitingLabel : state === 'done' ? doneLabel : state === 'error' ? errorLabel : ''}</span>}
    {holdEnabled && <span id={hintId} className={hint && !iconOnly ? 'basis-full type-doc-caption text-ink2' : 'sr-only'} role="status">Hold to confirm</span>}
    </>
  );
});


// State changes own one delayed clock. A newer request cancels the old result timer.
function useButtonFace(state: ButtonState | undefined, root: React.RefObject<HTMLElement | null>, delay?: number, minimum?: number) {
  const [face, setFace] = React.useState<ButtonState>(state === 'waiting' ? 'idle' : state ?? 'idle');
  const visibleAt = React.useRef<number | undefined>(undefined);
  React.useEffect(() => {
    const css = root.current ? getComputedStyle(root.current) : undefined;
    const timing = (override: number | undefined, key: string, fallback: number) => Math.max(0, override ?? (parseFloat(css?.getPropertyValue(key) ?? '') || fallback));
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (state === 'waiting') {
      if (visibleAt.current === undefined) {
        setFace('idle');
        timer = setTimeout(() => { visibleAt.current = performance.now(); setFace('waiting'); }, timing(delay, '--mu-r-button-waiting-delay', 400));
      }
    } else {
      const remaining = state === 'idle' || state === undefined || visibleAt.current === undefined ? 0 : timing(minimum, '--mu-r-button-waiting-minimum', 300) - (performance.now() - visibleAt.current);
      const finish = () => { visibleAt.current = undefined; setFace(state ?? 'idle'); };
      if (remaining > 0) timer = setTimeout(finish, remaining); else finish();
    }
    return () => clearTimeout(timer);
  }, [state, root, delay, minimum]);
  return face;
}

function ButtonWaitArc() {
  const [ref, awake] = useAwake();
  return <span ref={ref} aria-hidden className="absolute inset-0 spinner-arc" style={{ '--mu-spinner-ink': 'currentColor', animationPlayState: awake ? 'running' : 'paused' } as React.CSSProperties} />;
}
