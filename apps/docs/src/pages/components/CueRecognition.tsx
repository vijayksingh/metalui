import * as React from 'react';
import { Avatar, Button, Mark, MarkLine, MarkLife, type MarkMeaning, type MarkKind } from '@unlocalhosted/metalui';
import { LifeCoffeeIcon } from '@unlocalhosted/metalui/icons/life';

type Candidate = { start: number; end: number; kind: MarkKind; meaning?: MarkMeaning; label: string; resolved?: string; color?: string; formatted?: string };
/** Explicit grammar for this documentation host. Real recognizers provide their own source ranges. */
function candidates(source: string): Candidate[] {
  const pattern = /tomorrow(?:\s+4pm)?|\b4pm\b|\b1h30\b|[$€]\d+(?:\.\d+)?|\b\d+h\b|\b\d+\s+steps\b|#[\da-fA-F]{6}\b|#[\p{L}\p{M}\p{N}_-]+|\bSam\b/gu;
  return [...source.matchAll(pattern)].map(match => {
    const words = match[0], start = match.index!;
    const span = { start, end: start + words.length };
    if (/^tomorrow|^4pm$|^1h30$/.test(words)) return { ...span, kind: words === '1h30' ? 'duration' : 'date', meaning: 'time', label: 'Time', resolved: words === '1h30' ? '1 H 30 · 90 MIN' : 'SAT 3 OCT · 16:00' };
    if (/^[$€]/.test(words)) return { ...span, kind: 'amount', meaning: 'money', label: 'Monetary amount', formatted: `${words[0]}${Number(words.slice(1)).toFixed(2)}` };
    if (/^\d+h$/.test(words)) return { ...span, kind: 'measurement', meaning: 'sleep', label: 'Sleep duration' };
    if (/steps$/.test(words)) return { ...span, kind: 'measurement', meaning: 'steps', label: 'Step count' };
    if (/^#[\da-fA-F]{6}$/.test(words)) return { ...span, kind: 'hex', meaning: 'colour', label: `Colour ${words}`, color: words };
    if (words === 'Sam') return { ...span, kind: 'measurement', meaning: 'person', label: 'Sam' };
    return { ...span, kind: 'tag', label: 'Tag' };
  });
}

export function CueRecognition({ motion = true, formatAmounts = true }: { motion?: boolean; formatAmounts?: boolean }) {
  const [source, setSource] = React.useState('Send #poster tomorrow 4pm for $40, slept 6h, walked 8000 steps in #FF6B3D with Sam.');
  const [selection, setSelection] = React.useState<number | null>(null);
  const [composing, setComposing] = React.useState(false);
  const [raw, setRaw] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const words = candidates(source);
  const parts: React.ReactNode[] = [];
  let end = 0;
  for (const cue of words) {
    parts.push(<span key={`plain-${end}`}>{source.slice(end, cue.start)}</span>);
    const inside = selection !== null && selection >= cue.start && selection <= cue.end;
    const recognised = !composing && !inside;
    const id = `${cue.start}:${source.slice(cue.start, cue.end)}`;
    parts.push(<Mark key={cue.start} kind={cue.kind} meaning={cue.meaning} meaningLabel={cue.label}
      meaningGlyph={cue.meaning === 'person' ? <Avatar name={cue.label} aria-label="" size="small" className="mark-person" /> : undefined}
      color={cue.color} resolved={cue.resolved} formatted={formatAmounts ? cue.formatted : undefined}
      raw={raw || !recognised} recognition={recognised ? id : undefined}>{source.slice(cue.start, cue.end)}</Mark>);
    end = cue.end;
  }
  parts.push(<span key={`plain-${end}`}>{source.slice(end)}</span>);
  return <div className="mu-stack gap-mu-group w-full" data-testid="recognition-demo" data-mu-motion={motion ? undefined : "reduce"}>
    <label className="mu-stack gap-mu-related type-label text-ink2">Your source text
      <textarea aria-label="Cue source text" data-testid="cue-source" value={source}
        className="type-content material-well rounded-field p-mu-space-12 w-full text-ink min-h-80"
        onChange={event => { setSource(event.target.value); setSelection(event.target.selectionStart); }}
        onSelect={event => setSelection(event.currentTarget.selectionStart)}
        onKeyUp={event => setSelection(event.currentTarget.selectionStart)}
        onPointerUp={event => setSelection(event.currentTarget.selectionStart)}
        onFocus={event => setSelection(event.currentTarget.selectionStart)}
        onBlur={() => setSelection(null)}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={event => { setComposing(false); setSelection(event.currentTarget.selectionStart); }} />
    </label>
    <div className="mu-cluster gap-mu-related">
      <Button size="compact" onClick={() => setRaw(value => !value)} aria-pressed={raw}>Raw text</Button>
      <span className="type-meta text-ink2">{composing ? 'Composition: recognition held' : 'Recognition waits for the caret to leave each chunk.'}</span>
    </div>
    <MarkLine data-testid="recognition-line">{parts}</MarkLine>
    <div className="mu-cluster gap-mu-related type-content">
      <span>printer deadline</span>
      <Button size="compact" cap="link" data-testid="inferred-cue" aria-label={confirmed ? 'Friday confirmed' : 'Confirm inferred Friday, recognizer confidence 0.82'}
        onClick={() => setConfirmed(true)} onFocus={() => setConfirmed(true)}>
        <Mark kind="derived-tag" meaningLabel="Inferred date" inferred={!confirmed} recognition={confirmed ? 'friday-confirmed' : undefined} resolved="FRI 9 OCT · RECOGNIZER 0.82">FRI</Mark>
      </Button>
      <span role="status" className="type-meta text-ink2">{confirmed ? 'Confirmed Friday' : 'Suggestion · recognizer 0.82 · click or Tab to confirm'}</span>
      <MarkLife label="A meal · breakfast?"><LifeCoffeeIcon size={16} /></MarkLife>
    </div>
  </div>;
}

export function CueLegend() {
  return <MarkLine data-testid="cue-legend">
    <Mark kind="date" meaning="time" meaningLabel="Date and time" resolved="SAT 3 OCT · 16:00">tomorrow 4pm</Mark>{' · '}
    <Mark kind="amount" meaning="money" meaningLabel="Monetary amount">$40</Mark>{' · '}
    <Mark kind="measurement" meaning="sleep" meaningLabel="Sleep duration">6h</Mark>{' · '}
    <Mark kind="measurement" meaning="steps" meaningLabel="Step count">8000 steps</Mark>{' · '}
    <Mark kind="hex" meaning="colour" meaningLabel="Colour #FF6B3D" color="#FF6B3D">#FF6B3D</Mark>{' · '}
    <Mark kind="measurement" meaning="person" meaningLabel="Sam" meaningGlyph={<Avatar name="Sam" aria-label="" size="small" className="mark-person" />}>Sam</Mark>{' · '}
    <Mark kind="tag" meaningLabel="Tag">#poster</Mark>{' · '}
    <a className="mark-url" href="https://figma.com">figma.com</a>
  </MarkLine>;
}
