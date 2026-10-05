import { BrushCursor, Cue, HoverEngraving, Lasso, LineHandles, PerfectPreview, PersonCue, SelectionFrame, SizeReadout, SnapGuides, SuggestionChip, Surface } from '@unlocalhosted/metalui';
import { SpecimenWindow } from './PlaceSpecimen';

export const INSTRUMENT_CAPTIONS: Record<string, string> = {
  'brush-cursor': 'See the brush’s shape and size exactly where your next stroke will land.',
  cue: 'Recognize dates, people, links, and meaning directly in a line of text.',
  'hover-engraving': 'Rest on an object to see its identity, history, and tags.',
  lasso: 'Drag a boundary around objects to select them together.',
  'line-handles': 'Grab either end of a line to move or reconnect it.',
  'perfect-preview': 'Hold a rough stroke still to see the clean shape it can become.',
  'provenance-tooltip': 'See where a recognized value came from before acting on it.',
  'selection-frame': 'See what is selected and grab its handles to resize it.',
  'size-readout': 'Read dimensions, selection count, or copy status beside your work.',
  'snap-guides': 'Align objects by their edges or centers while you move them.',
  'suggestion-chip': 'Review a suggested action, its confidence, and accept or dismiss it.',
};
const noop = () => {};

function Scene({ name }: { name: string }) {
  if (name === 'size-readout') return <div className="mu-stack gap-mu-group items-center"><SizeReadout width={240} height={160} /><SizeReadout count={3} width={420} height={280} /></div>;
  if (name === 'suggestion-chip') return <div className="mu-stack gap-mu-group items-center"><span className="type-content text-ink">Send the tram map on Friday</span><SuggestionChip label="Task?" confidence={0.82} onAccept={noop} onDismiss={noop} hostHovered /></div>;
  if (name === 'cue' || name === 'provenance-tooltip') return <div className="mu-stack gap-mu-group items-center"><span className="type-content text-ink">Meet <PersonCue value="Ana" choices={[{ value: 'Ana' }]} label="Person" onChange={noop} /> on <Cue kind="date">Friday</Cue></span>{name === 'provenance-tooltip' && <Surface material="tip" radius="pill" className="px-mu-space-12 py-mu-space-8 type-meta text-ink2">From “Lisbon trip” · written by Ana</Surface>}</div>;
  if (name === 'hover-engraving') return <div className="relative mu-stack gap-mu-group" style={{ width: 320 }}><span className="type-content text-ink">Train to Lisbon</span><HoverEngraving kind="NOTE" details={['09:20']} tags={['travel']} placement="below" open immediate /></div>;
  return <div className="snap-canvas" style={{ width: 360, height: 200 }}>
    {name === 'brush-cursor' ? <><svg width="360" height="180"><path d="M40 115 Q90 45 140 105 T245 78" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" /></svg><BrushCursor at={{ x: 245, y: 78 }} size={16} mode="pen" /></> : null}
    {name === 'lasso' || name === 'snap-guides' ? <><span className="place-note" style={{ position: 'absolute', left: 48, top: 40 }}>Tram map</span><span className="place-note" style={{ position: 'absolute', left: 48, top: 106 }}>Tickets</span>{name === 'lasso' ? <Lasso rect={{ x: 28, y: 22, width: 260, height: 132 }} count={2} /> : <SnapGuides guides={[{ axis: 'vertical', position: 48, start: 25, end: 154, kind: 'edge' }]} />}</> : null}
    {name === 'selection-frame' ? <div className="relative place-note" style={{ position: 'absolute', left: 64, top: 48, width: 230, height: 80 }}>Trip plan<SelectionFrame state="selected" size={{ width: 230, height: 80 }} entrance={false} /></div> : null}
    {name === 'line-handles' ? <><svg width="360" height="180"><path d="M60 126 L300 54" stroke="var(--ink)" strokeWidth="2" /></svg><LineHandles from={{ x: 60, y: 126 }} to={{ x: 300, y: 54 }} state="selected" /></> : null}
    {name === 'perfect-preview' ? <><svg width="360" height="180"><path d="M92 90 C82 28 288 20 279 100 C284 162 90 158 92 90" stroke="var(--ink2)" strokeWidth="2" fill="none" /></svg><PerfectPreview d="M90 90 A95 54 0 1 0 280 90 A95 54 0 1 0 90 90" phase="tuning" tune={{ centre: { x: 185, y: 90 }, pointer: { x: 240, y: 142 }, angle: 0, scale: 1 }} /></> : null}
  </div>;
}

export function InstrumentSpecimen({ name }: { name: string }) {
  return <SpecimenWindow><div className="instrument-scene"><Scene name={name} /></div></SpecimenWindow>;
}
