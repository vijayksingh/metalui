'use client';

import * as React from 'react';
import { Progress as BaseProgress } from '@base-ui/react/progress';
import { SwapText } from '../../motion/swap';
import { MorphIcon } from '../../icons/MorphIcon';
import { useReducedMotion } from '../../motion/reduced';

export type ProgressState = 'idle' | 'running' | 'complete' | 'failed' | 'paused' | 'cancelled';
export type ProgressShape = 'bar' | 'slim' | 'ring' | 'segmented' | 'buffered';
interface Context { ratio: number; unknown: boolean; state: ProgressState; shape: ProgressShape; size: 'compact' | 'regular'; segments: number; buffer: number; visible: boolean; reduced: boolean }
const Context = React.createContext<Context | null>(null);
const useProgress = () => { const context = React.useContext(Context); if (!context) throw new Error('Progress parts must be inside Progress'); return context; };
const ROOT = 'mu-progress grid min-w-progress-min-width gap-progress-gap progress-state';
const HEAD = 'mu-progress-head mu-cluster justify-between gap-progress-gap';
const LABEL = 'mu-progress-label type-ui text-ink';
const VALUE = 'mu-progress-value type-meta tabular-nums text-ink2';
const TRACK = 'mu-progress-track relative block h-progress-height rounded-pill overflow-clip recipe-switch';
const FILL = 'mu-progress-fill block h-full rounded-pill recipe-switch-on transition-progress-fill';
export interface ProgressProps extends Omit<BaseProgress.Root.Props, 'className' | 'children'> {
  children?: React.ReactNode;
  label?: React.ReactNode;
  showValue?: boolean;
  completeLabel?: React.ReactNode;
  className?: string;
  state?: ProgressState;
  shape?: ProgressShape;
  size?: 'compact' | 'regular';
  /** Number of known steps, for segmented progress. */
  segments?: number;
  /** Amount available ahead of the primary value. Same units/min/max. */
  buffer?: number;
  detail?: React.ReactNode;
}
function Track() {
  const c = useProgress();
  const paused = !c.visible || c.state !== 'running';
  const draining = c.state === 'cancelled' || c.state === 'idle';
  if (c.shape === 'ring') return <BaseProgress.Track className="mu-progress-track"><svg className="progress-ring" data-size={c.size} aria-hidden>
    <circle cx="50%" cy="50%" r="calc(50% - var(--mu-progress-ring-stroke) / 2)" fill="none" stroke="var(--mu-well-bot)" strokeWidth="var(--mu-progress-ring-stroke)" />
    <circle className={c.unknown ? 'mu-progress-fill progress-ring-wait' : 'mu-progress-fill'} cx="50%" cy="50%" r="calc(50% - var(--mu-progress-ring-stroke) / 2)" fill="none" stroke={c.state === 'failed' ? 'var(--mu-invalid)' : 'var(--mu-green-deep)'} strokeWidth="var(--mu-progress-ring-stroke)" pathLength={100} style={{ rotate: '-90deg', transformOrigin: 'center', transformBox: 'fill-box', strokeDasharray: c.unknown ? 'calc(var(--mu-r-progress-segment-ratio) * 100) 100' : `${c.ratio * 100} 100` }} strokeLinecap="round" data-paused={paused ? '' : undefined} data-reduced={c.reduced ? '' : undefined} />
  </svg></BaseProgress.Track>;
  if (c.shape === 'segmented' && !c.unknown) return <BaseProgress.Track className="mu-progress-track flex gap-mu-space-2">{Array.from({ length: c.segments }, (_, index) => <span key={index} className={`${TRACK} min-w-0 flex-1`}><span className={FILL} style={{ transform: `scaleX(${Math.max(0, Math.min(1, c.ratio * c.segments - index))})` }} data-draining={draining ? '' : undefined} /></span>)}</BaseProgress.Track>;
  return <BaseProgress.Track className={TRACK}>
    {c.shape === 'buffered' && <span aria-hidden className={`${FILL} absolute inset-0`} style={{ opacity: 'var(--mu-r-progress-segment-dim)', transform: `scaleX(${c.buffer})` }} data-draining={draining ? '' : undefined} />}
    <BaseProgress.Indicator className={c.unknown ? `${FILL} progress-segment` : FILL} style={{ width: c.unknown ? undefined : '100%', transform: c.unknown ? undefined : `scaleX(${c.ratio})` }} data-draining={draining ? '' : undefined} data-paused={paused ? '' : undefined} data-reduced={c.reduced ? '' : undefined} />
  </BaseProgress.Track>;
}
function Label({ className, ...props }: BaseProgress.Label.Props & { className?: string }) { return <BaseProgress.Label className={className ? `${LABEL} ${className}` : LABEL} {...props} />; }
function Value({ className, children, ...props }: BaseProgress.Value.Props & { className?: string }) {
  return <BaseProgress.Value className={className ? `${VALUE} ${className}` : VALUE} {...props}>{children ?? ((formatted) => <SwapText value={formatted ?? ''} />)}</BaseProgress.Value>;
}
function Root({ label, showValue, className, children, state: requested, shape = 'bar', size = 'regular', segments = 4, buffer, detail, completeLabel, ...props }: ProgressProps) {
  const [element, setElement] = React.useState<HTMLDivElement | null>(null);
  const reduced = useReducedMotion(element);
  const [visible, setVisible] = React.useState(false);
  const [settled, setSettled] = React.useState(false);
  const minimum = props.min ?? 0, maximum = props.max ?? 100;
  const normalized = props.value == null ? null : Math.max(minimum, Math.min(maximum, props.value));
  const ratio = normalized == null ? 0 : (normalized - minimum) / Math.max(Number.EPSILON, maximum - minimum);
  const state = requested ?? (ratio >= 1 ? 'complete' : 'running');
  React.useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element); return () => observer.disconnect();
  }, [element]);
  React.useEffect(() => {
    if (state !== 'complete' || ratio < 1) { setSettled(false); return; }
    const raw = element ? getComputedStyle(element).getPropertyValue('--mu-spring-settle-d').trim() : '';
    const duration = reduced ? 0 : parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000);
    const timer = setTimeout(() => setSettled(true), Number.isFinite(duration) ? duration : Number());
    return () => clearTimeout(timer);
  }, [state, ratio, element, reduced]);
  const glyph = state === 'failed' ? 'sync-error' : state === 'complete' && settled ? 'check' : state === 'paused' ? 'pause' : state === 'cancelled' ? 'close' : 'document';
  const suffix = state === 'complete' && !settled ? 'finishing' : state;
  const valueText = normalized == null ? `Amount unknown · ${suffix}${typeof detail === 'string' ? ` · ${detail}` : ''}` : `${Math.round(ratio * 100)}% · ${suffix}${typeof detail === 'string' ? ` · ${detail}` : ''}`;
  const displayLabel = settled ? completeLabel ?? label : label;
  const context: Context = { ratio, unknown: normalized === null, state, shape, size, segments: Math.max(1, Math.floor(segments)), buffer: Math.max(ratio, Math.min(1, ((buffer ?? normalized ?? minimum) - minimum) / Math.max(Number.EPSILON, maximum - minimum))), visible, reduced };
  return <Context.Provider value={context}><BaseProgress.Root {...props} value={normalized} ref={setElement} aria-valuetext={props['aria-valuetext'] ?? valueText} aria-busy={state === 'running' || state === 'complete' && !settled || undefined} data-state={state} data-size={size} className={`${ROOT}${shape === 'ring' ? ' min-w-0 w-fit' : ''}${className ? ` ${className}` : ''}`}>
    {children ?? <>{shape !== 'slim' && (label != null || showValue) && <span className={HEAD}>{label != null ? <Label><span className="mu-cluster gap-mu-related"><MorphIcon name={glyph} className="size-button-compact-glyph" /><SwapText value={typeof displayLabel === 'string' ? displayLabel : ''} />{typeof displayLabel !== 'string' && displayLabel}</span></Label> : <span />}{showValue && normalized != null && <Value />}</span>}<Track />{detail != null && shape !== 'slim' && <span className="type-meta tabular-nums text-ink2">{detail}</span>}</>}
  </BaseProgress.Root></Context.Provider>;
}
export const Progress = Object.assign(Root, { Label, Value, Track, Root });
