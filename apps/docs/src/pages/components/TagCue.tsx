import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, TagCue, MarkLine, Popover, useCueDocument } from '@unlocalhosted/metalui';
import { UndoIcon, RedoIcon } from '@unlocalhosted/metalui/icons';
import { ComponentPage } from '../../ui/ComponentPage';
import source from '../../../../../packages/metalui/src/components/tag-cue/tag-cue.tsx?raw';
import swift from '../../../../../swift/Sources/MetalUI/Components/MetalTagCue.swift?raw';
import guide from '../../../../../packages/metalui/src/components/tag-cue/tag-cue.agent.md?raw';
const RECENT = ['#poster', '#studio', '#coffee', '#long-project'];
export function TagCueDocument() {
  const doc = useCueDocument('🎨 Send #poster with Sam.', { start: 2, end: 2 });
  const editor = React.useRef<HTMLInputElement>(null);
  const latest = React.useRef(doc); latest.current = doc;
  const [capture, setCapture] = React.useState<{ start: number; end: number; source: string } | null>(null);
  const d = useDialKit('Tag cue', { readOnly: false, disabled: false, raw: false });
  const match = /#[\p{L}\p{N}_-]+/u.exec(doc.source);
  React.useLayoutEffect(() => {
    if (editor.current && document.activeElement === editor.current) editor.current.setSelectionRange(doc.selection.start, doc.selection.end, doc.selection.direction);
  }, [doc.source, doc.selection]);
  React.useEffect(() => { if (capture && (capture.source !== doc.source || d.readOnly || d.disabled)) setCapture(null); }, [doc.source, capture, d.readOnly, d.disabled]);
  const choose = (tag: string) => {
    if (!capture || capture.source !== doc.source || d.disabled || d.readOnly || !doc.begin(capture)) return;
    doc.replace(tag); doc.commit(); setCapture(null);
  };
  return <div data-testid="tag-document" className="mu-stack gap-mu-group w-full">
    <label className="mu-stack gap-mu-related type-label text-ink2">Editable source · type # for recent tags
      <input ref={editor} aria-label="Tag source" className="material-well type-content text-ink rounded-field p-mu-space-12 w-full" value={doc.source} readOnly={d.readOnly} disabled={d.disabled}
        onChange={event => {
          const input = event.currentTarget, caret = input.selectionStart ?? input.value.length;
          doc.setSource(input.value, { start: caret, end: input.selectionEnd ?? caret });
          const unfinished = /#[\p{L}\p{N}_-]*$/u.exec(input.value.slice(0, caret));
          if (unfinished && !RECENT.includes(unfinished[0])) setCapture({ start: unfinished.index, end: caret, source: input.value });
        }}
        onSelect={event => { const input = event.currentTarget; doc.setSelection({ start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0 }); }} onBlur={doc.commit}
        onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? doc.redo() : doc.undo(); } }} />
    </label>
    <Popover open={!!capture} onOpenChange={open => { if (!open) setCapture(null); }}>
      <Popover.Content anchor={editor} align="start" aria-label="Recent tag completion" onKeyDownCapture={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setCapture(null); } }} finalFocus={() => {
        requestAnimationFrame(() => { const input = editor.current, selection = latest.current.selection; if (input && document.activeElement === input) input.setSelectionRange(selection.start, selection.end, selection.direction); });
        return editor.current;
      }}>
        <Popover.Title>Recent tags</Popover.Title>
        <Popover.Description>Searching keeps your typed hash. Choose one exact recent word.</Popover.Description>
        <Popover.Body><TagCue.Picker recentTags={RECENT} label="Find a recent tag" onChoose={choose} /></Popover.Body>
      </Popover.Content>
    </Popover>
    <MarkLine>{match ? <><span>{doc.source.slice(0, match.index)}</span><TagCue value={match[0]} recentTags={RECENT} label="Project tag"
      editing={doc.editing} raw={d.raw} readOnly={d.readOnly} disabled={d.disabled} onBegin={() => doc.begin({ start: match.index, end: match.index + match[0].length })}
      onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} /><span data-testid="tag-neighbour">{doc.source.slice(match.index + match[0].length)}</span></> : doc.source}</MarkLine>
    <div className="mu-cluster gap-mu-related">
      <Button size="compact" icon={<UndoIcon />} disabled={!doc.canUndo && !doc.editing} onClick={doc.undo}>Undo tag edit</Button>
      <Button size="compact" icon={<RedoIcon />} disabled={!doc.canRedo || doc.editing} onClick={doc.redo}>Redo tag edit</Button>
      <output className="type-meta text-ink2" aria-label="Tag selection">UTF16 {doc.selection.start}–{doc.selection.end}</output>
    </div>
    <MarkLine><TagCue label="Read-only tag" value="#coffee" recentTags={RECENT} readOnly onChange={() => {}} />{' '}<TagCue label="Disabled tag" value="#poster" recentTags={RECENT} disabled onChange={() => {}} /></MarkLine>
  </div>;
}
export default function TagCuePage() {
  return <ComponentPage title="Tag cue" lede="The same raised tag tab, operated in place. Recent words cycle without moving the line; typing a hash opens the tags you have used."
    play={{ lede: 'Focus and scroll, use arrows or Space, or hold and drag vertically. Type # at any caret in the source input: search then choose; Escape leaves the typed hash. Each choice or completed scrub has its own Undo.', caption: 'canonical identity · recent source words · one history step', node: <TagCueDocument /> }}
    usage={`<TagCue value={tag} recentTags={recent} label="Project tag"
  editing={doc.editing} onBegin={() => doc.begin(range)}
  onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} />
// After typing #, capture that source range and anchor the shared Popover.
<TagCue.Picker recentTags={recent} label="Find a recent tag" onChoose={replaceCapturedHash} />`}
    sources={[{ id: 'react', label: 'React', code: source }, { id: 'swift', label: 'SwiftUI', code: swift }, { id: 'agent', label: 'Agent guide', code: guide }]}
    rules={[{ id: 'T1', title: 'One identity', body: 'The exact tag selects the generated palette. Cycling never borrows a finite state tint or creates a second tag look.', origin: 'Cue grammar' }, { id: 'T2', title: 'Source is captured once', body: 'Autocomplete replaces only the unfinished hash at the retained caret. Search and dismissal never write source.', origin: 'CUE-EDITING' }]} />;
}
