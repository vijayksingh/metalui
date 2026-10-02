'use client';

import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { useIsoLayoutEffect } from '../../motion/layout-effect';
import type { FieldSize } from '../field/field';

/* ─────────────────────────────────────────────────────────
 * TEXTAREA, several lines of text in the field well that grows with what is written
 *
 *   rest      the field well, min rows tall (3), the content type role
 *   focus     the flush green ring
 *   grow      a new line grows the well on the settle spring (no overshoot); deleting shrinks it
 *             the same way; at max rows (8) it stops and scrolls. The text stays pinned to the top.
 *   count     with maxLength, a counter's row grows open below at 80 % (the form error's motion:
 *             settle spring, fading in) and turns red at the limit
 *   refused   typing or pasting past the limit shakes only the counter on the refusal spring
 *             (a nest's reach); the text is left alone and a screen reader hears it once
 *   invalid   a red hairline ring
 *   disabled  40 %
 * Reduce Motion: the height snaps and nothing shakes; the counter still turns red.
 * The height is measured from a hidden mirror of the text, so it can spring between real numbers.
 * ───────────────────────────────────────────────────────── */

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows' | 'size'> {
  /** Regular/compact use Field’s UI type; large retains the content type (default). */
  size?: FieldSize;
  /** Fraction of maxLength before counting: 0 always, 1 only at the limit. Defaults to the local recipe. */
  counterThreshold?: number;
  /** Rows before it starts to grow (3). */
  minRows?: number;
  /** Rows before it stops growing and scrolls (8). */
  maxRows?: number;
  /** Shows the red ring; also sets aria-invalid. */
  invalid?: boolean;
  /** Where the well goes: `className` sits on the well, `style` on the textarea. */
  className?: string;
}

const WELL = 'mu-textarea group/ta relative block box-border rounded-textarea-radius recipe-well-field cursor-text focus-within:focus-ring-flush data-invalid:invalid-ring has-[textarea[data-invalid]]:invalid-ring has-[textarea[data-disabled]]:opacity-textarea-disabled data-disabled:opacity-textarea-disabled data-disabled:cursor-default';
const TEXT = 'px-textarea-pad-x py-textarea-pad-y whitespace-pre-wrap break-words';
const TYPE: Record<FieldSize, string> = { large: 'type-content', regular: 'type-ui', compact: 'type-ui' };
const INPUT = `mu-textarea-input block w-full box-border m-0 border-0 outline-none bg-transparent resize-none ${TEXT} text-field-field-ink caret-field-field-caret placeholder:text-field-field-hint transition-textarea-grow reduced-motion:transition-none disabled:cursor-default`;
const MIRROR = `mu-textarea-mirror invisible absolute inset-x-0 top-0 pointer-events-none ${TEXT}`;
const COUNT_ROW = 'mu-textarea-count-row textarea-count-row';
const COUNT = 'mu-textarea-count pt-textarea-count-gap text-right type-meta tabular-nums text-ink3 data-at-limit:text-red data-refused:textarea-refused';

/* Base UI's field control rendered as a textarea: inside a FormField it takes the label, description,
 * error and the field's states. Typed as the textarea it renders. */
type TextareaControl = React.ForwardRefExoticComponent<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { render: React.ReactElement } & React.RefAttributes<HTMLTextAreaElement>
>;
// Read at render, not at module level: a property read on Base UI's namespace at load time is a side effect to a
// bundler, and would ship Field with every component in the package.
const control = () => BaseField.Control as unknown as TextareaControl;

const readPx = (style: CSSStyleDeclaration, prop: string) => parseFloat(style.getPropertyValue(prop)) || 0;

