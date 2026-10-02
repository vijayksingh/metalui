import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Avatar, Button, PersonCue, ProvenanceTooltip, MarkLine, useCueDocument, type PersonCueChoice } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/person-cue/person-cue.tsx?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalPersonCue.swift?raw';
import cssSource from '../../../../../packages/metalui/src/components/person-cue/person-cue.css?raw';
import guide from '../../../../../packages/metalui/src/components/person-cue/person-cue.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

const PEOPLE: readonly PersonCueChoice[] = [
  { value: 'Mira Chen', avatar: <Avatar name="Mira Chen" size="small" className="!size-button-compact-glyph" /> },
  { value: 'Alexandra Rivera', label: 'Alexandra', avatar: <Avatar name="Alexandra Rivera" size="small" className="!size-button-compact-glyph" /> },
  { value: 'Robin Lee', disabled: true },
  { value: 'Sam Patel' },
];
export function PersonCueDocument() {
  const d = useDialKit('Person source', { raw: false, readOnly: false, disabled: false, mounted: true });
  const doc = useCueDocument('🧠 Ask Mira Chen about the poster.', { start: 33, end: 33 });
  const editor = React.useRef<HTMLTextAreaElement>(null);
  const match = /Mira Chen|Alexandra Rivera|Robin Lee|Sam Patel/.exec(doc.source);
  React.useLayoutEffect(() => {
    if (editor.current && document.activeElement === editor.current) editor.current.setSelectionRange(doc.selection.start, doc.selection.end, doc.selection.direction);
  }, [doc.source, doc.selection]);
  function retain(event: React.SyntheticEvent<HTMLTextAreaElement>) { doc.setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection }); }
  return <div className="mu-stack gap-mu-related w-full" data-testid="person-document" data-editing={doc.editing || undefined}>
    <MarkLine data-testid="person-line"><span>{match ? doc.source.slice(0, match.index) : doc.source}</span>{match && d.mounted ? <ProvenanceTooltip source="You" detail={["known people"]}><PersonCue hint={false} value={match[0]} choices={PEOPLE} label="Assigned person" raw={d.raw} readOnly={d.readOnly} disabled={d.disabled} editing={doc.editing}
      onBegin={() => doc.begin({ start: match.index, end: match.index + match[0].length })} onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} /></ProvenanceTooltip> : match?.[0]}<span data-person-tail>{match ? doc.source.slice(match.index + match[0].length) : ''}</span></MarkLine>
    <label className="mu-stack gap-mu-related type-label text-ink2">Editable document source
      <textarea ref={editor} aria-label="Person document source" className="type-content material-well rounded-field p-mu-space-12 w-full text-ink" value={doc.source}
        onChange={event => doc.setSource(event.target.value, { start: event.target.selectionStart, end: event.target.selectionEnd, direction: event.target.selectionDirection })}
        onSelect={retain} onKeyUp={retain} onPointerUp={retain}
        onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) doc.redo(); else doc.undo(); } }} />
    </label>
    <div className="mu-cluster gap-mu-related"><Button size="compact" disabled={!doc.canUndo && !doc.editing} onClick={doc.undo}>Undo person edit</Button><Button size="compact" disabled={!doc.canRedo || doc.editing} onClick={doc.redo}>Redo person edit</Button></div>
    <output aria-label="Person retained selection" className="type-readout text-ink2">UTF16 {doc.selection.start}–{doc.selection.end} · {doc.editing ? 'preview' : 'committed'}</output>
  </div>;
}
export default function PersonCuePage() {
  return <ComponentPage title="Person cue" lede="A person's own name, operated where it is written. Choose a known person; the full name remains the document source."
    play={{ lede: 'Open the name, then choose with arrows, typeahead or a pointer. The host supplies avatars and exact names. The widest name pays for space before editing. Escape restores the captured selection; one choice is one Undo. Person source switches raw, read-only, disabled and mounted states.', caption: 'known names · exact source · one history entry', node: <PersonCueDocument /> }}
    usage={`<PersonCue value={name} choices={people} label="Assigned person"
  editing={doc.editing} onBegin={() => doc.begin(range)}
  onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} />`}
    sources={[{ id: 'react', label: 'React', code: reactSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'css', label: 'CSS contract', code: cssSource }, { id: 'agent', label: 'Agent guide', code: guide }]}
    rules={[{ id: 'PC1', title: 'Names belong to the host', body: 'Picker labels may be short. The visible name and replacement words always use the complete host source value; no identity is inferred.', origin: 'Ours' }, { id: 'PC2', title: 'The avatar is an Object slot', body: 'The host can pass Avatar; the control composes it in the Mark meaning slot. A shared person glyph is the fallback.', origin: 'Ours' }, { id: 'PC3', title: 'Choose once, remember once', body: 'Highlighting never previews source. A confirmed name commits one source range. Escape cancels the captured source and UTF16 selection.', origin: 'Ours' }]} />;
}
