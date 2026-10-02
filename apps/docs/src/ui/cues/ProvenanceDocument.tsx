import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, ColourCue, DateCue, EnumCue, LinkCue, MarkLine, NumericCue, PersonCue, Popover, ProvenanceProvider, ProvenanceTooltip, TagCue, relativeDateWords, useCueDocument, type EnumCueChoice, type NumericCueUnit, type NumericCueValue } from '@unlocalhosted/metalui';
import { CloseIcon, RedoIcon, UndoIcon } from '@unlocalhosted/metalui/icons';

export const PROVENANCE_SOURCE = 'Send #poster tomorrow 4pm, slept 6h in #done by #coffee\nPaint #FF6B3D with Sam; open https://metalui.dev.';
const recentTags = ['#poster', '#studio', '#coffee'];
const TODAY = '2026-10-02';
const dates = Array.from({ length: 29 }, (_, index) => new Date(Date.UTC(2026, 8, 18 + index)).toISOString().slice(0, 10));
const dateWords = new Map(dates.map(day => [relativeDateWords(day, TODAY), day]));
const number = (value: number) => String(Number(value.toFixed(8)));
const duration = (minutes: number) => { const hours = Math.floor(minutes / 60), rest = Number((minutes % 60).toFixed(8)); return hours ? `${hours}h${rest || ''}` : `${rest}min`; };
const clock = (minutes: number) => { const h = Math.floor(minutes / 60), m = minutes % 60; return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`; };
const sleepUnits: readonly NumericCueUnit[] = [
  { id: 'h', label: 'hours', factor: 60, step: 1 / 12, smallStep: 1 / 60, largeStep: 1, format: hours => duration(hours * 60), source: hours => duration(hours * 60) },
  { id: 'min', label: 'minutes', factor: 1, step: 5, smallStep: 1, largeStep: 60, format: minutes => `${number(minutes)}min`, source: minutes => `${number(minutes)}min` },
];
const clockUnits: readonly NumericCueUnit[] = [{ id: 'clock', label: 'time of day', factor: 1, step: 15, smallStep: 1, largeStep: 60, format: clock, source: clock }];
const states: readonly EnumCueChoice[] = [
  { value: '#todo', label: 'To do', glyph: 'note', tint: 'var(--mu-ink3)' },
  { value: '#doing', label: 'Doing', glyph: 'clock', tint: 'var(--mu-orange)' },
  { value: '#done', label: 'Done', glyph: 'check', tint: 'var(--mu-green-deep)' },
  { value: '#dropped', label: 'Dropped', glyph: 'close', tint: 'var(--mu-ink3)' },
];
type Document = ReturnType<typeof useCueDocument>;
type Kind = 'tag' | 'date' | 'clock' | 'sleep' | 'state' | 'colour' | 'person' | 'link';
interface Token { kind: Kind; words: string; start: number; end: number }
const instruction: Record<Kind, string> = { tag: 'Space cycles · Drag or Up/Down steps', date: 'Arrows change days · Hold or Enter opens Calendar', clock: 'Drag or Up/Down changes quarter hours', sleep: 'Drag vertically to change · Horizontally to convert', state: 'Space cycles · Drag or Up/Down steps', colour: 'Enter opens the colour well', person: 'Enter opens known names', link: 'Enter follows · Edit URL changes source' };
const pattern = /#[0-9a-f]{6}\b|#(?:todo|doing|done|dropped)\b|#[\p{L}\p{N}\p{M}_-]+|yesterday|today|tomorrow|(?:last|next) (?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|\d{4}-\d{2}-\d{2}|\d{1,2}(?::\d{2})?(?:am|pm)\b|\d+(?:\.\d+)?(?:h\d*|min)\b|https?:\/\/[^\s.]+(?:\.[^\s.;]+)*|\b(?:Sam|Ana|Hiro)\b/giu;
function tokens(source: string): Token[] {
  return Array.from(source.matchAll(pattern)).flatMap(match => {
    const words = match[0];
    const kind: Kind = /^#[0-9a-f]{6}$/i.test(words) ? 'colour' : states.some(state => state.value === words) ? 'state' : words.startsWith('#') ? 'tag' : dateWords.has(words) ? 'date' : /^\d{1,2}(?::\d{2})?(?:am|pm)$/.test(words) ? 'clock' : /^\d.*(?:h\d*|min)$/.test(words) ? 'sleep' : words.startsWith('http') ? 'link' : 'person';
    if (kind === 'clock') { const time = /^(\d+)(?::(\d+))?/.exec(words)!; if (Number(time[1]) < 1 || Number(time[1]) > 12 || Number(time[2] || 0) > 59) return []; }
    if (kind === 'sleep' && quantity(words, kind).value > 1440) return [];
    if (kind === 'person' && !['Sam', 'Ana', 'Hiro'].includes(words)) return [];
    return [{ words, kind, start: match.index!, end: match.index! + words.length }];
  });
}
function quantity(words: string, kind: 'clock' | 'sleep'): NumericCueValue {
  if (kind === 'clock') { const match = /^(\d+)(?::(\d+))?(am|pm)$/.exec(words)!; return { value: (Number(match[1]) % 12 + (match[3] === 'pm' ? 12 : 0)) * 60 + Number(match[2] || 0), unit: 'clock' }; }
  const match = /^(\d+(?:\.\d+)?)(h|min)(\d*)$/.exec(words)!;
  return { value: Number(match[1]) * (match[2] === 'h' ? 60 : 1) + Number(match[3] || 0), unit: match[2] };
}
function DocumentNumber({ token, doc, raw, readOnly, disabled }: { token: Token; doc: Document; raw: boolean; readOnly: boolean; disabled: boolean }) {
  const kind = token.kind as 'clock' | 'sleep';
  const [value, setValue] = React.useState(() => quantity(token.words, kind));
  const expectedWords = React.useRef(token.words);
  React.useEffect(() => { if (token.words !== expectedWords.current) { expectedWords.current = token.words; setValue(quantity(token.words, kind)); } }, [token.words, kind]);
  const hint = React.useId();
  const label = kind === 'clock' ? 'Send time' : 'Sleep';
  return <><ProvenanceTooltip disabled={doc.editing} source="You" detail={[kind === 'clock' ? 'Written clock time' : 'Written sleep quantity', instruction[kind]]}>
    <NumericCue label={label} kind={kind === 'clock' ? 'date' : 'duration'} meaning={kind === 'clock' ? 'time' : 'sleep'} value={value} onValueChange={setValue}
      units={kind === 'clock' ? clockUnits : sleepUnits} min={0} max={kind === 'clock' ? 1439 : 1440} footprint={kind === 'clock' ? ['12:59pm'] : ['1440min', '23h59', '24h']}
      hint={false} allowTyping={false} raw={raw} readOnly={readOnly} disabled={disabled} inputAria={{ 'aria-describedby': hint }}
      onBegin={() => doc.begin({ start: token.start, end: token.end })}
      onSourceChange={words => { expectedWords.current = words; doc.replace(words); }} onCommit={doc.commit}
      onCancel={reason => { if (reason !== 'external') doc.cancel(); }} />
  </ProvenanceTooltip><span id={hint} className="sr-only">You. {kind === 'clock' ? 'Written clock time. Up and Down change quarter hours.' : 'Written sleep quantity. Drag vertically to change; horizontally to convert hours and minutes.'} Shift changes larger steps, Alt finer steps. Escape cancels.</span></>;
}

/** One source, one gesture history; cue controls never become a second document. */
export function ProvenanceDocument() {
  const dial = useDialKit('Provenance source', { raw: false, readOnly: false, disabled: false, reducedMotion: false });
  const doc = useCueDocument(PROVENANCE_SOURCE, { start: PROVENANCE_SOURCE.length, end: PROVENANCE_SOURCE.length });
  const editor = React.useRef<HTMLTextAreaElement>(null);
  const description = React.useId();
  const latest = React.useRef(doc); latest.current = doc;
  const [hash, setHash] = React.useState<{ start: number; end: number; source: string } | null>(null);
  React.useEffect(() => { if (hash && (hash.source !== doc.source || dial.readOnly || dial.disabled)) setHash(null); }, [hash, doc.source, dial.readOnly, dial.disabled]);
  const chooseTag = (tag: string) => {
    if (!hash || hash.source !== doc.source || dial.readOnly || dial.disabled || !doc.begin(hash)) return;
    doc.replace(tag); doc.commit(); setHash(null);
  };
  React.useLayoutEffect(() => { const field = editor.current; if (field && document.activeElement === field) field.setSelectionRange(doc.selection.start, doc.selection.end, doc.selection.direction); }, [doc.source, doc.selection]);
  const begin = (token: Token) => doc.begin({ start: token.start, end: token.end });
  const common = { raw: dial.raw, readOnly: dial.readOnly, disabled: dial.disabled };
  function render(token: Token) {
    const key = token.kind + tokens(doc.source.slice(0, token.start)).filter(previous => previous.kind === token.kind).length;
    let cue: React.ReactElement<Record<string, unknown>>;
    switch (token.kind) {
      case 'sleep': case 'clock': return <DocumentNumber key={key} token={token} doc={doc} {...common} />;
      case 'state': cue = <EnumCue value={token.words} choices={states} label="Task state" hint={false} editing={doc.editing} onBegin={() => begin(token)} onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} {...common} />; break;
      case 'colour': cue = <ColourCue value={token.words} label="Paint colour" editing={doc.editing} onBegin={() => begin(token)} onSourceChange={doc.replace} onCommit={doc.commit} onCancel={reason => { if (reason !== 'external') doc.cancel(); }} {...common} />; break;
      case 'date': cue = <DateCue value={dateWords.get(token.words)!} today={TODAY} min={dates[0]} max={dates.at(-1)!} footprint={[...dateWords.keys(), 'Wed 30 Sept']} label="Send date" hint={false} onValueChange={() => {}} onBegin={() => begin(token)} onSourceChange={doc.replace} onCommit={doc.commit} onCancel={reason => { if (reason !== 'external') doc.cancel(); }} inputAria={{ 'aria-describedby': description }} {...common} />; break;
      case 'tag': cue = <TagCue value={token.words} recentTags={recentTags} label={key === 'tag0' ? 'Project tag' : 'Personal tag'} hint={false} editing={doc.editing} onBegin={() => begin(token)} onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} {...common} />; break;
      case 'person': cue = <PersonCue value={token.words} choices={[{ value: 'Sam' }, { value: 'Ana' }, { value: 'Hiro' }]} label="Known person" hint={false} editing={doc.editing} onBegin={() => begin(token)} onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} {...common} />; break;
      case 'link': cue = <LinkCue value={token.words} label="Reference link" footprint={['https://metalui.dev/components', 'https://example.com/notes#one']} editing={doc.editing}
        editProps={{ 'aria-description': 'You. Explicit source words.' }} inputAria={{ 'aria-description': 'You. Explicit source words.' }}
        onBegin={() => begin(token)} onChange={doc.replace} onCommit={doc.commit} onCancel={doc.cancel} {...common} />; break;
    }
    return <ProvenanceTooltip disabled={doc.editing} key={key} source="You" detail={['Explicit source words', instruction[token.kind]]}>{cue}</ProvenanceTooltip>;
  }
  const rows = doc.source.split('\n'); let rowStart = 0;
  return <div className="mu-stack gap-mu-group w-full" data-testid="provenance-document" data-editing={doc.editing || undefined} data-mu-motion={dial.reducedMotion ? 'reduce' : undefined}>
    <label className="mu-stack gap-mu-related type-label text-ink2">Editable document source
      <textarea ref={editor} rows={3} aria-label="Provenance document source" value={doc.source} className="type-content text-ink material-well rounded-field p-mu-space-12 w-full"
        onChange={event => {
          const field = event.currentTarget;
          doc.setSource(field.value, { start: field.selectionStart, end: field.selectionEnd, direction: field.selectionDirection });
          const unfinished = /#[\p{L}\p{N}\p{M}_-]*$/u.exec(field.value.slice(0, field.selectionStart));
          setHash(unfinished && !recentTags.includes(unfinished[0]) && !states.some(state => state.value === unfinished[0]) && !dial.readOnly && !dial.disabled ? { start: unfinished.index, end: field.selectionStart, source: field.value } : null);
        }}
        onSelect={event => { if (document.activeElement === event.currentTarget && !doc.editing) doc.setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection }); }} onBlur={doc.commit}
        onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? doc.redo() : doc.undo(); } }} />
    </label>
    <Popover open={!!hash} onOpenChange={open => { if (!open) setHash(null); }}>
      <Popover.Content anchor={editor} align="start" aria-label="Source tag completion" onKeyDownCapture={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setHash(null); } }} finalFocus={() => {
        requestAnimationFrame(() => { const field = editor.current; if (field && document.activeElement === field) { const selection = latest.current.selection; field.setSelectionRange(selection.start, selection.end, selection.direction); } });
        return editor.current;
      }}>
        <Popover.Title>Recent tags</Popover.Title>
        <Popover.Description>Search leaves your hash unchanged. Choosing replaces its captured source range.</Popover.Description>
        <Popover.Body><TagCue.Picker recentTags={recentTags} label="Find a source tag" onChoose={chooseTag} /></Popover.Body>
      </Popover.Content>
    </Popover>
    <ProvenanceProvider>{rows.map((row, index) => {
      const start = rowStart; rowStart += row.length + 1; const found = tokens(row); let after = 0;
      return <MarkLine key={index} data-testid={`provenance-line-${index}`} className="text-ink">{found.flatMap((token, at) => { const before = row.slice(after, token.start); after = token.end; return [<span key={`source-${at}`}>{before}</span>, render({ ...token, start: token.start + start, end: token.end + start })]; })}<span data-testid={`provenance-tail-${index}`}>{row.slice(after)}</span></MarkLine>;
    })}</ProvenanceProvider>
    <span id={description} className="sr-only">You. Explicit source words. Drag or arrow keys change the date. Hold or Enter opens Calendar.</span>
    <div className="mu-cluster gap-mu-related">
      <Button size="compact" icon={<UndoIcon />} disabled={!doc.canUndo && !doc.editing} onClick={doc.undo}>Undo source edit</Button>
      <Button size="compact" icon={<RedoIcon />} disabled={!doc.canRedo || doc.editing} onClick={doc.redo}>Redo source edit</Button>
      <Button size="compact" icon={<CloseIcon />} disabled={!doc.editing} onClick={doc.cancel}>Cancel source gesture</Button>
      <output aria-label="Retained source selection" className="type-readout text-ink2">UTF16 {doc.selection.start}–{doc.selection.end} · {doc.editing ? 'preview' : 'committed'}</output>
    </div>
    <p className="type-meta text-ink2">The date reference is explicitly 2 October 2026. Values and vocabulary belong to this document. Recognition never saves a change.</p>
  </div>;
}
