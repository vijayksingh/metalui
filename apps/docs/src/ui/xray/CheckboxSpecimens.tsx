import * as React from 'react';
import { Row, Switch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { CheckboxFor, LAYERS, groupOf, shipRadius, sizeOf, type CheckboxConfig, type CheckboxSize, type CheckboxState, type Look } from './CheckboxXray';
import { STEP_AT, CornerArc, Outline, Readout, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom, useStepMotion, type Seg } from '../edit';
import './checkbox-specimens.css';

/* THE CHECKBOX'S SPECIMENS: the real checkbox, handled. Its state is dragged on its right edge, its
 * size on its top edge, its corners at its corner, the tick's angle on the tick, the well's depth on
 * its lower edge; a sun moves the light; a switch per layer. Every specimen reads the config through
 * the library's own variables (look.style), so what you handle here is what the code says. */

type Spot = 'states' | 'tick' | 'shape' | 'well' | 'light' | 'layers';
type Props = { spot: Spot; m: CheckboxConfig; set: (patch: Partial<CheckboxConfig>) => void; setState: (state: CheckboxState) => void; focus: (name: string | null) => void; look: Look };
const P = tokens.recipes.checkbox.props;
// the two real sizes, from the checkbox recipe (one source per fact)
const SIZES: { name: CheckboxSize; px: number; radius: number }[] = [{ name: 'row', px: P.row.size, radius: P.row.radius }, { name: 'margin', px: P.self.size, radius: P.self.radius }];
const STATES: { value: CheckboxState; word: string }[] = [
  { value: 'rest', word: 'Rest' }, { value: 'hover', word: 'Hover' }, { value: 'on', word: 'Done' },
  { value: 'mixed', word: 'Mixed' }, { value: 'doing', word: 'Doing' }, { value: 'ghost', word: 'Suggested' },
];
/** How far the tick may be turned about its corner either way, in degrees. */
const TURN = 30;
const round = (v: number) => Math.round(v * 10) / 10;
const token = (v: number, at: number, name = 'recipe token') => v === at ? { at, name } : undefined;
const catchAt = (v: number, at: number, reach = 0.35) => Math.abs(v - at) <= reach ? at : v;

/** The real checkbox set to the config, with the x-ray's hover look held on; a step snaps on the part spring, a drag has no transition. */
function Face({ m, setState, motion, look }: { m: CheckboxConfig; setState: Props['setState']; motion?: string; look: Look }) {
  const transition = motion === 'none' ? 'none' : motion ? `${motion}, width var(--spring-part-d) var(--spring-part), border-radius var(--spring-part-d) var(--spring-part), background var(--spring-part-d) var(--spring-part), box-shadow var(--spring-part-d) var(--spring-part)` : undefined;
  return <CheckboxFor m={m} look={look} hover onCheckedChange={(value) => setState(value ? 'on' : 'rest')} style={{ transition }} />;
}

function Well({ children, well, zoom, light = false }: { children: React.ReactNode; well: React.RefObject<HTMLDivElement | null>; zoom: number; light?: boolean }) {
  return <div ref={well} className={`ed-specimen${light ? ' is-light' : ''}`}><div className="ed-checkbox-line" style={{ zoom }}>{children}<span>call printer</span></div></div>;
}

function States({ m, setState, look }: Props) {
  const index = STATES.findIndex((state) => state.value === m.state);
  const [active, setActive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const [lean, setLean] = React.useState<CheckboxState | null>(null);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [well, zoom] = useSpecimenZoom();
  const motion = useStepMotion();
  const choose = (d: number) => { const next = STATES[clamp(index + Math.sign(d), 0, STATES.length - 1)]; if (next.value !== m.state) { motion.stepped(); setState(next.value); } };
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'steps', title: 'State', value: active ? lean ? `→ ${STATES.find((state) => state.value === lean)?.word}` : STATES[index].word : undefined, how: 'drag down or up to change its look' }), keyHint: () => ({ gesture: 'steps', title: 'State', value: STATES[index].word, keys: [{ k: '↑↓', say: 'step' }] }), start: () => { motion.held(); return { index, traveled: 0 }; }, move: (s, _dx, dy) => { setActive(true); const distance = dy - s.traveled; const direction = Math.sign(distance); const target = STATES[s.index + direction]; if (target && Math.abs(distance) >= STEP_AT) { setState(target.value); motion.stepped(); s.index += direction; s.traveled = dy; setLean(null); } else setLean(target && Math.abs(distance) > 2 ? target.value : null); }, end: () => { setActive(false); setLean(null); motion.let(); }, step: (d) => choose(-d), axis: 'y', over: setPeek, grab: () => blip(ref.current) });
  return <><p>The small well can be empty, hovered, done, mixed, doing or suggested; click it to tick it, or drag its right edge to see each look.</p>
    <Well well={well} zoom={zoom}><span className="ed-checkbox-state" data-hint-anchor data-peek={peek || active ? '' : undefined}>
        <Face m={m} setState={setState} motion={motion.transition} look={look} />
        <span ref={ref} className="ed-checkbox-state-handle" role="slider" tabIndex={0} aria-label="State" aria-valuetext={STATES[index].word} aria-valuenow={index} aria-valuemin={0} aria-valuemax={STATES.length - 1} {...handle} />
        {lean && <i className="ed-checkbox-lean" aria-hidden />}
      </span></Well>
    <div className="ed-readouts"><Readout label="State" value={STATES[index].word} unit="" snap={{ at: index, name: STATES[index].word }} peek={setPeek} pick={() => summon(ref.current)} scrub={choose} /></div>
  </>;
}

