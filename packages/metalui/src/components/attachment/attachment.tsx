'use client';

import * as React from 'react';
import { Progress as BaseProgress } from '@base-ui/react/progress';
import { IconButton } from '../icon-button/icon-button';
import { Button } from '../button/button';
import { MorphIcon } from '../../icons/MorphIcon';
import { SwapText } from '../../motion/swap';
import { Icon } from '../../icons/Icon';
import { leaveRow } from '../../motion/leave';

/* ─────────────────────────────────────────────────────────
 * ATTACHMENT, a file someone attached, as a small raised plate
 *
 *   rest      its type engraved in a sunk well; its name with the middle cut (the extension stays
 *             readable); a line with its size
 *   arrive    it lands (T5b): from one nest above onto the table on the object spring, with its
 *             small overshoot
 *   upload    a thin track under the name fills with the progress fill on the settle spring; the
 *             line says how far
 *   failed    the line says so in red, with Try again
 *   remove    it leaves as rows do (T9): one nest down, fading, on the release spring, then goes
 * Reduce Motion: it appears and goes at once; the fill still moves.
 * An object: it stands for a person's file. It uses the raised surface, the well and the progress fill.
 * ───────────────────────────────────────────────────────── */

const PLATE = 'mu-attachment relative flex w-full min-w-0 items-center gap-attachment-gap min-h-attachment-height p-attachment-pad rounded-attachment-radius recipe-surface-raise-sm attachment-land reduced-motion:animate-none';
const TYPE = 'mu-attachment-type grid flex-none place-items-center size-attachment-type-size rounded-attachment-type-radius recipe-well-field type-label text-ink2 uppercase';
const BODY = 'mu-attachment-body grid flex-1 min-w-0 gap-attachment-body-gap';
const NAME = 'mu-attachment-name flex min-w-0 type-ui text-ink';
const META = 'mu-attachment-meta flex min-w-0 items-start gap-mu-space-4 type-meta tabular-nums text-ink3 data-failed:text-form-field-error-ink';
const TRACK = 'mu-attachment-track block h-attachment-track-height rounded-pill overflow-hidden recipe-switch';
const FILL = 'block h-full rounded-pill recipe-switch-on transition-progress-fill';

/** "12.4 MB" from bytes. */
export function formatBytes(bytes: number, locale?: string) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes, u = 0;
  while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: n < 10 && u > 0 ? 1 : 0 }).format(n)} ${units[u]}`;
}

export type AttachmentUploadState = 'idle' | 'uploading' | 'complete' | 'error';

export interface AttachmentProps {
  name: string;
  /** Size in bytes. */
  size?: number;
  /** 0–100 while uploading; leave it out once done. */
  progress?: number;
  /** The host owns completion. Omitted: progress/error preserve the legacy uploading/error/idle states. */
  uploadState?: AttachmentUploadState;
  /** The upload failed: say why in a few words ("Too large"). */
  error?: string;
  onRetry?: () => void;
  /** Shows the remove key; called after the file has left. */
  onRemove?: () => void;
  /** Capture neighboring row bounds before the leave starts; called once, including under Reduce Motion. */
  onLeaveStart?: () => void;
  className?: string;
}

/** A file someone attached. (Named Attachment so it never shadows the browser's File.) */
export function Attachment({ name, size, progress, uploadState, error, onRetry, onRemove, onLeaveStart, className }: AttachmentProps) {
  const [leaving, setLeaving] = React.useState(false);
  const plate = React.useRef<HTMLDivElement>(null);
  const cancelLeave = React.useRef<(() => void) | undefined>(undefined);
  React.useEffect(() => () => cancelLeave.current?.(), []);
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const type = ext.slice(1, 5) || 'file';
  const state = uploadState ?? (error ? 'error' : progress != null ? 'uploading' : 'idle');
  const uploading = state === 'uploading';
  const failed = state === 'error';
  const bytes = size != null ? formatBytes(size) : '';
  const amount = progress != null ? Math.min(100, Math.max(0, progress)) : undefined;
  const meta = failed ? error || 'Upload failed' : uploading ? amount != null ? `Uploading · ${Math.round(amount)} %` : 'Uploading' : state === 'complete' ? `Uploaded${bytes ? ` · ${bytes}` : ''}` : bytes;
  const glyph = failed ? 'sync-error' : uploading ? 'upload' : state === 'complete' ? 'check' : 'document';

  const remove = () => {
    cancelLeave.current = leaveRow(plate.current, () => onRemove?.(), {
      onStart: () => { setLeaving(true); onLeaveStart?.(); },
    });
  };

  return (
    <div ref={plate} role="group" aria-label={name} data-upload-state={state} data-leaving={leaving ? '' : undefined} className={className ? `${PLATE} ${className}` : PLATE}>
      <span aria-hidden className={TYPE}>{type}</span>
      <span className={BODY}>
        <span className={NAME} title={name}><span className="truncate">{base}</span><span className="flex-none">{ext}</span></span>
        {uploading && (
          <BaseProgress.Root value={amount ?? null} aria-label={`Uploading ${name}`}>
            <BaseProgress.Track className={TRACK}><BaseProgress.Indicator className={FILL} /></BaseProgress.Track>
          </BaseProgress.Root>
        )}
        <span className={META} data-failed={failed ? '' : undefined} role={failed ? 'alert' : state === 'complete' ? 'status' : undefined} aria-label={meta}>
          <span aria-hidden className="flex-none pointer-events-none"><MorphIcon name={glyph} size={14} /></span>
          <span aria-hidden className="min-w-0 flex-1"><SwapText value={meta} className="max-w-full whitespace-normal [&>.mu-swap-layer]:inline-block [&>.mu-swap-layer]:max-w-full [&>.mu-swap-layer]:whitespace-normal" /></span>
          <span className="sr-only">{meta}</span>
        </span>
        {failed && onRetry && <Button size="compact" icon={<Icon name="retry" />} className="justify-self-start mt-mu-space-4" disabled={leaving} onClick={onRetry}>Try again</Button>}
      </span>
      {onRemove && (
        <IconButton
          variant="mini"
          label={`Remove ${name}`}
          disabled={leaving}
          onClick={remove}
          icon={<Icon name="close" className="size-attachment-remove-glyph" />}
        />
      )}
    </div>
  );
}
