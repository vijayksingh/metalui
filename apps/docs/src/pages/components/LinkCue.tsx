import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, LinkCue, MarkLine, ProvenanceTooltip, useCueDocument } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/link-cue/link-cue.tsx?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalLinkCue.swift?raw';
import cssSource from '../../../../../packages/metalui/src/components/link-cue/link-cue.css?raw';
import guide from '../../../../../packages/metalui/src/components/link-cue/link-cue.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';
const FOOTPRINT = ['https://metalui.dev/components/provenance-tooltip?section=editing', 'metalui.dev'];
export function LinkCueDocument() {
  const d = useDialKit('Link source', { raw: false, readOnly: false, disabled: false, mounted: true });
  const doc = useCueDocument('🧠 Read https://metalui.dev/overview before Friday.', { start: 49, end: 49 });
  const editor = React.useRef<HTMLTextAreaElement>(null);
  const match = /https?:\/\/\S+/i.exec(doc.source);
  React.useLayoutEffect(() => { if (editor.current && document.activeElement === editor.current) editor.current.setSelectionRange(doc.selection.start, doc.selection.end, doc.selection.direction); }, [doc.source, doc.selection]);
  function retain(event: React.SyntheticEvent<HTMLTextAreaElement>) { doc.setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection }); }
  return <div className="mu-stack gap-mu-related w-full" data-testid="link-document" data-editing={doc.editing || undefined}>
    <MarkLine><span>{match ? doc.source.slice(0, match.index) : doc.source}</span>{match && d.mounted ? <ProvenanceTooltip source="You" detail={["linked words"]}><LinkCue value={match[0]} label="Reference" footprint={FOOTPRINT} raw={d.raw} readOnly={d.readOnly} disabled={d.disabled} editing={doc.editing}
      onBegin={() => doc.begin({ start: match.index, end: match.index + match[0].length })} onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} /></ProvenanceTooltip> : match?.[0]}<span data-link-tail>{match ? doc.source.slice(match.index + match[0].length) : ''}</span></MarkLine>
    <label className="mu-stack gap-mu-related type-label text-ink2">Editable document source
      <textarea ref={editor} aria-label="Link document source" className="text-entry type-content material-well rounded-field p-mu-space-12 w-full text-ink" value={doc.source}
        onChange={event => doc.setSource(event.target.value, { start: event.target.selectionStart, end: event.target.selectionEnd, direction: event.target.selectionDirection })}
        onSelect={retain} onKeyUp={retain} onPointerUp={retain}
        onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) doc.redo(); else doc.undo(); } }} />
    </label>
    <div className="mu-cluster gap-mu-related"><Button size="compact" disabled={!doc.canUndo && !doc.editing} onClick={doc.undo}>Undo link edit</Button><Button size="compact" disabled={!doc.canRedo || doc.editing} onClick={doc.redo}>Redo link edit</Button></div>
    <output aria-label="Link retained selection" className="type-readout text-ink2">UTF16 {doc.selection.start}–{doc.selection.end} · {doc.editing ? 'preview' : 'committed'}</output>
  </div>;
}
export default function LinkCuePage() {
  return <ComponentPage title="Link cue" lede="A real destination remains a link. A separate edit key changes the full URL written in the document."
    play={{ lede: 'Enter on the host chip follows its destination. Focus or hover reveals the pen key; Enter there opens the source field. Confirm writes your exact URL once. Escape leaves the document and selection unchanged. The host reserves the longest permitted source and host words before editing.', caption: 'follow destination · edit source · one Undo', node: <LinkCueDocument /> }}
    usage={`<LinkCue value={url} label="Reference" footprint={allowedWords}
  editing={doc.editing} onBegin={() => doc.begin(range)}
  onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} />`}
    sources={[{ id: 'react', label: 'React', code: reactSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'css', label: 'CSS contract', code: cssSource }, { id: 'agent', label: 'Agent guide', code: guide }]}
    rules={[{ id: 'LC1', title: 'Following is a link operation', body: 'The chip is a real anchor. Editing is a separate named key; it never hijacks a navigation click.', origin: 'Ours' }, { id: 'LC2', title: 'The source keeps its spelling', body: 'Parsing validates navigation, without rewriting case, escaping, path, query or hash. Only a confirmed host change writes words.', origin: 'Ours' }, { id: 'LC3', title: 'The host pays for the widest URL first', body: 'Declare permitted source words and resolved displays. An oversized draft stays in the field as a refusal; it cannot stretch the source line.', origin: 'Ours' }]} />;
}