function Shape({ m, set, setState, look }: Props) {
  const [active, setActive] = React.useState<'Size' | 'Corners' | null>(null);
  const [peek, setPeek] = React.useState<'Size' | 'Corners' | null>(null);
  const [lean, setLean] = React.useState(false);
  const refs = React.useRef<Partial<Record<'Size' | 'Corners', HTMLSpanElement | null>>>({});
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const [well, zoom] = useSpecimenZoom();
  const motion = useStepMotion();
  const index = SIZES.findIndex((size) => size.name === m.size);
  const ghost = m.state === 'ghost';
  const size = sizeOf(m);
  const radius = m.radius;
  const ship = shipRadius(m);
  // a size step keeps tuned corners, but corners left as they ship follow the size's own
  const stepTo = (next: typeof SIZES[number]) => { if (next.name !== m.size) { motion.stepped(); set({ size: next.name, radius: m.radius === ship ? next.radius : m.radius }); } };
  const step = (d: number) => stepTo(SIZES[clamp(index + Math.sign(d), 0, SIZES.length - 1)]);
  const corners = (v: number, caught = true) => { const raw = round(clamp(v, 0, size / 2)); const next = caught ? catchAt(catchAt(raw, P.self.radius), P.row.radius) : raw; set({ radius: next }); };
  useOnLand(active === 'Corners' && (m.radius === P.self.radius || m.radius === P.row.radius) ? `${m.radius}` : undefined, () => blip(segs.current.corner));
  const sizeHandle = useHandle({ zoom, hint: () => ({ gesture: 'steps', title: 'Size', value: active === 'Size' ? lean ? `→ ${SIZES[1 - index].name}` : SIZES[index].name : undefined, how: 'drag up or down to change its size' }), keyHint: () => ({ gesture: 'steps', title: 'Size', value: SIZES[index].name, keys: [{ k: '↑↓', say: 'step' }] }), start: () => { motion.held(); return { index, traveled: 0 }; }, move: (s, _dx, dy) => { setActive('Size'); const distance = dy - s.traveled; const direction = s.index === 1 ? 1 : -1; if (distance * direction >= STEP_AT) { stepTo(SIZES[1 - s.index]); s.index = 1 - s.index; s.traveled = dy; setLean(false); } else setLean(distance * direction > 2); }, end: () => { setActive(null); setLean(false); motion.let(); }, step, axis: 'y', over: (on) => setPeek(on ? 'Size' : null), grab: () => blip(segs.current.top) });
  const cornerHandle = useHandle({ zoom, hint: () => ({ gesture: 'corner', title: 'Corners', value: active === 'Corners' ? `${radius}pt` : undefined, how: 'drag out to round the corner' }), keyHint: () => ({ gesture: 'corner', title: 'Corners', value: `${radius}pt`, keys: [{ k: '←→', say: 'change' }] }), start: () => radius, move: (start, dx, dy) => { setActive('Corners'); corners(start + (dx + dy) / 2); }, end: () => setActive(null), step: (d) => corners(radius + d * 0.1), axis: 'both', over: (on) => setPeek(on ? 'Corners' : null), grab: () => blip(segs.current.corner) });
  const shown: Seg[] = active === 'Size' || peek === 'Size' ? ['top'] : active === 'Corners' || peek === 'Corners' ? ['corner'] : ghost ? ['corner'] : ['top', 'corner'];
  return <><p>{ghost ? 'The suggested ring has one size and rounded corners; drag its corner to round it.' : 'The square sits beside the task and has rounded corners; drag its top edge to switch between margin and row sizes, or its corner to round it.'}</p>
    <Well well={well} zoom={zoom}><div className="ed-box ed-checkbox-box" data-hint-anchor data-live={active ?? undefined} data-peek={peek ?? undefined} data-shown={shown.join(' ')}>
        <Face m={m} setState={setState} motion={active === 'Corners' ? 'none' : motion.transition} look={look} />
        <div className="ed-overlay"><Outline W={size} h={size} r={radius} on={active === 'Size' || peek === 'Size' ? ['top'] : []} only={shown} segs={segs} />
          {!ghost && <span ref={(el) => { refs.current.Size = el; }} className="ed-edge is-y" style={{ top: -3 }} role="slider" tabIndex={0} aria-label="Size" aria-valuetext={SIZES[index].name} aria-valuenow={size} aria-valuemin={P.row.size} aria-valuemax={P.self.size} {...sizeHandle} />}
          <span ref={(el) => { refs.current.Corners = el; }} className="ed-corner" style={{ width: Math.max(radius, 6) + 3, height: Math.max(radius, 6) + 3 }} role="slider" tabIndex={0} aria-label="Corners" aria-valuenow={radius} aria-valuemin={0} aria-valuemax={size / 2} {...cornerHandle}><CornerArc r={radius} on={active === 'Corners' || peek === 'Corners'} arcRef={(el) => { segs.current.corner = el; }} /></span>
        </div>{lean && <i className="ed-checkbox-lean" aria-hidden />}</div></Well>
    <div className="ed-readouts"><Readout label="Size" value={`${size}`} snap={token(size, size, ghost ? 'suggested size' : SIZES[index].name)} peek={ghost ? undefined : (on) => setPeek(on ? 'Size' : null)} pick={ghost ? undefined : () => summon(refs.current.Size ?? null)} scrub={ghost ? undefined : step} /><Readout label="Corners" value={`${radius}`} snap={token(radius, ship)} peek={(on) => setPeek(on ? 'Corners' : null)} pick={() => summon(refs.current.Corners ?? null)} scrub={(d) => corners(radius + d * 0.1, false)} /></div>
  </>;
}

