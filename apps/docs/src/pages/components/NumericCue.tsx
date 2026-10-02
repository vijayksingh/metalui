import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, MarkLine, NumericCue, useCueDocument, type NumericCueUnit, type NumericCueValue } from '@unlocalhosted/metalui';
import { ComponentPage } from '../../ui/ComponentPage';
import { Code } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import reactSource from '../../../../../packages/metalui/src/components/numeric-cue/numeric-cue.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/numeric-cue/numeric-cue.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalNumericCue.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/numeric-cue/numeric-cue.agent.md?raw';

const compact = (n: number) => String(n);
const duration = (n: number) => { const hours = Math.floor(n / 60), minutes = Number((n % 60).toFixed(2)); return hours ? `${hours}h${minutes || ''}` : `${minutes}min`; };
const clock = (n: number) => { const minute = Math.round(n) % 1440, h = Math.floor(minute / 60); return `${h % 12 || 12}${minute % 60 ? `:${String(minute % 60).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`; };
const hours: readonly NumericCueUnit[] = [
  { id: 'h', label: 'hours', factor: 60, step: 1 / 12, smallStep: 1 / 60, largeStep: 1, format: n => duration(n * 60), source: n => `${compact(n)}h` },
  { id: 'min', label: 'minutes', factor: 1, step: 5, smallStep: 1, largeStep: 60, format: n => `${compact(n)} min`, source: n => `${compact(n)}min` },
];
const money: readonly NumericCueUnit[] = [
  { id: 'USD', label: 'dollars', factor: 1, step: 1, smallStep: .01, largeStep: 10, format: n => `$${n.toFixed(2)}`, source: n => `$${compact(n)}` },
  { id: 'EUR', label: 'euros, example host factor', factor: .9, step: 1, smallStep: .01, largeStep: 10, format: n => `€${n.toFixed(2)}`, source: n => `€${compact(n)}` },
];
const length: readonly NumericCueUnit[] = [
  { id: 'cm', label: 'centimetres', factor: 1, step: 1, smallStep: .1, largeStep: 10, format: n => `${compact(n)} cm`, source: n => `${compact(n)}cm` },
  { id: 'm', label: 'metres', factor: 100, step: .01, smallStep: .001, largeStep: .1, format: n => `${compact(n)} m`, source: n => `${compact(n)}m` },
];
const time: readonly NumericCueUnit[] = [{ id: 'clock', label: 'time of day', factor: 1, step: 15, smallStep: 1, largeStep: 60, format: clock, source: clock }];
const reservations = ['0.0833333333333333h', '0.0833333333333333 h', '1440 min', '$100.00', '€111.111111111111', '1200 cm', '12.00 m', '12:59pm'];

function DocumentHost() {
  const d = useDialKit('Numeric cue', { raw: false, disabled: false, readOnly: false });
  const document = useCueDocument('slept 6h');
  const editor = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const field = editor.current;
    if (field && (field.selectionStart !== document.selection.start || field.selectionEnd !== document.selection.end)) field.setSelectionRange(document.selection.start, document.selection.end, document.selection.direction);
  }, [document.source, document.selection]);
  const [amount, setAmount] = React.useState<NumericCueValue>({ value: 360, unit: 'h' });
  const [begin, setBegin] = React.useState(0), [commit, setCommit] = React.useState(0), [cancel, setCancel] = React.useState(0);
  const [externallyLocked, setExternallyLocked] = React.useState(false);
  const sync = (source: string) => {
    const found = source.match(/([\d.]+)(h|min)/);
    if (found) setAmount({ value: Number(found[1]) * (found[2] === 'h' ? 60 : 1), unit: found[2] });
  };
  const restore = (action: () => void) => { action(); };
  React.useEffect(() => { if (!document.editing) sync(document.source); }, [document.source, document.editing]);
  return <div className="mu-stack gap-mu-group w-full" data-testid="numeric-document">
    <MarkLine className="type-content text-ink" data-testid="numeric-line">slept <NumericCue label="Sleep" kind="duration" meaning="sleep" value={amount} onValueChange={setAmount}
      units={hours} min={0} max={1440} footprint={reservations} raw={d.raw} disabled={d.disabled || externallyLocked} readOnly={d.readOnly}
      onBegin={() => { const match = document.source.match(/([\d.]+)(h|min)/); if (match?.index != null) document.begin({ start: match.index, end: match.index + match[0].length }); setBegin(n => n + 1); }}
      onSourceChange={words => document.replace(words)} onCommit={() => { document.commit(); setCommit(n => n + 1); }}
      onCancel={reason => { if (reason !== 'external') document.cancel(); else document.commit(); setCancel(n => n + 1); }} /> after work</MarkLine>
    <textarea ref={editor} aria-label="Source document" value={document.source} className="w-full h-mu-space-80 material-well rounded-row p-mu-space-12 type-content text-ink"
      onChange={event => { document.setSource(event.target.value, { start: event.target.selectionStart, end: event.target.selectionEnd, direction: event.target.selectionDirection }); sync(event.target.value); }}
      onSelect={event => { if (!document.editing && globalThis.document.activeElement === event.currentTarget) document.setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection }); }} />
    <div className="mu-cluster gap-mu-related">
      <Button cap="strip" disabled={!document.canUndo} onClick={() => restore(document.undo)}>Undo source</Button>
      <Button cap="strip" disabled={!document.canRedo} onClick={() => restore(document.redo)}>Redo source</Button>
      <Button cap="strip" onClick={() => { document.setSource('slept 2h'); setAmount({ value: 120, unit: 'h' }); }}>External source</Button>
      <Button cap="strip" onClick={() => setExternallyLocked(v => !v)}>Toggle disabled</Button>
    </div>
    <output className="type-readout text-ink2" data-testid="numeric-events">begin {begin} · commit {commit} · cancel {cancel} · quantity {amount.value} · unit {amount.unit}</output>
  </div>;
}
function Examples() {
  const [duration, setDuration] = React.useState<NumericCueValue>({ value: 90, unit: 'h' });
  const [cost, setCost] = React.useState<NumericCueValue>({ value: 40, unit: 'USD' });
  const [distance, setDistance] = React.useState<NumericCueValue>({ value: 120, unit: 'cm' });
  const [at, setAt] = React.useState<NumericCueValue>({ value: 960, unit: 'clock' });
  return <div className="mu-stack gap-mu-group type-content text-ink" data-testid="numeric-examples">
    <MarkLine>Spend <NumericCue label="Budget" kind="amount" meaning="money" value={cost} onValueChange={setCost} units={money} min={0} max={100} footprint={reservations} /> on materials.</MarkLine>
    <p className="type-meta text-ink2">Money conversion uses the explicit example host factor: 1 EUR = 0.9 USD. This is a demonstration factor, not a market rate.</p>
    <MarkLine>Work for <NumericCue label="Duration" kind="duration" meaning="time" value={duration} onValueChange={setDuration} units={hours} min={0} max={1440} footprint={reservations} /> then pause.</MarkLine>
    <MarkLine>Measure <NumericCue label="Length" value={distance} onValueChange={setDistance} units={length} min={0} max={1200} footprint={reservations} /> from the edge.</MarkLine>
    <MarkLine>Meet at <NumericCue label="Time" kind="date" meaning="time" value={at} onValueChange={setAt} units={time} min={0} max={1439} footprint={reservations} /> for coffee.</MarkLine>
    <MarkLine>Locked <NumericCue label="Read only amount" value={distance} onValueChange={setDistance} units={length} min={0} max={1200} footprint={reservations} readOnly />; unavailable <NumericCue label="Disabled amount" value={distance} onValueChange={setDistance} units={length} min={0} max={1200} footprint={reservations} disabled />.</MarkLine>
  </div>;
}
export default function NumericCuePage() {
  return <ComponentPage title="Numeric cue" lede="A quantity operated inside a sentence. Scrub vertically, convert horizontally, or type it. The host keeps source text, formats, factors and one gesture of history."
    play={{ lede: 'Drag Sleep up or down. Shift steps an hour; Alt steps a minute. Drag horizontally to convert. Tab and type, or use Alt+Left/Right. Escape cancels. Undo restores the whole gesture.', caption: 'source text · one gesture · one undo', node: <DocumentHost /> }}
    more={[{ id: 'native', title: 'SwiftUI', lede: 'The native control shares quantity, source transaction, footprint, motion and haptic contracts.', node: <SwiftCapture name="numeric-cue" maxWidth={600} /> }, { id: 'quantities', title: 'Amounts, duration, time and measurement', lede: 'The same canonical contract; hosts supply steps, source spellings and every conversion factor.', node: <Examples /> },
      { id: 'source-contract', title: 'A source host', lede: 'Ranges and selection use UTF16 offsets. External replacement invalidates a stale gesture.', node: <Code label="Source history" code={`<NumericCue value={quantity} onValueChange={setQuantity}\n  units={units} min={0} max={1440} footprint={allFaces} label="Sleep"\n  onBegin={() => document.begin(range)}\n  onSourceChange={document.replace}\n  onCommit={document.commit}\n  onCancel={reason => reason === 'external' ? document.commit() : document.cancel()} />`} /> }]}
    sources={[{ id: 'react', label: 'React', code: reactSource }, { id: 'css', label: 'CSS', code: cssSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'agent', label: 'Agent guide', code: agentSource }]}
    rules={[{ id: 'NC1', title: 'The host keeps the source', body: 'Format is decoration; source() supplies replacement words. One drag creates one undo entry. Recognition writes nothing.', origin: 'Cue editing' },
      { id: 'NC2', title: 'Reserve every face', body: 'Explicit footprint strings cover all raw and formatted values in every allowed unit. No frame measures text during motion.', origin: 'Cue editing' },
      { id: 'NC3', title: 'Conversion preserves quantity', body: 'Each factor means canonical quantity per displayed unit. Currency factors are explicit host input.', origin: 'Domain contract' }]}
    usage={`<NumericCue label="Sleep" value={value} onValueChange={setValue}\n  units={units} min={0} max={1440} footprint={allFaces}\n  kind="duration" meaning="sleep" />`} />;
}
