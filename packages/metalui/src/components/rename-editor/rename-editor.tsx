'use client';
import * as React from 'react';
import { Button } from '../button/button';
import { Field } from '../field/field';
import { Form, FormField } from '../form-field/form-field';
import { Icon } from '../../icons/Icon';
import { MorphIcon } from '../../icons/MorphIcon';
import { useWaiting } from '../../motion/waiting';
import { SPRINGS } from '../../motion/springs.generated';
import { WAITING_TIMING } from '../../motion/waiting.generated';
import { useEditRequest } from './edit-request';

export interface RenameEditorProps {
  /** Name captured when this editor opens. Remount for a new editing session. */
  value: string;
  /** Select the basename, excluding only a nonempty final extension. Dotfiles remain whole. */
  file?: boolean;
  label?: string;
  validate?: (name: string) => string | null | undefined;
  onRename: (name: string) => void | Promise<void>;
  /** Successful request, with the captured original for the host's Undo. */
  onRenamed?: (name: string, original: string) => void;
  /** Result has been visible for the shared minimum beat; the host may close now. */
  onDone?: () => void;
  onCancel: () => void;
  /** Includes the result beat. Refuse host dismissal while true. */
  onPendingChange?: (pending: boolean) => void;
  className?: string;
}
const ROOT = 'mu-rename-editor mu-stack gap-mu-related';
const ACTIONS = 'mu-cluster justify-end gap-mu-related';

/** Text plus one confirm operation; the host owns validation, persistence, dismissal and Undo. */
export const RenameEditor = React.forwardRef<HTMLInputElement, RenameEditorProps>(function RenameEditor({
  value, file = false, label = 'Name', validate, onRename, onRenamed, onDone, onCancel, onPendingChange, className,
}, ref) {
  const failureId = React.useId();
  const original = React.useRef(value);
  const [draft, setDraft] = React.useState(value);
  const selected = React.useRef(false);
  const root = React.useRef<HTMLFormElement>(null);
  const request = useEditRequest({ onCommit: onRename, onCommitted: onRenamed, onPendingChange });
  const { phase } = useWaiting(request.state, root);
  const callbacks = React.useRef({ onDone, finish: request.finish }); callbacks.current = { onDone, finish: request.finish };
  React.useEffect(() => {
    if (phase !== 'done') return;
    const close = setTimeout(() => { callbacks.current.finish(); callbacks.current.onDone?.(); }, SPRINGS.settle.duration * 1000 + WAITING_TIMING.minimumVisible);
    return () => clearTimeout(close);
  }, [phase]);
  const name = draft.trim();
  const validation = name ? validate?.(name) : null;
  const error = validation || request.failure;
  const locked = request.state === 'waiting' || request.state === 'done';
  const unchanged = name === original.current.trim();
  return <Form ref={root} className={`${ROOT} ${className ?? ''}`} data-state={request.state}
    onFormSubmit={() => { if (!locked && name && !unchanged && !validation) void request.commit(name, original.current); }}>
    <FormField name="name" invalid={!!validation}>
      <FormField.Label>{label}</FormField.Label>
      <Field size="regular" invalid={!!error} disabled={locked} aria-busy={request.state === 'waiting'}>
        <Field.Input ref={ref} aria-invalid={!!error || undefined} aria-describedby={request.failure ? failureId : undefined} value={draft} onChange={e => { setDraft(e.target.value); request.reset(); }}
          onFocus={e => {
            if (selected.current) return; selected.current = true;
            const dot = original.current.lastIndexOf('.');
            e.currentTarget.setSelectionRange(0, file && dot > 0 && dot < original.current.length - 1 ? dot : original.current.length);
          }} />
      </Field>
      {validation && <FormField.Error match>{validation}</FormField.Error>}
      {request.failure && <p id={failureId} className="m-0 type-meta text-form-field-error-ink" role="alert">{request.failure}</p>}
    </FormField>
    <div className={ACTIONS}>
      <Button type="button" disabled={locked} onClick={onCancel}>Cancel</Button>
      <Button cap="primary" type="submit"
        icon={<span className="relative inline-flex"><MorphIcon name={phase === 'done' ? 'check' : phase === 'error' ? 'sync-error' : 'pen'} className={phase === 'idle' ? 'invisible' : undefined} /><Icon name="pen" className={phase === 'idle' ? 'absolute inset-0' : 'hidden'} /></span>} state={request.state}
        waitingLabel="Renaming…" doneLabel="Renamed" errorLabel="Try again"
        disabled={!name || unchanged || !!validation}>Rename</Button>
    </div>
  </Form>;
});
