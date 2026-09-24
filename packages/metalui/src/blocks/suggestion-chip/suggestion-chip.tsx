'use client';

import * as React from 'react';
import { Chip } from '../../components/chip/chip';
import { Label } from '../../components/label/label';
import { IconButton } from '../../components/icon-button/icon-button';
import './suggestion-chip.css';

/* ─────────────────────────────────────────────────────────
 * SUGGESTION CHIP (the reference design's .sugg): a composition
 *   Chip(suggestion) › Chip.Text (the question) + Label(small, the confidence) + Chip.Actions › IconButton(mini) ✓ ×
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
  /** The recognizer's confidence, 0–1, shown as an engraving (hidden confidence is a bug). */
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
    <Chip.Root
      ref={ref}
      variant="suggestion"
      role="group"
      aria-label={`Suggestion: ${label} Confidence ${conf}`}
      data-host-hover={hostHovered ? '' : undefined}
      className={className ? `mu-suggestion ${className}` : 'mu-suggestion'}
      {...props}
    >
      <Chip.Text>{label}</Chip.Text>
      <Label variant="small" aria-hidden className="mu-suggestion-conf">{conf}</Label>
      <Chip.Actions>
        <IconButton variant="mini" accept label="Accept" icon="✓" onClick={onAccept} />
        <IconButton variant="mini" label="Dismiss" icon="×" onClick={onDismiss} />
      </Chip.Actions>
    </Chip.Root>
  );
});