function Tick({ m, set, setState, look }: Props) {
  const [active, setActive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [well, zoom] = useSpecimenZoom();
  const base = parseFloat(P.tick.rotate);
  const change = (v: number, caught = true) => { const raw = round(clamp(v, base - TURN, base + TURN)); set({ angle: caught ? catchAt(raw, base, 1) : raw }); };
  useOnLand(active && m.angle === base ? 'tick' : undefined, () => blip(ref.current));
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'corner', title: 'Tick angle', value: active ? `${m.angle}°` : undefined, how: 'drag around the tick to turn it' }), keyHint: () => ({ gesture: 'corner', title: 'Tick angle', value: `${m.angle}°`, keys: [{ k: '←→', say: 'turn' }] }), start: () => m.angle, move: (start, dx) => { setActive(true); change(start + dx * 2); }, end: () => setActive(false), step: (d) => change(m.angle + d), axis: 'x', over: setPeek, grab: () => blip(ref.current) });
  return <><p>A pen draws the white tick inside the ticked box along the check glyph's route; drag the tick to turn it about its corner, or click the box to draw it again.</p>
    <Well well={well} zoom={zoom}><div className="ed-checkbox-tick" data-hint-anchor data-peek={peek || active ? '' : undefined}><Face m={m} setState={(state) => setState(state === 'rest' ? 'on' : state)} motion={active ? 'none' : undefined} look={look} /><span ref={ref} className="ed-checkbox-tick-handle" role="slider" tabIndex={0} aria-label="Tick angle" aria-valuenow={m.angle} aria-valuemin={base - TURN} aria-valuemax={base + TURN} {...handle} /></div></Well><div className="ed-readouts"><Readout label="Tick angle" value={`${m.angle}`} unit="°" snap={token(m.angle, base)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => change(m.angle + d, false)} /></div>
  </>;
}

