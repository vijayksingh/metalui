import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, EnumCue, MarkLine, useCueDocument, type EnumCueChoice } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/enum-cue/enum-cue.tsx?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalEnumCue.swift?raw';
import cssSource from '../../../../../packages/metalui/src/components/enum-cue/enum-cue.css?raw';
import guide from '../../../../../packages/metalui/src/components/enum-cue/enum-cue.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

const STATES: readonly EnumCueChoice[] = [
  { value: '#todo', label: 'To do', glyph: 'note', tint: 'var(--mu-ink3)' },
  { value: '#doing', label: 'Doing', glyph: 'clock', tint: 'var(--mu-orange)' },
  { value: '#done', label: 'Done', glyph: 'check', tint: 'var(--mu-green-deep)' },
  { value: '#dropped', label: 'Dropped', glyph: 'close', tint: 'var(--mu-ink3)' },
];
export function EnumCueDocument() {
  const d = useDialKit('Enum source', { raw: false, readOnly: false, disabled: false, mounted: true });
  const doc = useCueDocument('🧠 Task #todo, send the poster.', { start: 30, end: 30 });
  const editor = React.useRef<HTMLTextAreaElement>(null);
  const match = /#[\p{L}-]+/u.exec(doc.source);
  const before = match ? doc.source.slice(0, match.index) : doc.source;
  const after = match ? doc.source.slice(match.index + match[0].length) : '';
  React.useLayoutEffect(() => {
    if (editor.current && document.activeElement === editor.current) editor.current.setSelectionRange(doc.selection.start, doc.selection.end, doc.selection.direction);
  }, [doc.source, doc.selection]);
  function retain(event: React.SyntheticEvent<HTMLTextAreaElement>) { doc.setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection }); }
  return <div className="mu-stack gap-mu-related w-full" data-testid="enum-document" data-editing={doc.editing || undefined}>
    <MarkLine data-testid="enum-line"><span>{before}</span>{match && d.mounted ? <EnumCue value={match[0]} choices={STATES} label="Task state" raw={d.raw} readOnly={d.readOnly} disabled={d.disabled} editing={doc.editing}
      onBegin={() => doc.begin({ start: match.index, end: match.index + match[0].length })} onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} /> : match?.[0]}<span data-enum-tail>{after}</span></MarkLine>
    <label className="mu-stack gap-mu-related type-label text-ink2">Editable document source
      <textarea ref={editor} aria-label="Enum document source" className="type-content material-well rounded-field p-mu-space-12 w-full text-ink" value={doc.source}
        onChange={event => doc.setSource(event.target.value, { start: event.target.selectionStart, end: event.target.selectionEnd, direction: event.target.selectionDirection })}
        onSelect={retain} onKeyUp={retain} onPointerUp={retain}
        onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) doc.redo(); else doc.undo(); } }} />
    </label>
    <div className="mu-cluster gap-mu-related"><Button size="compact" disabled={!doc.canUndo && !doc.editing} onClick={doc.undo}>Undo enum edit</Button><Button size="compact" disabled={!doc.canRedo || doc.editing} onClick={doc.redo}>Redo enum edit</Button><Button size="compact" disabled={!doc.editing} onClick={doc.cancel}>Cancel held state</Button></div>
    <output aria-label="Enum retained selection" className="type-readout text-ink2">UTF16 {doc.selection.start}–{doc.selection.end} · {doc.editing ? 'preview' : 'committed'}</output>
  </div>;
}
export default function EnumCuePage() {
  return <ComponentPage title="Enum cue" lede="A finite state in your own words. Its tab stays in the line while you turn through the states the document permits."
    play={{ lede: 'Click or Space cycles; Up/Down steps. Focus the state to scroll, or hold and drag vertically. Escape restores a held edit. Each finished gesture is one Undo, and the neighbouring words stay in place. The Enum source panel switches raw, read-only, disabled and mounted states.', caption: 'source words · one gesture · one history entry', node: <EnumCueDocument /> }}
    usage={`<EnumCue value={state} choices={states} label="Task state"
  editing={doc.editing} onBegin={() => doc.begin(range)}
  onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} />`}
    sources={[{ id: 'react', label: 'React', code: reactSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'css', label: 'CSS contract', code: cssSource }, { id: 'agent', label: 'Agent guide', code: guide }]}
    rules={[{ id: 'EC1', title: 'The host declares the states', body: 'Complete words, their order, optional glyphs and explicit state tints. Colour never carries the meaning alone.', origin: 'Ours' }, { id: 'EC2', title: 'The widest state pays first', body: 'Raw, cued, held and cancelled states share one reserved footprint. Adjacent text never slides.', origin: 'Ours' }, { id: 'EC3', title: 'A gesture has one past', body: 'Preview only the active source range. Release commits once; Escape restores the captured source and UTF16 selection.', origin: 'Ours' }]} />;
}
