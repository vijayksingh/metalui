import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Field, ToastProvider, useToast } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import { Icon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/toast/toast.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/toast/toast.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalToast.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { UsageSection, useOwnCss } from '../../ui/Usage';
import { ToastXray } from '../../ui/xray/ToastXray';

/* ─────────────────────────────────────────────────────────
 * DECK TUNER: the page's DialKit panel
 *
 *   step     how much smaller each card behind is
 *   peek     how far each card behind shows past the one in front
 *   spring   the spring a new card arrives on (the deck steps back on it too)
 *   slow     stretches every duration, fanning out and folding included
 *   deal     five results in a row, to fill the deck
 * ───────────────────────────────────────────────────────── */

const DEAL: { title: string; sub?: string; tone?: 'success' | 'error' }[] = [
  { title: 'Moved 3 blocks' },
  { title: 'Pinned as a live region', sub: 'it updates as you write', tone: 'success' },
  { title: 'Correction remembered', sub: 'for this exact text' },
  { title: 'Ticked', sub: 'wrote [x] into the text' },
  { title: 'Gathered 4 notes', tone: 'success' },
];

/** Five results, a beat apart: each arrives in front and pushes the deck back. */
function useDeal() {
  const toast = useToast();
  return React.useCallback(() => DEAL.forEach((t, i) => window.setTimeout(() => toast.show({ ...t, undo: t.tone ? undefined : () => {} }), i * 160)), [toast]);
}

function DeckTuner() {
  const deal = useDeal();
  const d = useDialKit('Toast deck', {
    step: [0.95, 0.8, 1],
    peek: [8, 0, 24],
    spring: { type: 'select', options: SPRING_NAMES, default: 'object' },
    slow: [1, 1, 10],
    deal: { type: 'action', label: 'Deal five' },
  }, {
    onAction: (action) => { if (action === 'deal') deal(); },
  });
  const vars = {
    ...springVars('object', d.spring as SpringName, d.slow),
    ...springVars('surface', 'surface', d.slow),
    ...springVars('release', 'release', d.slow),
    '--mu-r-toast-deck-step-scale': String(d.step),
    '--mu-r-toast-deck-peek': `${d.peek}px`,
  };
  React.useEffect(() => {
    // The deck is portalled; the tuned values ride on the document while this tuner is mounted.
    const el = document.documentElement;
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    return () => { for (const k of Object.keys(vars)) el.style.removeProperty(k); };
  });
  return (
    <div data-testid="toast-deck-tuner" className="flex min-h-[120px] items-center justify-center">
      <Button onClick={deal}>Deal five</Button>
    </div>
  );
}

function Triggers() {
  const toast = useToast();
  const [log, setLog] = React.useState('Show a toast');
  return (
    <div className="flex flex-col items-center gap-16">
      <div className="flex flex-wrap justify-center gap-8">
        <Button data-toast="undo" onClick={() => toast.show({ title: 'Moved 3 blocks', undo: () => setLog('Undone: moved 3 blocks back') })}>Move 3 blocks</Button>
        <Button icon={<Icon name="pin" />} onClick={() => toast.show({ title: 'Pinned as a live region', sub: 'it updates as you write', tone: 'success' })}>Pin a lens</Button>
        <Button onClick={() => toast.show({ title: 'Correction remembered', sub: 'for this exact text', undo: () => setLog('Correction forgotten') })}>Correct a cue</Button>
        <Button onClick={() => toast.show({ title: 'Ticked', sub: 'wrote [x] into the text', undo: () => setLog('Unticked') })}>Tick a box</Button>
        <Button cap="destructive" onClick={() => toast.show({ title: 'Could not export', sub: 'the clipboard is locked', tone: 'error' })}>Fail an export</Button>
      </div>
      <Field size="regular"><Field.Input aria-label="Draft with its own Undo" placeholder="Typing keeps its own Undo" /></Field>
      <Button onClick={() => toast.show({ title: 'Host-owned change', undoShortcut: false, undo: () => setLog('Host-owned change undone') })}>Host handles Undo</Button>
      <span className="type-readout text-ink2" aria-live="polite">{log}</span>
    </div>
  );
}

function PromiseResult() {
  const toast = useToast(); const [pending, setPending] = React.useState(false);
  const [stored, setStored] = React.useState('Draft'); const [log, setLog] = React.useState('No export requested');
  const current = React.useRef<string | undefined>(undefined);
  const d = useDialKit('Promise result', { latency: [900, 100, 6000], fail: false });
  const exportFile = async () => {
    if (pending) return; setPending(true); setLog('Export requested');
    const original = stored;
    try {
      await toast.promise(new Promise<string>((resolve, reject) => window.setTimeout(() => d.fail ? reject(new Error('The server refused this export.')) : resolve('poster.pdf'), d.latency)), {
        loading: { title: 'Exporting poster', sub: 'the draft stays editable' },
        success: name => ({ title: 'Poster exported', sub: name, undo: () => { setStored(original); setLog('Export undone'); } }),
        error: () => ({ title: 'Export failed', sub: 'the draft stays here for retry' }),
      });
      setStored('poster.pdf'); setLog('Export complete');
    } catch { setLog('Export failed; retry is available'); }
    finally { setPending(false); }
  };
  const sync = (glyph: 'synced' | 'offline' | 'sync-error') => {
    const options = { title: glyph === 'synced' ? 'All changes synced' : glyph === 'offline' ? 'Offline · changes stay here' : 'Sync failed · retry available',
      glyph, tone: glyph === 'sync-error' ? 'error' as const : 'default' as const, timeout: 0 };
    if (current.current && toast.update(current.current, options)) return;
    current.current = toast.show(options);
  };
  return <div data-testid="toast-promise" className="mu-stack items-center gap-mu-group">
    <div className="mu-cluster gap-mu-related">
      <Button icon={<Icon name="download" />} disabled={pending} onClick={exportFile}>Export poster</Button>
      <Button icon={<Icon name="sync-error" />} disabled={pending} onClick={async () => {
        setPending(true); try { await toast.promise(Promise.reject(new Error('Refused')), { loading: { title: 'Retrying export' }, success: { title: 'Poster exported' }, error: { title: 'Export failed', sub: 'the draft stays here for retry' } }); } catch { setLog('Export failed; retry is available'); } finally { setPending(false); }
      }}>Refuse export</Button>
    </div>
    <Field size="regular"><Field.Input aria-label="Poster draft" defaultValue="Poster title" /></Field>
    <div className="mu-cluster gap-mu-related">
      <Button size="compact" icon={<Icon name="synced" />} onClick={() => sync('synced')}>Sync result</Button>
      <Button size="compact" icon={<Icon name="offline" />} onClick={() => sync('offline')}>Offline result</Button>
      <Button size="compact" icon={<Icon name="sync-error" />} onClick={() => sync('sync-error')}>Failed result</Button>
    </div>
    <output className="type-meta text-ink2">{stored} · {log}</output>
    <p className="type-doc-body text-ink2">The host waits for an actual async export fixture. The loading card becomes its result in place, preserves focus and exposes Undo after success. Dismissal wins over a late promise; the draft remains operable. The separate sync fixture updates one retained result id.</p>
  </div>;
}

export default function ToastPage() {
  const ownCss = useOwnCss(cssSource);
  return (
    <ToastProvider>
      <PageHeader title="Toast" lede="The result of a person's own action, with Undo: a smoked pill at the bottom centre. Toasts stack as a deck in depth: the newest rises into the front on the object spring and the older ones step back behind it, smaller and dimmer. Point at or focus the deck to fan it out and read it; swipe a card away. Toasts are for what you did, never for what the app recognised. Built on Base UI Toast." />
      <Section title="Playground" lede="Each button does something and says so. Press a few in a row to build the deck; press the same one again and the front card counts instead of adding a card. Point at the deck (or F6 into it) to fan it out and pause the timers. Undoable toasts stay 5 seconds, plain ones 2.6; the error stays until you swipe it away or press its close key.">
        <Bench caption="a deck of 3 · bottom centre, 92 above the dock" className="min-h-[200px]">
          <Triggers />
        </Bench>
        <SwiftCapture name="toast" maxWidth={560} />
      </Section>
      <Section title="A promise becomes its result" lede="One retained card becomes info, success or error. Its glyph and words change together; updating a result keeps its position in the deck."><Bench caption="actual async host · DialKit latency and refusal"><PromiseResult /></Bench><SwiftCapture name="toast-promise" maxWidth={760} /></Section>
      <Section id="deck" title="Tune the deck" lede="The Toast deck panel sets how much smaller and how far up each card behind sits, swaps the spring a new card arrives on, and stretches time. Deal five to fill the deck.">
        <Bench caption="step · peek · arrival spring · slow">
          <DeckTuner />
        </Bench>
      </Section>
      <UsageSection agent={agentGuide} />
      <Section id="x-ray" title="X-ray" lede="See what the toast is made of. Click an icon to learn about one part and change it.">
        <ToastXray />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: reactSource },
          { id: 'css', label: 'CSS', code: ownCss },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
      <Section title="Rules">
        <Rules rules={[
          { id: 'O1', title: 'Your actions, never recognition', body: 'No toast, badge or sound when the surface recognises something.', origin: 'Reference design 03 §13' },
          { id: 'O2', title: 'Undo whenever it can be undone', body: '⌘Z or Ctrl+Z undoes the focused toast, otherwise the latest undoable change. Text editing keeps its own Undo; undoShortcut=false leaves shortcuts to the host.', origin: 'Reference design 04 §12' },
          { id: 'O3', title: 'A deck, newest in front', body: 'A new result rises into the front as the older ones step back behind it; three are drawn, the rest counted. The same result again counts (×2) instead of adding a card.', origin: 'Owner, 2026-09-30' },
          { id: 'O4', title: 'Success carries its check; errors stay', body: 'Never colour alone; an error waits until it is resolved.', origin: 'DS-34' },
        ]} />
      </Section>
    </ToastProvider>
  );
}
