import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, EmptyState, Form, FormField, Textarea, ToastProvider, useToast, useWaiting } from '@unlocalhosted/metalui';
import { Icon, MorphIcon } from '@unlocalhosted/metalui/icons';
import { useEditRequest } from '../../../../../packages/metalui/src/components/rename-editor/edit-request';
import { SPRINGS } from '../../../../../packages/metalui/src/motion/springs.generated';
import { WAITING_TIMING } from '../../../../../packages/metalui/src/motion/waiting.generated';

function CommentPlace() {
  const d = useDialKit('Comment request', { latency: [900, 0, 3000], fail: false });
  const [comments, setComments] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [requests, setRequests] = React.useState(0);
  const root = React.useRef<HTMLDivElement>(null);
  const toast = useToast();
  const value = draft.trim();
  const request = useEditRequest<string, string[]>({
    onCommit: async () => { setRequests(n => n + 1); await new Promise(resolve => setTimeout(resolve, d.latency)); if (d.fail && requests === 0) throw new Error('Could not post this comment. Try again.'); },
    onPendingChange: setPending,
    onCommitted: (comment, original) => { setComments([...original, comment]); toast.show({ title: 'Comment posted', undo: () => setComments(original) }); },
  });
  const { phase } = useWaiting(request.state, root);
  React.useEffect(() => {
    if (phase !== 'done') return;
    const timer = setTimeout(() => { request.finish(); request.reset(); setDraft(''); setOpen(false); }, SPRINGS.settle.duration * 1000 + WAITING_TIMING.minimumVisible);
    return () => clearTimeout(timer);
  }, [phase]);
  function cancel() { if (!pending) { request.reset(); setDraft(''); setOpen(false); } }
  function submit() { if (value && !pending) void request.commit(value, comments); }
  return <div ref={root} data-testid="comment-place" data-requests={requests} className="mu-stack gap-mu-related w-full rounded-card recipe-well-field p-mu-space-12">
    {open ? <Form onFormSubmit={submit} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); cancel(); }
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); submit(); }
    }}>
      <FormField name="comment" disabled={pending}>
        <FormField.Label>Comment text</FormField.Label>
        <Textarea autoFocus minRows={2} maxLength={280} value={draft} onChange={event => { setDraft(event.target.value); request.reset(); }} aria-invalid={!!request.failure} aria-describedby={request.failure ? 'comment-request-error' : undefined} />
      </FormField>
      <div className="mu-cluster gap-mu-related">
        <Button type="submit" size="compact" disabled={phase === 'idle' && !value} state={request.state} waitingLabel="Posting…" doneLabel="Posted" errorLabel="Try again" icon={<span className="relative inline-flex"><MorphIcon name={phase === 'done' ? 'check' : phase === 'error' ? 'sync-error' : 'note'} className={phase === 'idle' ? 'invisible' : undefined} /><Icon name="note" className={phase === 'idle' ? 'absolute inset-0' : 'hidden'} /></span>}>Comment</Button>
        <Button size="compact" disabled={pending} onClick={cancel}>Cancel</Button>
      </div>
      {request.failure && <p id="comment-request-error" role="alert" className="m-0 type-meta text-form-field-error-ink">{request.failure}</p>}
    </Form> : comments.length ? <>
      <ul aria-label="Comments" className="mu-stack gap-mu-related m-0 list-none p-0">{comments.map((comment, index) => <li key={index} className="type-content text-ink whitespace-pre-wrap">{comment}</li>)}</ul>
      <Button size="compact" icon={<Icon name="note" />} onClick={() => setOpen(true)}>Comment</Button>
    </> : <EmptyState compact title="No comments" action={<Button size="compact" icon={<Icon name="note" />} onClick={() => setOpen(true)}>Comment</Button>} />}
  </div>;
}
export function CommentDemo() { return <ToastProvider><CommentPlace /></ToastProvider>; }
