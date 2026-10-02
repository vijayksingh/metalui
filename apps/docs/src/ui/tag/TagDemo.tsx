import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Chip, Field, Form, FormField, ToastProvider, useToast, useWaiting } from '@unlocalhosted/metalui';
import { Icon, MorphIcon } from '@unlocalhosted/metalui/icons';
import { useEditRequest } from '../../../../../packages/metalui/src/components/rename-editor/edit-request';
import { SPRINGS } from '../../../../../packages/metalui/src/motion/springs.generated';
import { WAITING_TIMING } from '../../../../../packages/metalui/src/motion/waiting.generated';

function TagHost() {
  const d = useDialKit('Tag request', { latency: [900, 0, 3000], fail: false });
  const [draft, setDraft] = React.useState('');
  const [tags, setTags] = React.useState<string[]>(['travel']);
  const [pending, setPending] = React.useState(false);
  const [requests, setRequests] = React.useState(0);
  const root = React.useRef<HTMLFormElement>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const toast = useToast();
  const value = draft.trim().replace(/^#/, '');
  const validation = pending ? null : value.length > 32 ? 'Use 32 characters or fewer.' : tags.some(tag => tag.toLocaleLowerCase() === value.toLocaleLowerCase()) ? 'This tag is already attached.' : null;
  const request = useEditRequest<string, string[]>({
    onCommit: async () => { setRequests(n => n + 1); await new Promise(resolve => setTimeout(resolve, d.latency)); if (d.fail && requests === 0) throw new Error('Could not attach this tag. Try again.'); },
    onPendingChange: setPending,
    onCommitted: (tag, original) => { setTags([...original, tag]); toast.show({ title: `Tagged #${tag}`, undo: () => setTags(original) }); },
  });
  const { phase } = useWaiting(request.state, root);
  React.useEffect(() => {
    if (phase !== 'done') return;
    const timer = setTimeout(() => { request.finish(); request.reset(); setDraft(''); }, SPRINGS.settle.duration * 1000 + WAITING_TIMING.minimumVisible);
    return () => clearTimeout(timer);
  }, [phase]);
  function cancel() { if (!pending) { setDraft(''); request.reset(); input.current?.focus(); } }
  return <Form ref={root} data-testid="tag-editor" data-requests={requests} className="mu-stack gap-mu-related w-full" onFormSubmit={() => { if (value && !validation && !pending) void request.commit(value, tags); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); cancel(); } }}>
    <div aria-label="Attached tags" role="group" className="mu-cluster gap-mu-related">{tags.map(tag => <Chip key={tag} variant="tag"><Chip.Text>#{tag}</Chip.Text></Chip>)}</div>
    <FormField name="tag" disabled={pending} invalid={!!validation}>
      <FormField.Label>Tag</FormField.Label>
      <Field size="compact" invalid={!!validation || !!request.failure}><Field.Input ref={input} placeholder="Add a tag" value={draft} onChange={event => { setDraft(event.target.value); request.reset(); }} aria-describedby={request.failure ? 'tag-request-error' : undefined} /></Field>
      {validation && <FormField.Error match>{validation}</FormField.Error>}
    </FormField>
    <div className="mu-cluster gap-mu-related">
      <Button size="compact" type="submit" disabled={phase === 'idle' && (!value || !!validation)} state={request.state} waitingLabel="Tagging…" doneLabel="Tagged" errorLabel="Try again" icon={<span className="relative inline-flex"><MorphIcon name={phase === 'done' ? 'check' : phase === 'error' ? 'sync-error' : 'tag'} className={phase === 'idle' ? 'invisible' : undefined} /><Icon name="tag" className={phase === 'idle' ? 'absolute inset-0' : 'hidden'} /></span>}>Tag</Button>
      <Button size="compact" disabled={pending || !draft} onClick={cancel}>Cancel</Button>
    </div>
    {request.failure && <p id="tag-request-error" role="alert" className="m-0 type-meta text-form-field-error-ink">{request.failure}</p>}
  </Form>;
}
export function TagDemo() { return <ToastProvider><TagHost /></ToastProvider>; }
