'use client';

import * as React from 'react';
import { SwapText } from '../../motion/swap';
import { refuse } from '../../motion/refuse';

/* ─────────────────────────────────────────────────────────
 * DROP ZONE, a place that receives files
 *
 *   rest      a sunk tray: a glyph in a small well, "Drop files here", what it takes, "or choose
 *             files"; the tray is the label of a real file input, so a click, Space or Enter picks
 *   armed     files dragged anywhere in the window: the edge lights faintly green (settle spring),
 *             so the eye finds where to drop
 *   over      files over the tray: the edge lights fully, the tray sinks a touch and the glyph rises
 *             one step (part spring); the line turns "Let go to attach" on the drum
 *   refused   over it with a file it won't take: the edge in the invalid ink, the line says so;
 *             dropping shakes it (refusal)
 *   drop      the tray comes back up on the object spring (its small overshoot); onFiles gets what
 *             it took, and those land below as attachments
 *   disabled  dimmed; drags pass by with no drop effect; the picker does not open
 *   compact   one row, for a composer
 * Reduce Motion: the edge and line change at once; nothing sinks, rises or shakes.
 * A place: it receives files and holds nothing itself. It uses the well, the drum and the refusal.
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-drop-zone relative grid content-center justify-items-center gap-drop-zone-gap min-h-drop-zone-min-height p-drop-zone-pad rounded-drop-zone-radius recipe-well-field text-center cursor-pointer select-none drop-zone-edge drop-zone-sink drop-zone-disabled has-focus-visible:focus-ring';
const COMPACT = 'mu-drop-zone relative flex min-w-0 max-w-full items-center gap-drop-zone-compact-gap h-drop-zone-compact-height px-drop-zone-compact-pad-x rounded-drop-zone-radius recipe-well-field text-left cursor-pointer select-none drop-zone-edge drop-zone-sink drop-zone-disabled has-focus-visible:focus-ring';
const WELL = 'mu-drop-zone-well grid flex-none place-items-center size-drop-zone-well-size rounded-drop-zone-well-radius recipe-surface-raise-sm text-ink2 drop-zone-rise [&>svg]:size-drop-zone-well-glyph';
const TITLE = 'mu-drop-zone-title type-ui text-ink';
const LINE = 'mu-drop-zone-description type-meta text-ink3';
const CHOOSE = 'mu-drop-zone-choose type-meta text-ink2 underline underline-offset-2';
const WORDS = 'mu-drop-zone-words grid min-w-0 gap-drop-zone-words-gap';

export type DropRefusal = { file: File; reason: 'type' | 'size' | 'count' };

export interface DropZoneProps {
  /** Receives the files it took, and the ones it refused with why. */
  onFiles: (files: File[], refused: DropRefusal[]) => void;
  /** What it takes, as the file input's accept: "image/*,.pdf". Everything by default. */
  accept?: string;
  /** Largest file it takes, in bytes. */
  maxSize?: number;
  /** More than one file at a time (the default). */
  multiple?: boolean;
  disabled?: boolean;
  /** The first line: "Drop files here". Also the input's name. */
  title?: string;
  /** What it takes, in words: "PDFs and images, up to 10 MB". */
  description?: string;
  /** The line while files are over it. */
  overTitle?: string;
  /** The line while a file it won't take is over it. */
  refusedTitle?: string;
  /** The words that say it can be clicked. */
  chooseLabel?: string;
  /** A glyph from the icon set, in the well. */
  icon?: React.ReactNode;
  /** One row, for a composer. */
  compact?: boolean;
  className?: string;
}

function patterns(accept?: string) {
  return (accept ?? '').split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
}

/** Whether a MIME type (and a name, when known) fits the accept list. Names are unknown while dragging. */
function fits(list: string[], type: string, name?: string) {
  if (list.length === 0) return true;
  const t = type.toLowerCase();
  return list.some((p) => {
    if (p.startsWith('.')) return name == null ? true : name.toLowerCase().endsWith(p);
    if (p.endsWith('/*')) return t.startsWith(p.slice(0, -1));
    return t === p;
  });
}

