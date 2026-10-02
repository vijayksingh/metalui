import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Link, Button, Row, Switch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import reactSource from '../../../../../packages/metalui/src/components/link/link.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalLink.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/link/link.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { HintLayer, Readout, useHandle, snapTo, clamp } from '../../ui/edit';

function Paragraph({ label }: { label: string }) {
  return <p className="m-0 max-w-mu-measure type-lead text-ink" aria-label={label}>Export the region as a PDF, then read <Link href="#export">the export guide</Link> for paper sizes, or see how <Link href="https://www.w3.org/WAI/WCAG22/Understanding/use-of-color" external>links stay visible without colour</Link>.</p>;
}
function States() {
  const [loading, setLoading] = React.useState(false);
  return <div className="mu-stack gap-mu-section" aria-label="Link states">
    <div className="mu-auto-grid gap-mu-related">
      {['rest', 'hover', 'pressed', 'focus', 'visited'].map(state => <div key={state} className="mu-stack gap-mu-related"><span className="type-label text-ink3">{state}</span><Link href="#states" visited={state === 'visited'} data-preview={state} className={state === 'focus' ? 'focus-ring' : undefined} style={(state === 'visited' ? { '--mu-r-link-underline-ink': 'var(--mu-ink3)' } : state === 'focus' ? { outline: 'var(--mu-focus-width) solid var(--mu-focus)', outlineOffset: 'var(--mu-focus-offset)' } : undefined) as React.CSSProperties}>The field guide</Link></div>)}
      <div className="mu-stack gap-mu-related"><span className="type-label text-ink3">current</span><Link href="#states" aria-current="page">The field guide</Link></div>
      <div className="mu-stack gap-mu-related"><span className="type-label text-ink3">unavailable</span><Link href="#unavailable" disabled disabledReason="The guide is being revised">The field guide</Link></div>
      <div className="mu-stack gap-mu-related"><span className="type-label text-ink3">external</span><Link href="https://www.w3.org/WAI/" external>Accessibility notes</Link></div>
      <div className="mu-stack gap-mu-related"><span className="type-label text-ink3">download</span><Link href="data:text/plain,Tram%20map" download="Tram map.txt" fileSize="2.4 MB">Tram map.pdf</Link></div>
      <div className="mu-stack gap-mu-related"><span className="type-label text-ink3">quiet</span><Link href="#states" kind="quiet">The field guide</Link></div>
      <div className="mu-stack gap-mu-related"><span className="type-label text-ink3">standalone</span><Link href="#states" kind="standalone">Read the field guide</Link></div>
    </div>
    <div className="mu-cluster gap-mu-related"><Link href="#arrived" loading={loading} onClick={event => { event.preventDefault(); setLoading(true); }}>Open the region</Link><Button size="compact" onClick={() => setLoading(false)}>Route arrived</Button></div>
    <p className="type-meta text-ink3">The first five specimens show their states at rest. Handle the links to see the real pointer and keyboard transitions. The route link waits until Route arrived.</p>
  </div>;
}
function Specimen() {
  const p = tokens.recipes.link.props.underline;
  const [offset, setOffset] = React.useState(Number(p.offset));
  const [external, setExternal] = React.useState(false);
  const handle = useHandle({ axis: 'y', zoom: 1,
    hint: () => ({ gesture: 'sides', title: 'Underline offset', how: 'drag the line down or up', value: `${offset} pt` }),
    keyHint: () => ({ gesture: 'sides', title: 'Underline offset', value: `${offset} pt`, keys: [{ k: '↑↓', say: 'step' }] }),
    start: () => offset,
    move: (start, _x, y) => setOffset(snapTo(clamp(start + y, 1, 8), [{ at: Number(p.offset), name: 'Default underline offset' }])[0]),
    step: direction => setOffset(value => clamp(value + direction, 1, 8)),
  });
  const d = useDialKit('Link', { 'Underline thickness': [Number(p.thickness), 1, 4, 0.5] });
  return <HintLayer><div className="mu-stack gap-mu-related w-full">
    <p className="type-meta text-ink2">Drag the underline's handle to set its distance from the words. Toggle the external glyph on the same real link.</p>
    <div className="ed-specimen type-title py-mu-space-32" data-hint-anchor style={{ '--mu-r-link-underline-offset': `${offset}px`, '--mu-r-link-underline-thickness': `${d['Underline thickness']}px` } as React.CSSProperties}>
      <div className="relative inline"><Link href="#specimen" external={external}>The field guide</Link><span {...handle} role="slider" tabIndex={0} aria-label="Underline offset" aria-valuenow={offset} aria-valuemin={1} aria-valuemax={8} className="absolute left-0 right-0 h-mu-space-8 cursor-ns-resize focus-visible:focus-ring" style={{ top: `calc(100% + ${offset}px)` }}><svg aria-hidden className="w-full h-full" viewBox="0 0 100 8" preserveAspectRatio="none"><path className="ed-seg" d="M0 1 H100" /></svg></span></div>
    </div>
    <div className="ed-readouts"><Readout label="Underline offset" value={String(offset)} snap={offset === Number(p.offset) ? { at: offset, name: 'Default underline offset' } : undefined} scrub={direction => setOffset(value => clamp(value + direction, 1, 8))} /></div>
    <Row><Row.Text>External destination</Row.Text><Row.Trail><Switch checked={external} onCheckedChange={setExternal} aria-label="External destination" /></Row.Trail></Row>
  </div></HintLayer>;
}
export default function LinkPage() {
  return <ComponentPage title="Link" lede="A destination in a sentence. Its engraved underline grows from where your pointer enters; pressing sinks the words. State and glyphs say where it goes and whether it is available."
    play={{ lede: 'Hover the links, press them, or Tab to them.', caption: 'in a sentence · external', node: <Paragraph label="Example paragraph" /> }}
    xray={<Specimen />}
    more={[{ id: 'states', title: 'Every state', lede: 'Persistent underlines distinguish destinations. Current and unavailable links use explicit semantics; quiet links keep a hairline.', node: <States /> }, { id: 'swift-states', title: 'SwiftUI states', node: <SwiftCapture name="link" maxWidth={680} /> }]}
    sources={[{ id: 'react', label: 'React', code: reactSource }, { id: 'css', label: 'CSS', code: cssSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'agent', label: 'Agent guide', code: agentSource }]}
    rules={[{ id: 'LK1', title: 'A destination stays marked', body: 'Every available destination keeps its underline. Current and unavailable links announce their state.', origin: 'WCAG 1.4.1' }, { id: 'LK2', title: 'Say where it goes', body: 'Use the destination’s name: the export guide.', origin: 'Ours' }, { id: 'LK3', title: 'Leaving is marked', body: 'External and download glyphs explain the destination; unavailable links explain why.', origin: 'Ours' }]}
  />;
}
