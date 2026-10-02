import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, ColourCue, MarkLine, useCueDocument } from '@unlocalhosted/metalui';
import { UndoIcon, RedoIcon } from '@unlocalhosted/metalui/icons';
import { Bench, Code, PageHeader, Section, Rules } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import source from '../../../../../packages/metalui/src/components/colour-cue/colour-cue.tsx?raw';
import swift from '../../../../../swift/Sources/MetalUI/Components/MetalColourCue.swift?raw';
import guide from '../../../../../packages/metalui/src/components/colour-cue/colour-cue.agent.md?raw';

export function ColourCueDocument() {
  const doc = useCueDocument('🎨 Paint #FF6B3D with Sam.', { start: 2, end: 2 });
  const editor = React.useRef<HTMLTextAreaElement>(null);
  const match = /#[0-9a-f]{6}\b/i.exec(doc.source);
  const d = useDialKit('Colour cue', { readOnly: false, disabled: false, raw: false });
  React.useLayoutEffect(() => {
    if (editor.current && document.activeElement === editor.current) editor.current.setSelectionRange(doc.selection.start, doc.selection.end, doc.selection.direction);
  }, [doc.source, doc.selection]);
  const begin = () => { const current = /#[0-9a-f]{6}\b/i.exec(doc.source); return current ? doc.begin({ start: current.index, end: current.index + current[0].length }) : false; };
  return <div data-testid="colour-document" className="mu-stack gap-mu-group w-full">
    <label className="mu-stack gap-mu-related type-label text-ink2">Source text
      <textarea ref={editor} aria-label="Colour source" className="material-well type-content text-ink rounded-field p-mu-space-12 w-full" value={doc.source}
        onChange={event => doc.setSource(event.target.value, { start: event.target.selectionStart, end: event.target.selectionEnd })}
        onSelect={event => doc.setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd })} onBlur={doc.commit} />
    </label>
    <MarkLine><span>Paint </span><ColourCue label="Paint colour" value={match?.[0] ?? '#FF6B3D'} editing={doc.editing} onBegin={begin} onSourceChange={doc.replace}
      onCommit={doc.commit} onCancel={reason => { if (reason !== 'external') doc.cancel(); }} readOnly={d.readOnly} disabled={d.disabled || !match} raw={d.raw} />{' '}<span data-testid="colour-neighbour">with Sam.</span></MarkLine>
    <div className="mu-cluster gap-mu-related">
      <Button size="compact" icon={<UndoIcon />} disabled={!doc.canUndo && !doc.editing} onClick={doc.undo}>Undo colour edit</Button>
      <Button size="compact" icon={<RedoIcon />} disabled={!doc.canRedo || doc.editing} onClick={doc.redo}>Redo colour edit</Button>
      <span className="type-meta text-ink2" role="status">{doc.editing ? 'Hue preview' : 'Committed'} · selection {doc.selection.start}–{doc.selection.end}</span>
    </div>
    <MarkLine><ColourCue label="Read-only colour" value="#334455" readOnly />{' '}<ColourCue label="Disabled colour" value="#556677" disabled />{' '}<ColourCue label="Achromatic colour" value="#888888" /></MarkLine>
  </div>;
}
export default function ColourCuePage() {
  return <><PageHeader title="Colour cue" lede="The colour word opens a well. Drag hue or use the keyboard: the full hex rewrites live, saturation and lightness stay held, and one release records one source edit." />
    <Section id="source" title="Colour inside the text" lede="The fixed mono footprint keeps the next words in place. Escape cancels a held edit; release commits. Undo restores the original source and retained selection."><Bench caption="Real source · shared well · hue detents"><ColourCueDocument /></Bench></Section>
    <Section title="SwiftUI" lede="MetalColourCue shares the Mark, Well and Slider recipes. Its native popup uses the existing MetalPopover presentation; that donor's material port remains WIP."><SwiftCapture name="colour-cue" /><Code label="SwiftUI" code={swift} /></Section>
    <Section title="Source"><Code label="React" code={source} /><Code label="Agent guide" code={guide} /></Section>
    <Section title="Rules"><Rules rules={[{ id: 'C1', title: 'Source owns the edit', body: 'Recognition never writes. A controlled hex preview replaces one explicit source range and commits one history step per gesture.', origin: 'CUE-EDITING' }, { id: 'C2', title: 'One shared look', body: 'The Mark colour face, Well, Slider and Popover supply every material and motion. Hue changes retain saturation and lightness; grey stays grey.', origin: 'COMPOSITION' }]} /></Section>
  </>;
}
