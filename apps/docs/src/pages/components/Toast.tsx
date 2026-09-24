import * as React from 'react';
import { Button, ToastProvider, useToast } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/toast/toast.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/toast/toast.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/toast/toast.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalToast.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

function Triggers() {
  const toast = useToast();
  const [log, setLog] = React.useState('Show a toast');
  return (
    <div className="flex flex-col items-center gap-16">
      <div className="flex flex-wrap justify-center gap-8">
        <Button data-toast="undo" onClick={() => toast.show({ title: 'Moved 3 blocks', undo: () => setLog('Undone: moved 3 blocks back') })}>Move 3 blocks</Button>
        <Button onClick={() => toast.show({ title: 'Pinned as a live region', sub: 'it updates as you write', tone: 'success' })}>Pin a lens</Button>
        <Button onClick={() => toast.show({ title: 'Correction remembered', sub: 'for this exact text', undo: () => setLog('Correction forgotten') })}>Correct a cue</Button>
        <Button cap="destructive" onClick={() => toast.show({ title: 'Could not export', sub: 'the clipboard is locked', tone: 'error' })}>Fail an export</Button>
      </div>
      <span className="type-readout text-ink2" aria-live="polite">{log}</span>
    </div>
  );
}

export default function ToastPage() {
  return (
    <ToastProvider>
      <PageHeader title="Toast" lede="The result of a person's own action, with Undo: a smoked pill at the bottom centre, one at a time. It rises one nest from below on the settle spring and leaves on release. Toasts are for what you did, never for what the app recognised. Built on Base UI Toast." />
      <Section title="Playground" lede="Each button does something and says so. Undoable toasts stay 5 seconds, plain ones 2.6; the error stays until you dismiss it (F6 then Escape).">
        <Bench caption="one at a time · bottom centre, 92 above the dock" className="min-h-[200px]">
          <Triggers />
        </Bench>
        <SwiftCapture name="toast" maxWidth={560} />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: reactSource },
          { id: 'css', label: 'CSS', code: cssSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
      <Section title="Rules">
        <Rules rules={[
          { id: 'O1', title: 'Your actions, never recognition', body: 'No toast, badge or sound when the surface recognises something.', origin: 'Kamui 03 §13' },
          { id: 'O2', title: 'Undo whenever it can be undone', body: 'The Undo cap and ⌘Z do the same thing.', origin: 'Kamui 04 §12' },
          { id: 'O3', title: 'One at a time', body: 'The next replaces the last: the old leaves on release as the new arrives on settle.', origin: 'Kamui demo' },
          { id: 'O4', title: 'Success carries its check; errors stay', body: 'Never colour alone; an error waits until it is resolved.', origin: 'DS-34' },
        ]} />
      </Section>
    </ToastProvider>
  );
}
