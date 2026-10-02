import * as React from 'react';
import { Button, NumberField, useCueDocument } from '@unlocalhosted/metalui';

/** A real document host; each NumberField scrub is one source/history transaction. */
export function CueDocumentProof() {
  const doc = useCueDocument('🧠 Send #poster, slept 6h. After the edit.', { start: 2, end: 2 });
  const editor = React.useRef<HTMLTextAreaElement>(null);
  const amount = /\b(\d+)h\b/.exec(doc.source);
  const value = Number(amount?.[1] ?? 6);
  React.useLayoutEffect(() => {
    const input = editor.current;
    if (input && document.activeElement === input) input.setSelectionRange(doc.selection.start, doc.selection.end, doc.selection.direction);
  }, [doc.source, doc.selection]);
  const begin = () => {
    const match = /\b\d+h\b/.exec(doc.source);
    if (match) doc.begin({ start: match.index, end: match.index + match[0].length });
  };
  return <div className="mu-stack gap-mu-related w-full" data-testid="cue-document-proof"
    onKeyDown={event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) doc.redo(); else doc.undo(); }
      if (event.key === 'Escape' && doc.editing) { event.preventDefault(); doc.cancel(); }
    }}>
    <label className="mu-stack gap-mu-related type-label text-ink2">Document source
      <textarea ref={editor} aria-label="Document source" className="type-content material-well rounded-field p-mu-space-12 w-full text-ink"
        value={doc.source} onChange={event => doc.setSource(event.target.value, { start: event.target.selectionStart, end: event.target.selectionEnd, direction: event.target.selectionDirection })}
        onKeyUp={event => doc.setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection })}
        onPointerUp={event => doc.setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection })}
        onBlur={doc.commit} />
    </label>
    <div className="mu-cluster gap-mu-related">
      <NumberField label="Sleep duration" value={value} min={1} max={24} disabled={!amount}
        onValueChange={next => { if (next === null) return; if (!doc.editing) begin(); doc.replace(`${next}h`); }} onValueCommitted={doc.commit} />
      <Button size="compact" disabled={!doc.canUndo && !doc.editing} onClick={doc.undo}>Undo source edit</Button>
      <Button size="compact" disabled={!doc.canRedo || doc.editing} onClick={doc.redo}>Redo source edit</Button>
      <Button size="compact" disabled={!doc.editing} onClick={doc.cancel}>Cancel current edit</Button>
    </div>
    <output aria-label="Retained selection" className="type-readout text-ink2">UTF16 selection {doc.selection.start}–{doc.selection.end} · {doc.editing ? 'gesture preview' : 'committed'}</output>
  </div>;
}