function Depth({ m, set, setState, look }: Props) {
  const [active, setActive] = React.useState(false); const [peek, setPeek] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [well, zoom] = useSpecimenZoom();
  const change = (v: number, caught = true) => { const raw = round(clamp(v, 0, 3)); set({ depth: caught ? catchAt(raw, 1, 0.12) : raw }); };
  useOnLand(active && m.depth === 1 ? 'depth' : undefined, () => blip(ref.current));
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'press', title: 'Well depth', value: active ? `${m.depth.toFixed(1)}` : undefined, how: 'drag down to deepen the well' }), keyHint: () => ({ gesture: 'press', title: 'Well depth', value: `${m.depth.toFixed(1)}`, keys: [{ k: '↑↓', say: 'change' }] }), start: () => m.depth, move: (start, _dx, dy) => { setActive(true); change(start + dy / 6); }, end: () => setActive(false), step: (d) => change(m.depth + d * 0.1), axis: 'y', over: setPeek, grab: () => blip(ref.current) });
  return <><p>The empty checkbox is a small hole; drag its lower edge down to deepen the inner shadow.</p>
    <Well well={well} zoom={zoom}><div className="ed-box ed-checkbox-box" data-hint-anchor data-peek={peek || active ? '' : undefined}><Face m={m} setState={setState} motion={active ? 'none' : undefined} look={look} /><span ref={ref} className="ed-checkbox-bottom" role="slider" tabIndex={0} aria-label="Well depth" aria-valuenow={m.depth} aria-valuemin={0} aria-valuemax={3} {...handle} /></div></Well><div className="ed-readouts"><Readout label="Well depth" value={m.depth.toFixed(1)} unit="" snap={token(m.depth, 1)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => change(m.depth + d * 0.1, false)} /></div>
  </>;
}

