'use client';
import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { Icon } from '../../icons/Icon';
import { MarkUrl, useReadingLine } from '../mark/mark';
import { MARK_GLYPH_SIZE } from '../mark/identity.generated';
import { Popover } from '../popover/popover';
import { Field } from '../field/field';
import { Button } from '../button/button';

/** Parse for navigation/display only. The authored source is never replaced by URL.href. */
function destination(words: string) {
  if (/\s/.test(words)) return null;
  try { const url = new URL(words); return ['http:', 'https:'].includes(url.protocol) && !!url.hostname ? url : null; } catch { return null; }
}
export interface LinkCueProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'value' | 'onChange' | 'children' | 'href'> {
  value: string;
  label: string;
  /** Widest permitted source words AND resolved host alternatives, reserved once before editing. */
  footprint: readonly string[];
  disabled?: boolean;
  readOnly?: boolean;
  raw?: boolean;
  editing?: boolean;
  editProps?: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'value' | 'disabled'>;
  inputAria?: Pick<React.InputHTMLAttributes<HTMLInputElement>, 'aria-describedby' | 'aria-description'>;
  /** Optional host constraint after absolute HTTP(S) URL and fixed-footprint validation. */
  validate?: (words: string) => string | undefined;
  onBegin?: () => boolean | void;
  onChange: (words: string) => boolean | void;
  onCommit?: () => void;
  onCancel?: () => void;
}

/* LINK CUE STORYBOARD
 * rest    real host-chip anchor follows its exact URL; a host-declared source/host footprint is paid
 * hover   the separate edit glyph appears in the reserved meaning clearance; Enter on link follows
 * edit    the shared field owns a local draft, one host range snapshot, and no source previews
 * apply   validate full source and footprint, then write the exact words and commit once
 * cancel  Escape/outside/unmount/stale source restores the snapshot; a refused draft stays editable
 * Reduced motion is the donor popover fade. There is no rest clock or independently tuned motion.
 */