function hasFiles(e: DragEvent | React.DragEvent) {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files');
}

/** A place that receives files, by drop or by picking. */
export function DropZone({
  onFiles, accept, maxSize, multiple = true, disabled, compact, icon, className,
  title = 'Drop files here', description, overTitle = 'Let go to attach', refusedTitle = 'This file isn’t taken here', chooseLabel = 'or choose files',
}: DropZoneProps) {
  const root = React.useRef<HTMLLabelElement>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const [armed, setArmed] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const [refused, setRefused] = React.useState(false);
  const descId = React.useId();
  const list = React.useMemo(() => patterns(accept), [accept]);

  // Armed while files are dragged anywhere in the window; dragover repeats, so silence ends it.
  // A drop that misses the zone is swallowed, so the browser never navigates to the file.
  React.useEffect(() => {
    if (disabled) return;
    let quiet = 0;
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      if (!root.current?.contains(e.target as Node)) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'; }
      setArmed(true);
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => { setArmed(false); setOver(false); }, 150);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      if (!root.current?.contains(e.target as Node)) e.preventDefault();
      window.clearTimeout(quiet);
      setArmed(false);
    };
    window.addEventListener('dragover', onOver);
    window.addEventListener('drop', onDrop);
    return () => { window.clearTimeout(quiet); window.removeEventListener('dragover', onOver); window.removeEventListener('drop', onDrop); };
  }, [disabled]);

  const take = (all: File[]) => {
    const files: File[] = [];
    const no: DropRefusal[] = [];
    for (const file of all) {
      if (!fits(list, file.type, file.name)) no.push({ file, reason: 'type' });
      else if (maxSize != null && file.size > maxSize) no.push({ file, reason: 'size' });
      else if (!multiple && files.length > 0) no.push({ file, reason: 'count' });
      else files.push(file);
    }
    if (no.length > 0) refuse(root.current);
    if (all.length > 0) onFiles(files, no);
  };

  const onDragOver = (e: React.DragEvent) => {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    const items = Array.from(e.dataTransfer.items).filter((i) => i.kind === 'file');
    const no = items.some((i) => !fits(list, i.type)) || (!multiple && items.length > 1);
    e.dataTransfer.dropEffect = no ? 'none' : 'copy';
    setOver(true);
    setRefused(no);
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (root.current?.contains(e.relatedTarget as Node)) return;
    setOver(false);
    setRefused(false);
  };
  const onDrop = (e: React.DragEvent) => {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    setOver(false);
    setRefused(false);
    setArmed(false);
    take(Array.from(e.dataTransfer.files));
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    take(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const line = refused ? refusedTitle : over ? overTitle : title;
  const base = compact ? COMPACT : ROOT;
  return (
    <label
      ref={root}
      data-armed={armed && !disabled ? '' : undefined}
      data-over={over ? '' : undefined}
      data-refused={refused ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      className={className ? `${base} ${className}` : base}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={input}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={title}
        aria-describedby={description ? descId : undefined}
        onChange={onChange}
      />
      {icon && <span aria-hidden className={WELL}>{icon}</span>}
      <span className={compact ? `${WORDS} flex-1 overflow-hidden` : WORDS}>
        <span aria-hidden className={compact ? `${TITLE} block min-w-0 truncate` : TITLE}><SwapText value={line} className={compact ? 'max-w-full [&>.mu-swap-layer]:block [&>.mu-swap-layer]:max-w-full [&>.mu-swap-layer]:truncate' : undefined} /></span>
        {description && <span id={descId} className={LINE}>{description}</span>}
      </span>
      {!disabled && <span aria-hidden className={compact ? `${CHOOSE} ms-auto min-w-0 truncate` : CHOOSE}>{chooseLabel}</span>}
    </label>
  );
}
