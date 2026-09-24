'use client';

import * as React from 'react';
import { Button } from '@base-ui/react/button';
import './suggestion-chip.css';

/* ─────────────────────────────────────────────────────────
 * SUGGESTION CHIP (Kamui 03 §4, the medium demo's .sugg)
 *
 *   arrives   on settle, from 3 above and .96 (a footprint, no overshoot)
 *   rest      at .62: the person decides, the chip does not shout
 *   host      the block is hovered, or the chip has focus: 1, on settle
 *   ✓         accept: the host applies it (finishing the block first), undoable
 *   ×         dismiss: stored as a correction, never asked twice
 * At most one chip per block, and only for cues that change behaviour
 * (task, measurement, date, region). Never for a kind or a glyph.
 * ───────────────────────────────────────────────────────── */

export interface SuggestionChipProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The question, as a person would ask it: "Task?", "Date friday?", "Track as sleep?", "Move to Done?". */
  label: string;
  /** The recognizer's confidence, 0–1, shown in the label role (hidden confidence is a bug). */
  confidence: number;
  onAccept: () => void;
  onDismiss: () => void;
  /** Force the hovered-host brightness (the host usually drives it through .mu-icon-trigger:hover). */
  hostHovered?: boolean;
}

/** One question the recognizer asks at middle confidence, beside its block. */
export const SuggestionChip = React.forwardRef<HTMLSpanElement, SuggestionChipProps>(function SuggestionChip(
  { label, confidence, onAccept, onDismiss, hostHovered, className, ...props },
  ref,
) {
  const conf = confidence.toFixed(2);
  return (
    <span
      ref={ref}
      role="group"
      aria-label={`Suggestion: ${label} Confidence ${conf}`}
      data-host-hover={hostHovered ? '' : undefined}
      className={className ? `mu-suggestion type-ui ${className}` : 'mu-suggestion type-ui'}
      {...props}
    >
      {label}
      <span aria-hidden className="mu-suggestion-conf type-label engraved">{conf}</span>
      <Button className="mu-suggestion-btn" data-accept="" aria-label="Accept" onClick={onAccept}>✓</Button>
      <Button className="mu-suggestion-btn" aria-label="Dismiss" onClick={onDismiss}>×</Button>
    </span>
  );
});