export const LinkCue = React.forwardRef<HTMLAnchorElement, LinkCueProps>(function LinkCue(props, ref) {
  const reading = useReadingLine();
  const { value, label, footprint, disabled = false, readOnly = false, raw = false, editing: _editing,
    editProps, inputAria, validate: _validate, onBegin: _begin, onChange: _change, onCommit: _commit, onCancel: _cancel, className, ...linkProps } = props;
  const root = React.useRef<HTMLSpanElement>(null);
  const reserve = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [error, setError] = React.useState<string>();
  const active = React.useRef<{ original: string; footprint: string } | null>(null);
  const callbacks = React.useRef(props); callbacks.current = props;
  const plan = JSON.stringify(footprint);
  const url = destination(value);
  const mutable = !disabled && !readOnly && footprint.length > 0;
  function cancel(render = true) {
    if (!active.current) return;
    active.current = null;
    if (render) { setOpen(false); setError(undefined); }
    callbacks.current.onCancel?.();
  }
  const latestCancel = React.useRef(cancel); latestCancel.current = cancel;
  React.useEffect(() => {
    const held = active.current;
    if (held && (value !== held.original || props.editing === false || !mutable || held.footprint !== plan)) latestCancel.current();
  }, [value, props.editing, mutable, plan]);
  React.useEffect(() => () => latestCancel.current(false), []);
  function apply() {
    if (!active.current || !mutable) return;
    const nextDestination = destination(draft);
    if (!nextDestination) { setError('Enter an absolute HTTP or HTTPS URL.'); return; }
    // One input operation measures the reserved source font; no animation-frame or rest reads.
    const element = root.current, reserved = reserve.current;
    const context = document.createElement('canvas').getContext('2d');
    if (!element || !reserved || !context) { setError('The source footprint is not available yet.'); return; }
    const font = getComputedStyle(element); context.font = `${font.fontStyle} ${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
    const spacing = parseFloat(font.letterSpacing) || 0;
    const sourceWidth = context.measureText(draft).width + Math.max(0, draft.length - 1) * spacing;
    const chip = reserved.querySelector<HTMLAnchorElement>('.mu-cue-url');
    if (!chip) { setError('The source footprint is not available yet.'); return; }
    const chipFont = getComputedStyle(chip);
    context.font = `${chipFont.fontStyle} ${chipFont.fontWeight} ${chipFont.fontSize} ${chipFont.fontFamily}`;
    const chipWidth = context.measureText(nextDestination.hostname).width + Math.max(0, nextDestination.hostname.length - 1) * (parseFloat(chipFont.letterSpacing) || 0)
      + MARK_GLYPH_SIZE + (parseFloat(chipFont.columnGap) || 0) + (parseFloat(chipFont.paddingLeft) || 0) + (parseFloat(chipFont.paddingRight) || 0);
    if (Math.ceil(Math.max(sourceWidth, chipWidth)) > Math.ceil(reserved.getBoundingClientRect().width)) { setError('This URL exceeds the source footprint allowed by the document.'); return; }
    const refused = callbacks.current.validate?.(draft);
    if (refused) { setError(refused); return; }
    if (draft !== value && callbacks.current.onChange(draft) === false) { cancel(); return; }
    active.current = null; setOpen(false); setError(undefined); callbacks.current.onCommit?.();
  }
  const description = [...new Set(['Enter follows this destination. The separate edit key changes its exact URL.', linkProps['aria-description']].filter(Boolean))].join(' ');
  const shared = { ...linkProps, ref, href: !disabled && url ? value : undefined, role: disabled || !url ? 'link' : linkProps.role,
    tabIndex: disabled || !url ? linkProps.tabIndex ?? 0 : linkProps.tabIndex, 'aria-disabled': disabled || !url || undefined,
    'aria-label': `${label}: ${value}`, 'aria-description': description, title: value,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => { if (disabled || !url) event.preventDefault(); else linkProps.onClick?.(event); },
    onAuxClick: (event: React.MouseEvent<HTMLAnchorElement>) => { if (disabled || !url) event.preventDefault(); else linkProps.onAuxClick?.(event); },
    onKeyDown: (event: React.KeyboardEvent<HTMLAnchorElement>) => { if ((disabled || !url) && event.key === 'Enter') event.preventDefault(); else linkProps.onKeyDown?.(event); },
  };
  return <span ref={root} className={`mu-link-cue group relative ${reading ? 'inline-flex items-center gap-mu-space-4' : 'inline-grid'} align-baseline type-content text-ink${className ? ` ${className}` : ''}`} data-value={value} data-editing={open || undefined}>
    <span ref={reserve} aria-hidden className={`invisible col-start-1 row-start-1 inline-grid whitespace-nowrap${reading ? ' absolute right-0 pointer-events-none' : ''}`}>
      {footprint.map((words, index) => [<span key={`${index}-source-${words}`} className="col-start-1 row-start-1">{words}</span>, <span key={`${index}-host-${words}`} className="col-start-1 row-start-1"><MarkUrl tabIndex={-1} host={destination(words)?.hostname ?? words} glyph={<Icon name="link" size={MARK_GLYPH_SIZE} />} /></span>])}
    </span>
    <span className="col-start-1 row-start-1 justify-self-start">
      {raw ? <a {...shared} className="mu-link-cue-link outline-none underline focus-visible:focus-ring">{value}</a>
        : <MarkUrl {...shared} host={url?.hostname ?? value} glyph={<Icon name="link" size={MARK_GLYPH_SIZE} />} />}
    </span>
    <Popover open={open} onOpenChange={next => {
      if (!next) { cancel(); setOpen(false); return; }
      if (!mutable || callbacks.current.onBegin?.() === false) return;
      active.current = { original: value, footprint: plan }; setDraft(value); setError(undefined); setOpen(true);
    }}>
      <Popover.Trigger><BaseButton {...editProps} disabled={disabled} focusableWhenDisabled={readOnly} aria-disabled={!mutable || undefined}
        aria-label={`Edit ${label} URL`} aria-description={['Enter opens the URL field. Enter applies; Escape cancels.', editProps?.['aria-description'], linkProps['aria-description']].filter(Boolean).join(' ')}
        className={`mu-link-cue-edit inline-flex flex-none border-0 p-0 bg-transparent text-ink3 hover:text-ink2 outline-none focus-visible:focus-ring${reading ? '' : ' absolute right-0 bottom-full mb-mu-space-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}>
        <Icon name="pen" size={MARK_GLYPH_SIZE} />
      </BaseButton></Popover.Trigger>
      <Popover.Content aria-label={`Edit ${label} URL`} align="start">
        <Popover.Title>{label}</Popover.Title>
        <Popover.Description>Write the full URL. The document keeps your exact words.</Popover.Description>
        <Popover.Body><form className="mu-stack gap-mu-related" onSubmit={event => { event.preventDefault(); apply(); }}>
          <Field size="regular" invalid={!!error}><Field.Icon><Icon name="link" /></Field.Icon><Field.Input {...inputAria} aria-label={`${label} URL`} value={draft} onChange={event => { setDraft(event.target.value); setError(undefined); }} /></Field>
          {error && <p role="alert" className="type-meta text-red m-0">{error}</p>}
          <div className="mu-cluster gap-mu-related"><Button size="compact" cap="primary" type="submit" icon={<Icon name="check" />}>Apply URL</Button><Button size="compact" cap="standard" onClick={() => cancel()} icon={<Icon name="close" />}>Cancel URL edit</Button></div>
        </form></Popover.Body>
      </Popover.Content>
    </Popover>
  </span>;
});
