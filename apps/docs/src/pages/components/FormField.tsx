import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, CheckboxGroup, Combobox, Field, Fieldset, Form, FormField, NumberField, Radio, RadioGroup, Textarea, ToastProvider, useToast, useWaiting } from '@unlocalhosted/metalui';
import { Icon, MorphIcon } from '@unlocalhosted/metalui/icons';
import { useEditRequest } from '../../../../../packages/metalui/src/components/rename-editor/edit-request';
import { SPRINGS } from '../../../../../packages/metalui/src/motion/springs.generated';
import { WAITING_TIMING } from '../../../../../packages/metalui/src/motion/waiting.generated';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import swiftExample from '../../../../../swift/Examples/MetalSaveRegionExample.swift?raw';
import reactSource from '../../../../../packages/metalui/src/components/form-field/form-field.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/form-field/form-field.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * ERROR TUNER: the page's DialKit panel
 *
 *   in    the spring the error's row grows open on
 *   out   the spring it closes on
 *   flip  make the field invalid, then valid again
 * ───────────────────────────────────────────────────────── */

const CITIES = ['Amsterdam', 'Berlin', 'Lisbon', 'Paris', 'Porto', 'Rome', 'Vienna'];

function ErrorTuner() {
  const [invalid, setInvalid] = React.useState(false);
  const d = useDialKit('Form error', {
    in: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    out: { type: 'select', options: SPRING_NAMES, default: 'release' },
    slow: [1, 1, 10],
    flip: { type: 'action', label: 'Invalid / valid' },
  }, {
    onAction: (action) => { if (action === 'flip') setInvalid((v) => !v); },
  });
  const vars = { ...springVars('settle', d.in as SpringName, d.slow), ...springVars('release', d.out as SpringName, d.slow) } as React.CSSProperties;
  return (
    <div data-testid="form-error-tuner" className="grid w-full max-w-[360px] gap-12" style={vars}>
      <FormField invalid={invalid}>
        <FormField.Label>Tuned name</FormField.Label>
        <Field size="regular"><Field.Input /></Field>
        <FormField.Error>Give the region a name.</FormField.Error>
      </FormField>
      <p className="m-0 type-meta text-ink3">The field below moves down as the error opens.</p>
    </div>
  );
}