function Light({ m, set, setState, look }: Props) {
  const [active, setActive] = React.useState(false); const [peek, setPeek] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [well, zoom] = useSpecimenZoom();
  const orbit = P.self.size * 1.6;
  const reach = (strength: number) => orbit * (1.35 - strength * 0.35);
  const at = (deg: number, strength: number) => ({ x: Math.sin(deg * Math.PI / 180) * reach(strength), y: -Math.cos(deg * Math.PI / 180) * reach(strength) });
  const sun = at(m.lightDeg, m.lightK);
  const update = (x: number, y: number) => { const deg = clamp(Math.round(Math.atan2(x, -y) * 180 / Math.PI / 5) * 5, -90, 90); const raw = clamp(round((1.35 - Math.hypot(x, y) / orbit) / 0.35), 0, 1.5); set({ lightDeg: deg, lightK: catchAt(raw, 1, 0.1) }); };
  useOnLand(active && m.lightDeg === 0 && m.lightK === 1 ? 'light' : undefined, () => blip(ref.current));
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'corner', title: 'Light', value: active ? `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%` : undefined, how: 'drag around the box, closer for stronger light' }), keyHint: () => ({ gesture: 'corner', title: 'Light', value: `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%`, keys: [{ k: '←→', say: 'turn' }, { k: '↑↓', say: 'strength' }] }), start: () => sun, move: (start, dx, dy) => { setActive(true); update(start.x + dx, start.y + dy); }, end: () => setActive(false), step: (d, e) => e.key === 'ArrowUp' || e.key === 'ArrowDown' ? set({ lightK: clamp(round(m.lightK + d * 0.1), 0, 1.5) }) : set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) }), axis: 'both', over: setPeek });
  return <><p>Light falls on the box from above; drag the sun around the box, or closer to make the light stronger.</p>
    <Well well={well} zoom={zoom} light><div className="ed-lightbox ed-checkbox-light" data-hint-anchor data-lit={peek || active ? '' : undefined}><Face m={m} setState={setState} motion={active ? 'none' : undefined} look={look} /><svg className="ed-orbit" width={reach(0) * 2 + 2} height={reach(0) + 1} viewBox={`${-reach(0) - 1} ${-reach(0) - 1} ${reach(0) * 2 + 2} ${reach(0) + 1}`} style={{ translate: `0 ${-reach(0) / 2}px` }} aria-hidden><path d={`M${-reach(0)} 0A${reach(0)} ${reach(0)} 0 0 1 ${reach(0)} 0`} /><path className="is-near" d={`M${-reach(1)} 0A${reach(1)} ${reach(1)} 0 0 1 ${reach(1)} 0`} /></svg><span ref={ref} className="ed-sun" style={{ translate: `${sun.x}px ${sun.y}px` }} role="slider" tabIndex={0} aria-label="Light" aria-valuetext={`${m.lightDeg} degrees, ${Math.round(m.lightK * 100)} percent`} aria-valuenow={m.lightDeg} aria-valuemin={-90} aria-valuemax={90} {...handle} /></div></Well><div className="ed-readouts"><Readout label="Direction" value={`${m.lightDeg}`} unit="°" snap={token(m.lightDeg, 0)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) })} /><Readout label="Strength" value={`${Math.round(m.lightK * 100)}`} unit="%" snap={token(m.lightK, 1)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => set({ lightK: clamp(round(m.lightK + d * 0.1), 0, 1.5) })} /></div>
  </>;
}

function Layers({ m, set, setState, focus, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const group = groupOf(m.state);
  const list = LAYERS[group];
  const toggle = (index: number, value: boolean) => set({ on: { ...m.on, [group]: m.on[group].map((old, i) => i === index ? value : old) } });
  return <><p>The checkbox's look is built from visible layers; turn one off to see what it adds.</p>
    <Well well={well} zoom={zoom}><Face m={m} setState={setState} look={look} /></Well>
    <div className="ed-layers">{list.map((layer, index) => <Row.Root key={layer.name} variant="list" className="ed-layer" data-off={m.on[group][index] ? undefined : ''} onPointerEnter={() => focus(layer.name)} onPointerLeave={() => focus(null)} onClick={(event) => { if (!(event.target as HTMLElement).closest('.mu-switch')) toggle(index, !m.on[group][index]); }}><Row.Text>{layer.name}</Row.Text><Row.Trail><Switch size="small" aria-label={layer.name} checked={m.on[group][index]} onCheckedChange={(value) => toggle(index, value)} onFocus={() => focus(layer.name)} onBlur={() => focus(null)} /></Row.Trail></Row.Root>)}</div>
  </>;
}

export function CheckboxSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'states': return <States {...props} />;
    case 'shape': return <Shape {...props} />;
    case 'tick': return <Tick {...props} />;
    case 'well': return <Depth {...props} />;
    case 'light': return <Light {...props} />;
    case 'layers': return <Layers {...props} />;
  }
}
