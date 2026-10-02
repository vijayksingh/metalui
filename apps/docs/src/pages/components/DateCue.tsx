import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, DateCue, MarkLine, relativeDateWords, useCueDocument } from '@unlocalhosted/metalui';
import { ComponentPage } from '../../ui/ComponentPage';
import { Code } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import reactSource from '../../../../../packages/metalui/src/components/date-cue/date-cue.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/date-cue/date-cue.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalDateCue.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/date-cue/date-cue.agent.md?raw';
const today = '2026-03-07', min = '2026-03-01', max = '2026-04-30';
const days = Array.from({ length: 61 }, (_, index) => new Date(Date.UTC(2026, 2, 1 + index)).toISOString().slice(0, 10));
const footprint = [...days, ...days.map(day => relativeDateWords(day, today)), ...days.map(day => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`)))];
function Host() {
  const d = useDialKit('Date cue', { raw: false, readOnly: false, disabled: false });
  const document = useCueDocument('meet tomorrow after lunch');
  const editor = React.useRef<HTMLTextAreaElement>(null);
  const [day, setDay] = React.useState('2026-03-08');
  const [locked, setLocked] = React.useState(false);
  const [begin, setBegin] = React.useState(0), [commit, setCommit] = React.useState(0), [cancel, setCancel] = React.useState(0);
  const found = days.map(day => ({ day, words: relativeDateWords(day, today) })).find(candidate => document.source.includes(candidate.words));
  React.useEffect(() => { if (!document.editing && found) setDay(found.day); }, [document.source, document.editing]);
  React.useLayoutEffect(() => {
    const field = editor.current;
    if (field && (field.selectionStart !== document.selection.start || field.selectionEnd !== document.selection.end)) field.setSelectionRange(document.selection.start, document.selection.end, document.selection.direction);
  }, [document.source, document.selection]);
  return <div className="mu-stack gap-mu-group w-full" data-testid="date-document">
    <MarkLine className="type-content text-ink">meet <DateCue value={day} onValueChange={setDay} today={today} min={min} max={max} footprint={footprint} label="Meeting day"
      raw={d.raw} disabled={d.disabled || locked} readOnly={d.readOnly}
      onBegin={() => { const words = found?.words ?? relativeDateWords(day, today); const start = document.source.indexOf(words); if (start >= 0) document.begin({ start, end: start + words.length }); setBegin(n => n + 1); }}
      onSourceChange={document.replace} onCommit={() => { document.commit(); setCommit(n => n + 1); }}
      onCancel={reason => { if (reason === 'external') document.commit(); else document.cancel(); setCancel(n => n + 1); }} /> after lunch</MarkLine>
    <textarea ref={editor} aria-label="Date source document" value={document.source} className="w-full h-mu-space-80 material-well rounded-row p-mu-space-12 type-content text-ink"
      onChange={event => document.setSource(event.target.value, { start: event.target.selectionStart, end: event.target.selectionEnd, direction: event.target.selectionDirection })}
      onSelect={event => { if (!document.editing && globalThis.document.activeElement === event.currentTarget) document.setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection }); }} />
    <div className="mu-cluster gap-mu-related">
      <Button cap="strip" disabled={!document.canUndo} onClick={document.undo}>Undo date</Button>
      <Button cap="strip" disabled={!document.canRedo} onClick={document.redo}>Redo date</Button>
      <Button cap="strip" onClick={() => { document.setSource('meet today after lunch'); setDay(today); }}>External date</Button>
      <Button cap="strip" onClick={() => setLocked(v => !v)}>Toggle date disabled</Button>
    </div>
    <output className="type-readout text-ink2" data-testid="date-events">begin {begin} · commit {commit} · cancel {cancel} · day {day}</output>
    <p className="type-meta text-ink2">Today is explicitly 7 March 2026. March 8 crosses a daylight-saving boundary in America/New_York; civil day steps retain the date.</p>
  </div>;
}
function States() {
  const [day, setDay] = React.useState('2026-03-08');
  return <div className="mu-stack gap-mu-group type-content text-ink">
    <MarkLine>Read only <DateCue label="Read only date" value={day} onValueChange={setDay} today={today} min={min} max={max} footprint={footprint} readOnly />.</MarkLine>
    <MarkLine>Unavailable <DateCue label="Disabled date" value={day} onValueChange={setDay} today={today} min={min} max={max} footprint={footprint} disabled />.</MarkLine>
    <MarkLine>Bounded <DateCue label="Bounded date" value={day} onValueChange={setDay} today={today} min={day} max={day} footprint={footprint} />.</MarkLine>
  </div>;
}
export default function DateCuePage() {
  return <ComponentPage title="Date cue" lede="A day operated inside a sentence. Nearby relative words become resolved dates, while the host owns civil dates, source spelling and history."
    play={{ node: <Host />, caption: 'civil day · day/week detents · one undo', lede: 'Scrub vertically, or use arrows. Shift steps a week. Hold without moving, Alt+Down, Space or Enter opens Calendar. Escape cancels a scrub.' }}
    more={[{ id: 'native', title: 'SwiftUI', lede: 'The same civil-string, detent and source history contract. The shared native Popover currently uses the system panel.', node: <SwiftCapture name="date-cue" maxWidth={600} /> },
      { id: 'states', title: 'Bounds and inactive states', lede: 'Read only and disabled dates keep their words and produce no source or haptic effects.', node: <States /> },
      { id: 'source-contract', title: 'Civil dates and source', lede: 'Today is a host snapshot. Localized recognition grammars supply source(day); formatting alone never rewrites text.', node: <Code label="Date source history" code={`<DateCue label="Meeting day" value={day} onValueChange={setDay}\n  today="2026-03-07" min="2026-03-01" max="2026-04-30" footprint={allFaces}\n  onBegin={() => document.begin(range)} onSourceChange={document.replace}\n  onCommit={document.commit} onCancel={document.cancel} />`} /> }]}
    sources={[{ id: 'react', label: 'React', code: reactSource }, { id: 'css', label: 'CSS', code: cssSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'agent', label: 'Agent guide', code: agentSource }]}
    rules={[{ id: 'DC1', title: 'A civil date stays a day', body: 'Canonical YYYY-MM-DD strings and UTC ordinals keep day arithmetic independent of DST and time-zone instants.', origin: 'Date domain' },
      { id: 'DC2', title: 'Holding writes nothing', body: 'Open Calendar without a source transaction. A changed day starts one transaction; one scrub or Calendar acceptance creates one undo.', origin: 'Cue editing' },
      { id: 'DC3', title: 'Reserve every word', body: 'The footprint includes all relative, formatted and raw faces over the allowed date range.', origin: 'Cue editing' }]}
    usage={`<DateCue label="Meeting day" value={day} onValueChange={setDay}\n  today={today} min={min} max={max} footprint={allFaces} />`} />;
}