function RegionFormBody() {
  const d = useDialKit('Save region request', { latency: [900, 0, 3000], fail: false });
  const [saved, setSaved] = React.useState<Record<string, unknown> | null>(null);
  const [pending, setPending] = React.useState(false);
  const [requests, setRequests] = React.useState(0);
  const [sent, setSent] = React.useState(false);
  const [format, setFormat] = React.useState('pdf');
  const [include, setInclude] = React.useState(['notes']);
  const toast = useToast();
  const root = React.useRef<HTMLFormElement>(null);
  const request = useEditRequest<Record<string, unknown>, Record<string, unknown> | null>({
    onCommit: async () => { setRequests(n => n + 1); await new Promise(resolve => setTimeout(resolve, d.latency)); if (d.fail && requests === 0) throw new Error('Could not save the region. Try again.'); },
    onPendingChange: setPending,
    onCommitted: (next, original) => { setSaved(next); setSent(true); toast.show({ title: `Saved region ${next.name}`, undo: () => { setSaved(original); setSent(!!original); request.reset(); } }); },
  });
  const { phase } = useWaiting(request.state, root);
  React.useEffect(() => {
    if (phase !== 'done') return;
    const timer = setTimeout(request.finish, SPRINGS.settle.duration * 1000 + WAITING_TIMING.minimumVisible);
    return () => clearTimeout(timer);
  }, [phase]);
  return (
    <Form ref={root} data-testid="save-region" data-requests={requests} className="w-full max-w-[380px]" onChange={request.reset}
      onFormSubmit={values => { if (!pending) void request.commit({ ...values, format, include }, saved); }}>
      <FormField name="name" disabled={pending} validationMode="onBlur" validate={(v) => {
        const text = String(v ?? '').trim();
        return text && text.length < 3 ? 'Use at least 3 letters.' : null;
      }}>
        <FormField.Label>Region name</FormField.Label>
        <Field size="regular"><Field.Input required placeholder="Trip to Lisbon" /></Field>
        <FormField.Description>Shown on its edge and in search.</FormField.Description>
        <FormField.Error match="valueMissing">Give the region a name.</FormField.Error>
        <FormField.Error match="customError" />
      </FormField>
      <FormField name="notes" disabled={pending}>
        <FormField.Label>Notes</FormField.Label>
        <Textarea minRows={2} maxLength={140} />
      </FormField>
      <FormField name="city" disabled={pending}>
        <FormField.Label>City</FormField.Label>
        <Combobox items={CITIES} placeholder="Choose a city" onValueChange={request.reset} />
      </FormField>
      <FormField name="copies" disabled={pending}>
        <NumberField label="Copies" defaultValue={1} min={1} max={9} onValueChange={request.reset} />
      </FormField>
      <Fieldset disabled={pending}>
        <Fieldset.Legend>Export as</Fieldset.Legend>
        <RadioGroup disabled={pending} value={format} onValueChange={value => { setFormat(String(value)); request.reset(); }} orientation="horizontal" aria-label="Export as">
          <Radio value="png">PNG</Radio>
          <Radio value="pdf">PDF</Radio>
        </RadioGroup>
      </Fieldset>
      <Fieldset disabled={pending}>
        <Fieldset.Legend>Include</Fieldset.Legend>
        <CheckboxGroup disabled={pending} value={include} onValueChange={value => { setInclude(value); request.reset(); }} aria-label="Include">
          <CheckboxGroup.Item value="notes">Notes</CheckboxGroup.Item>
          <CheckboxGroup.Item value="photos">Photos</CheckboxGroup.Item>
        </CheckboxGroup>
      </Fieldset>
      <div className="flex items-center gap-12">
        <Button cap="primary" type="submit" state={request.state} waitingLabel="Saving…" doneLabel="Saved" errorLabel="Try again"
          icon={<span className="relative inline-flex"><MorphIcon name={phase === 'done' ? 'check' : phase === 'error' ? 'sync-error' : 'region'} className={phase === 'idle' ? 'invisible' : undefined} /><Icon name="region" className={phase === 'idle' ? 'absolute inset-0' : 'hidden'} /></span>}>Save region</Button>
        {sent && <span className="type-meta text-ink2">Saved.</span>}
      </div>
      {request.failure && <p className="m-0 type-meta text-form-field-error-ink" role="alert">{request.failure}</p>}
      <output className="type-meta text-ink2" data-saved-name>{saved ? `Stored: ${saved.name}` : 'No saved region.'}</output>
    </Form>
  );
}

function RegionForm() { return <ToastProvider><RegionFormBody /></ToastProvider>; }

export default function FormFieldPage() {
  return (
    <ComponentPage
      title="Form field"
      lede="A control with its words: a label, a hint, and an error that says why a value is not accepted. The error comes out from under the control, so the form moves instead of jumping. Fieldsets group fields under a legend."
      play={{ lede: 'Type two letters in the name and move on, or save with the name empty. Saving validates the whole form, locks only that request, then offers Undo.', caption: 'label · description · error · fieldset', node: <RegionForm /> }}
      more={[{ id: 'save', title: 'Commit a small edit', lede: 'Save region captures all validated fields for one storage request. A failure keeps the draft for retry; a success settles region into check and Save region into Saved, then unlocks the form. Undo restores the snapshot captured before that request. The Save region request panel controls latency and first-request failure.', node: <p className="m-0 type-content text-ink2">The native example below composes the same existing controls. Native Combobox, NumberField and CheckboxGroup remain at their documented alpha fidelity; request lock, validation, result and Undo are executable.</p> }, { id: 'error', title: 'Tune the error', lede: 'The Form error panel swaps the springs the error opens and closes on, and stretches time. Flip it invalid and valid.', node: <ErrorTuner /> }]}
      usage={`<Form onFormSubmit={save}>
  <FormField name="name">
    <FormField.Label>Region name</FormField.Label>
    <Field size="regular"><Field.Input required /></Field>
    <FormField.Description>Shown on its edge and in search.</FormField.Description>
    <FormField.Error match="valueMissing">Give the region a name.</FormField.Error>
  </FormField>
  <Button cap="primary" type="submit">Save</Button>
</Form>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'swift', label: 'SwiftUI save host', code: swiftExample },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'FF1', title: 'Every control has a visible label', body: 'Placeholder text is a hint, never the label.', origin: 'Ours' },
        { id: 'FF2', title: 'Say what to do', body: '"Give the region a name", not "Invalid".', origin: 'Ours' },
        { id: 'FF3', title: 'The form moves, it does not jump', body: 'An error grows its row open on the settle spring and pushes what is below it gently.', origin: 'Ours' },
      ]}
    />
  );
}