/** Several lines of text. It grows with what is written, between minRows and maxRows. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = 'large', counterThreshold, 'aria-describedby': description, minRows, maxRows, invalid, maxLength, value, defaultValue, onChange, onKeyDown, onPaste, className, disabled, style, ...props },
  forwardedRef,
) {
  const TextareaControl = control();
  const inner = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(forwardedRef, () => inner.current!);
  const mirror = React.useRef<HTMLDivElement>(null);
  const [text, setText] = React.useState(() => String(value ?? defaultValue ?? ''));
  const [localThreshold, setLocalThreshold] = React.useState(0.8);
  const [height, setHeight] = React.useState<number>();
  const [scrolls, setScrolls] = React.useState(false);
  const [refusals, setRefusals] = React.useState(0);
  const countId = React.useId();
  const current = value !== undefined ? String(value) : text;

  // Fit the well to the mirror, clamped to the rows; the settle spring carries the change.
  const fit = React.useCallback(() => {
    const ta = inner.current, m = mirror.current;
    if (!ta || !m) return;
    const s = getComputedStyle(ta);
    const threshold = parseFloat(s.getPropertyValue('--mu-r-textarea-count-show'));
    setLocalThreshold(Number.isFinite(threshold) ? threshold : 0.8);
    const line = parseFloat(s.lineHeight) || readPx(s, '--mu-r-textarea-self-line');
    const pad = parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
    const lo = (minRows ?? readPx(s, '--mu-r-textarea-self-min-rows')) * line + pad;
    const hi = (maxRows ?? readPx(s, '--mu-r-textarea-self-max-rows')) * line + pad;
    const natural = m.offsetHeight;
    setHeight(Math.min(hi, Math.max(lo, natural)));
    setScrolls(natural > hi);
  }, [minRows, maxRows]);

  useIsoLayoutEffect(fit, [fit, current, size]);
  React.useEffect(() => {
    const m = mirror.current;
    if (!m || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(m);
    return () => ro.disconnect();
  }, [fit]);

  const room = maxLength != null ? maxLength - current.length : Infinity;
  const showCount = maxLength != null && current.length >= maxLength * Math.max(0, Math.min(1, counterThreshold ?? localThreshold));
  const atLimit = maxLength != null && room <= 0;

  return (
    <div className="mu-textarea-slot block">
      <label className={className ? `${WELL} ${className}` : WELL} data-size={size} data-invalid={invalid ? '' : undefined} data-disabled={disabled ? '' : undefined}>
        <TextareaControl
          render={<textarea />}
          ref={inner}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          rows={1}
          aria-describedby={[description, showCount ? countId : undefined].filter(Boolean).join(' ') || undefined}
          className={`${INPUT} ${TYPE[size]}`}
          style={{ height, overflowY: scrolls ? 'auto' : 'hidden', ...style }}
          onChange={(e) => {
            if (value === undefined) setText(e.target.value);
            onChange?.(e);
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (maxLength == null || e.metaKey || e.ctrlKey || e.altKey) return;
            const printable = e.key.length === 1 || e.key === 'Enter';
            const ta = e.currentTarget;
            if (printable && room + (ta.selectionEnd - ta.selectionStart) <= 0) setRefusals((n) => n + 1);
          }}
          onPaste={(e) => {
            onPaste?.(e);
            if (maxLength == null) return;
            const ta = e.currentTarget;
            const selected = ta.selectionEnd - ta.selectionStart;
            if (e.clipboardData.getData('text').length > room + selected) setRefusals((n) => n + 1);
          }}
          {...props}
        />
        <div ref={mirror} aria-hidden className={`${MIRROR} ${TYPE[size]}`}>{current + '​'}</div>
      </label>
      {maxLength != null && (
        <div className={COUNT_ROW} data-shown={showCount ? '' : undefined}>
          {/* The row collapses to nothing; the counter keeps its own spacing inside. */}
          <div>
            <div
              key={refusals}
              id={countId}
              className={COUNT}
              data-at-limit={atLimit ? '' : undefined}
              data-refused={refusals > 0 ? '' : undefined}
            >
              {current.length}/{maxLength}
              <span className="sr-only" aria-live="polite">{refusals > 0 && atLimit ? `Limit reached, ${maxLength} characters` : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

