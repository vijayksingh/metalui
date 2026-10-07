import * as React from 'react';
import { Row, Switch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { INITIAL, KbdFor, LAYERS, type KbdConfig, type KbdSize, type Look, type Surface } from './KbdXray';
// read the keycap's tokens here, not through KbdXray: KbdXray imports this file, so its
// constants do not exist yet while this module loads (a circular import)
const KBD_PROPS = tokens.recipes.kbd.props;
import { STEP_AT, CornerArc, Outline, Readout, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom, useStepMotion, type Hint, type Seg } from '../edit';
import './kbd-specimens.css';

type Spot = 'shape' | 'type' | 'surface' | 'light' | 'shadow' | 'layers';
type Props = { spot: Spot; m: KbdConfig; set: (patch: Partial<KbdConfig>) => void; focus: (name: string | null) => void; look: Look };
type Name = 'Size' | 'Corners' | 'Space beside the glyph' | 'Glyph size' | 'Letter spacing' | 'Surface' | 'Light' | 'Height above the page';
const sizes: { name: KbdSize; h: number; pad: number; radius: number }[] = [{ name: 'small', h: KBD_PROPS.small.height, pad: KBD_PROPS.small.pad, radius: KBD_PROPS.small.radius }, { name: 'default', h: KBD_PROPS.self.height, pad: KBD_PROPS.self.pad, radius: KBD_PROPS.self.radius }];
const surfaces: { value: Surface; word: string }[] = [{ value: 'default', word: 'On the page' }, { value: 'strip', word: 'On a dark strip' }, { value: 'sunk', word: 'Sunk in' }];
const near = (v: number, at: number, reach: number) => Math.abs(v - at) <= reach ? at : v;
const round = (v: number, places = 1) => Number(v.toFixed(places));
const token = (v: number, at: number, name = 'token') => v === at ? { at, name } : undefined;
/** A keycap is small: its specimens are shown half as large again (not Light, whose sun's arc must fit the well). */
const KEY_ZOOM = 1.5;

function Key({ m, look, motion, children }: { m: KbdConfig; look: Look; motion?: string; children?: React.ReactNode }) {
  return <KbdFor m={m} look={look} style={{ transition: motion }}>{children ?? m.glyph}</KbdFor>;
}

function Shape({ m, set, look }: Props) {
  const h = sizes.find((x) => x.name === m.size)!.h;
  const [well, z0] = useSpecimenZoom(); const zoom = z0 * KEY_ZOOM;
  
  const box = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => { const el = box.current; if (!el) return; const read = () => setWidth(el.offsetWidth); read(); const ro = new ResizeObserver(read); ro.observe(el); return () => ro.disconnect(); }, []);
  const refs = React.useRef<Partial<Record<'size' | 'pad' | 'corner', HTMLSpanElement | null>>>({});
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const [active, setActive] = React.useState<string | null>(null);
  const [peek, setPeek] = React.useState<string | null>(null);
  const [lean, setLean] = React.useState<string | null>(null);
  const motion = useStepMotion();
  const index = sizes.findIndex((x) => x.name === m.size);
  const stepSize = (d: number) => { const next = sizes[clamp(index + Math.sign(d), 0, sizes.length - 1)]; if (next.name !== m.size) { motion.stepped(); set({ size: next.name, pad: next.pad, radius: next.radius }); } };
  const pad = (v: number, catchToken = true) => { const n = round(clamp(v, 0, h)); set({ pad: catchToken ? near(near(n, KBD_PROPS.self.pad, 0.4), KBD_PROPS.small.pad, 0.4) : n }); };
  const corner = (v: number, catchToken = true) => { const n = round(clamp(v, 0, h / 2)); set({ radius: catchToken ? near(near(n, KBD_PROPS.self.radius, 0.4), KBD_PROPS.small.radius, 0.4) : n }); };
  const on = (name: string) => (yes: boolean) => setPeek(yes ? name : null);
  const sizeHandle = useHandle({ zoom, hint: () => ({ gesture: 'steps', title: 'Size', value: active === 'Size' ? lean ? `→ ${lean}` : sizes[index].name : undefined, how: m.size === 'default' ? 'drag down for small' : 'drag up for default' }), keyHint: (): Hint => ({ gesture: 'steps', title: 'Size', value: sizes[index].name, keys: [{ k: '↑↓', say: 'step' }] }), start: () => { motion.held(); return { index, at: 0 }; }, move: (s, _dx, dy) => { setActive('Size'); const delta = dy - s.at, d = s.index ? -1 : 1, toward = -Math.sign(d); if (delta * toward >= STEP_AT) { stepSize(d); s.index += d; s.at = dy; setLean(null); } else setLean(delta * toward > 2 ? sizes[s.index + d]?.name ?? null : null); }, end: () => { setActive(null); setLean(null); motion.let(); }, step: (d) => stepSize(d), axis: 'y', over: on('Size'), grab: () => blip(segs.current.top) });
  const padHandle = useHandle({ zoom, hint: () => ({ gesture: 'sides', title: 'Space beside the glyph', value: active === 'Space beside the glyph' ? `${m.pad}pt` : undefined, how: 'drag right for more space' }), keyHint: () => ({ gesture: 'sides', title: 'Space beside the glyph', value: `${m.pad}pt`, keys: [{ k: '←→', say: 'change' }] }), start: () => m.pad, move: (start, dx) => { setActive('Space beside the glyph'); pad(start + dx / 2); }, end: () => setActive(null), step: (d) => pad(m.pad + d * 0.1), axis: 'x', over: on('Space beside the glyph'), grab: () => blip(segs.current.right) });
  const cornerHandle = useHandle({ zoom, hint: () => ({ gesture: 'corner', title: 'Corners', value: active === 'Corners' ? `${m.radius}pt` : undefined, how: 'drag out to round the corner' }), keyHint: () => ({ gesture: 'corner', title: 'Corners', value: `${m.radius}pt`, keys: [{ k: '←→', say: 'rounder' }] }), start: () => m.radius, move: (start, dx, dy) => { setActive('Corners'); corner(start + (dx + dy) / 2); }, end: () => setActive(null), step: (d) => corner(m.radius + d * 0.1), axis: 'both', over: on('Corners'), grab: () => blip(segs.current.corner) });
  useOnLand(active === 'Space beside the glyph' && (m.pad === KBD_PROPS.self.pad || m.pad === KBD_PROPS.small.pad) ? `${m.pad}` : undefined, () => blip(segs.current.right));
  useOnLand(active === 'Corners' && (m.radius === KBD_PROPS.self.radius || m.radius === KBD_PROPS.small.radius) ? `${m.radius}` : undefined, () => blip(segs.current.corner));
  const shown: Seg[] = active === 'Size' || peek === 'Size' ? ['top'] : active === 'Space beside the glyph' || peek === 'Space beside the glyph' ? ['right'] : active === 'Corners' || peek === 'Corners' ? ['corner'] : m.surface === 'sunk' ? ['top', 'right'] : ['top', 'right', 'corner'];
  return <><p>A key has a size, space beside its glyph and rounded corners; drag its top edge, right end or corner to change each part.</p><div ref={well} className="ed-specimen"><div style={{ zoom }}><div ref={box} className="ed-box ed-kbd-box" data-hint-anchor data-live={active ?? undefined} data-peek={peek ?? undefined} data-shown={shown.join(' ')} style={{ ['--lean' as string]: lean ? 1 : 0 }}><Key m={m} look={look} motion={active && active !== 'Size' ? 'none' : motion.transition} /><div className="ed-overlay"><Outline W={width} h={h} r={m.surface === 'sunk' ? h / 2 : m.radius} on={active === 'Size' || peek === 'Size' ? ['top'] : active === 'Space beside the glyph' || peek === 'Space beside the glyph' ? ['right'] : []} only={shown} segs={segs} /><span ref={(el) => { refs.current.size = el; }} className="ed-edge is-y" style={{ top: -3 }} role="slider" tabIndex={0} aria-label="Size" aria-valuetext={sizes[index].name} aria-valuenow={h} aria-valuemin={sizes[0].h} aria-valuemax={sizes[1].h} {...sizeHandle} /><span ref={(el) => { refs.current.pad = el; }} className="ed-edge is-x" style={{ right: -3 }} role="slider" tabIndex={0} aria-label="Space beside the glyph" aria-valuenow={m.pad} aria-valuemin={0} aria-valuemax={h} {...padHandle} />{m.surface !== 'sunk' && <span ref={(el) => { refs.current.corner = el; }} className="ed-corner" style={{ width: Math.max(m.radius, 6) + 3, height: Math.max(m.radius, 6) + 3 }} role="slider" tabIndex={0} aria-label="Corners" aria-valuenow={m.radius} aria-valuemin={0} aria-valuemax={h / 2} {...cornerHandle}><CornerArc r={m.radius} on={active === 'Corners' || peek === 'Corners'} arcRef={(el) => { segs.current.corner = el; }} /></span>}</div>{lean && <i className="ed-kbd-lean" data-target={lean} />}</div></div></div><div className="ed-readouts"><Readout label="Size" value={`${h}`} snap={token(h, sizes[index].h, sizes[index].name)} peek={on('Size')} pick={() => summon(refs.current.size ?? null)} scrub={stepSize} /><Readout label="Space beside the glyph" value={`${m.pad}`} snap={token(m.pad, sizes[index].pad)} peek={on('Space beside the glyph')} pick={() => summon(refs.current.pad ?? null)} scrub={(d) => pad(m.pad + d * 0.1, false)} />{m.surface !== 'sunk' && <Readout label="Corners" value={`${m.radius}`} snap={token(m.radius, sizes[index].radius)} peek={on('Corners')} pick={() => summon(refs.current.corner ?? null)} scrub={(d) => corner(m.radius + d * 0.1, false)} />}</div></>;
}

function Type({ m, set, look }: Props) {
  const h = sizes.find((x) => x.name === m.size)!.h;
  // the glyph is the handle, as on the button: drag it sideways for spacing, up or down for size
  const [well, z0] = useSpecimenZoom(); const zoom = z0 * KEY_ZOOM; 
  const [live, setLive] = React.useState<null | 'size' | 'track'>(null);
  const [over, setOver] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const labelEl = React.useRef<HTMLSpanElement>(null);
  const size = (v: number, catchToken = true) => { const n = round(clamp(v, h / 3, h)); set({ fontSize: catchToken ? near(n, INITIAL.fontSize, 0.3) : n }); };
  const track = (v: number, catchToken = true) => { const n = round(clamp(v, -0.1, 0.2), 3); set({ track: catchToken ? near(n, INITIAL.track, 0.004) : n }); };
  const handle = useHandle({
    zoom,
    hint: () => live === 'size' ? { gesture: 'type', title: 'Glyph size', value: `${m.fontSize}pt` }
      : live === 'track' ? { gesture: 'type', title: 'Letter spacing', value: `${m.track.toFixed(3)}em` }
      : { gesture: 'type', title: 'Glyph', how: 'drag sideways for spacing, up or down for size' },
    keyHint: (): Hint => ({ gesture: 'type', title: 'Glyph', value: `${m.fontSize}pt · ${m.track.toFixed(3)}em`, keys: [{ k: '←→', say: 'spacing' }, { k: '↑↓', say: 'size' }] }),
    start: () => ({ axis: '' as '' | 'x' | 'y', size: m.fontSize, track: m.track }),
    move: (st, dx, dy) => {
      if (!st.axis && Math.abs(dx) + Math.abs(dy) > 1.2) st.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (st.axis === 'x') { setLive('track'); track(st.track + dx / 100); }
      if (st.axis === 'y') { setLive('size'); size(st.size - dy / 3); }
    },
    end: () => setLive(null),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? size(m.fontSize + d * 0.5) : track(m.track + d * 0.005)), axis: 'both',
    over: setOver,
  });
  useOnLand(live === 'size' && m.fontSize === INITIAL.fontSize ? 'size' : live === 'track' && m.track === INITIAL.track ? 'track' : undefined, () => blip(labelEl.current));
  const glyph = <span ref={labelEl} className="ed-type-label" role="slider" tabIndex={0} aria-label="Glyph size and letter spacing" aria-valuetext={`${m.fontSize} points, spacing ${m.track} em`} aria-valuenow={m.fontSize} aria-valuemin={h / 3} aria-valuemax={h} {...handle}>{m.glyph}</span>;
  return <>
    <p>The glyph is small mono type. Drag it sideways to change the space between letters, or up and down to change its size.</p>
    <div ref={well} className="ed-specimen"><div className="ed-typebox" data-show={over || live || peek ? 'label' : undefined} data-live={live ?? undefined} style={{ zoom }} data-hint-anchor>
      <Key m={m} look={look} children={glyph} motion={live ? 'none' : undefined} />
    </div></div>
    <div className="ed-readouts">
      <Readout label="Glyph size" value={`${m.fontSize}`} snap={token(m.fontSize, INITIAL.fontSize)} peek={setPeek} pick={() => summon(labelEl.current)} scrub={(d) => size(m.fontSize + d * 0.1, false)} />
      <Readout label="Letter spacing" value={m.track.toFixed(3)} unit="em" snap={token(m.track, INITIAL.track)} peek={setPeek} pick={() => summon(labelEl.current)} scrub={(d) => track(m.track + d * 0.005, false)} />
    </div>
  </>;
}

function SurfaceCard({ m, set, spot, look }: Props) {
  const [well, z0] = useSpecimenZoom(); const zoom = z0 * KEY_ZOOM;  const [lean, setLean] = React.useState<Surface | null>(null); const [held, setHeld] = React.useState(false); const [peek, setPeek] = React.useState(false); const motion = useStepMotion(); const el = React.useRef<HTMLSpanElement>(null);
  const index = surfaces.findIndex((s) => s.value === m.surface);
  const choose = (d: number) => { const next = surfaces[clamp(index + Math.sign(d), 0, surfaces.length - 1)]; if (next.value !== m.surface) { motion.stepped(); set({ surface: next.value }); } };
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'steps', title: 'Surface', value: held ? lean ? `→ ${surfaces.find((s) => s.value === lean)?.word}` : surfaces[index].word : undefined, how: 'drag sideways to change where the key sits' }), keyHint: () => ({ gesture: 'steps', title: 'Surface', value: surfaces[index].word, keys: [{ k: '←→', say: 'step' }] }), start: () => { motion.held(); setHeld(true); return { index, at: 0 }; }, move: (s, dx) => { const delta = dx - s.at, d = Math.sign(delta); const next = surfaces[s.index + d]; if (next && Math.abs(delta) >= STEP_AT) { choose(d); s.index += d; s.at = dx; setLean(null); } else setLean(next && Math.abs(delta) > 2 ? next.value : null); }, end: () => { setHeld(false); setLean(null); motion.let(); }, step: choose, axis: 'x', grab: () => blip(el.current) });
  return <><p>{spot === 'shadow' ? 'A key on the strip or inside a pill has no raised shadow; drag it sideways to put it back on the page.' : 'A key takes its finish from where it sits; drag it sideways to move it between the page, a dark strip and a sunk pill.'}</p><div ref={well} className="ed-specimen"><div className="ed-kbd-surface" data-hint-anchor style={{ zoom }}><span ref={el} className="ed-kbd-surface-handle" data-peek={peek ? '' : undefined} role="slider" tabIndex={0} aria-label="Surface" aria-valuetext={surfaces[index].word} aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={surfaces.length} {...handle}><Key m={m} look={look} motion={motion.transition} /></span>{lean && <i className="ed-kbd-surface-lean" data-target={lean} />}</div></div><div className="ed-readouts"><Readout label="Surface" value={surfaces[index].word} unit="" snap={{ at: index, name: m.surface }} peek={setPeek} pick={() => summon(el.current)} scrub={choose} /></div></>;
}

function Light({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();  const [live, setLive] = React.useState(false); const [peek, setPeek] = React.useState(false); const el = React.useRef<HTMLSpanElement>(null);
  const radius = 40, reach = (k: number) => radius * (1.35 - k * 0.35);
  const at = (deg: number, k: number) => ({ x: Math.sin(deg * Math.PI / 180) * reach(k), y: -Math.cos(deg * Math.PI / 180) * reach(k) });
  const sun = at(m.lightDeg, m.lightK);
  const change = (x: number, y: number) => { const deg = clamp(Math.round(Math.atan2(x, -y) * 180 / Math.PI / 5) * 5, -90, 90); const k = clamp(Math.round((1.35 - Math.hypot(x, y) / radius) / 0.35 * 20) / 20, 0, 1.5); set({ lightDeg: near(deg, 0, 5), lightK: near(k, 1, 0.08) }); };
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'corner', title: 'Light', value: live ? `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%` : undefined, how: 'drag around the key, closer for stronger light' }), keyHint: () => ({ gesture: 'corner', title: 'Light', value: `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%`, keys: [{ k: '←→', say: 'turn' }, { k: '↑↓', say: 'strength' }] }), start: () => sun, move: (s, dx, dy) => { setLive(true); change(s.x + dx, s.y + dy); }, end: () => setLive(false), step: (d, e) => e.key === 'ArrowUp' || e.key === 'ArrowDown' ? set({ lightK: round(clamp(m.lightK + d * 0.05, 0, 1.5), 2) }) : set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) }), axis: 'both', over: setPeek });
  useOnLand(live && m.lightDeg === 0 && m.lightK === 1 ? 'home' : undefined, () => blip(el.current));
  return <><p>Light falls on the key from above; drag the sun around it to move the light or closer to make it stronger.</p><div ref={well} className="ed-specimen is-light"><div className="ed-lightbox ed-kbd-light" data-hint-anchor data-lit={live || peek ? '' : undefined} style={{ zoom }}><Key m={m} look={look} /><svg className="ed-orbit" width={reach(0) * 2 + 2} height={reach(0) + 1} viewBox={`${-reach(0) - 1} ${-reach(0) - 1} ${reach(0) * 2 + 2} ${reach(0) + 1}`} style={{ translate: `0 ${-reach(0) / 2}px` }} aria-hidden><path d={`M${-reach(0)} 0A${reach(0)} ${reach(0)} 0 0 1 ${reach(0)} 0`} /><path className="is-near" d={`M${-reach(1.5)} 0A${reach(1.5)} ${reach(1.5)} 0 0 1 ${reach(1.5)} 0`} /></svg><span ref={el} className="ed-sun" style={{ translate: `${sun.x}px ${sun.y}px` }} role="slider" tabIndex={0} aria-label="Light" aria-valuetext={`${m.lightDeg} degrees, ${Math.round(m.lightK * 100)} percent`} aria-valuenow={m.lightDeg} aria-valuemin={-90} aria-valuemax={90} {...handle} /></div></div><div className="ed-readouts"><Readout label="Light direction" value={m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}`} unit={m.lightDeg === 0 ? '' : m.lightDeg < 0 ? '° left' : '° right'} snap={token(m.lightDeg, 0)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) })} /><Readout label="Light strength" value={`${Math.round(m.lightK * 100)}`} unit="%" snap={token(m.lightK, 1)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => set({ lightK: round(clamp(m.lightK + d * 0.05, 0, 1.5), 2) })} /></div></>;
}

function Shadow({ m, set, look }: Props) {
  const [well, z0] = useSpecimenZoom(); const zoom = z0 * KEY_ZOOM;  const [live, setLive] = React.useState(false); const [peek, setPeek] = React.useState(false); const el = React.useRef<HTMLSpanElement>(null);
  const change = (v: number, catchToken = true) => { const n = round(clamp(v, 0, 3)); set({ lift: catchToken ? near(n, INITIAL.lift, 0.15) : n }); };
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'press', title: 'Height above the page', value: live ? m.lift.toFixed(1) : undefined, how: 'drag up to raise the key' }), keyHint: () => ({ gesture: 'press', title: 'Height above the page', value: m.lift.toFixed(1), keys: [{ k: '↑↓', say: 'change' }] }), start: () => m.lift, move: (v, _dx, dy) => { setLive(true); change(v - dy / 6); }, end: () => setLive(false), step: (d) => change(m.lift + d * 0.1), axis: 'y' });
  useOnLand(live && m.lift === INITIAL.lift ? 'home' : undefined, () => blip(el.current));
  return <><p>A raised key casts a small shadow; drag it up to lift it further from the page.</p><div ref={well} className="ed-specimen"><div style={{ zoom }} data-hint-anchor><span ref={el} className="ed-lift" data-live={live ? '' : undefined} data-peek={peek ? '' : undefined} style={{ translate: `0 ${-(m.lift - INITIAL.lift) * 3}px` }} role="slider" tabIndex={0} aria-label="Height above the page" aria-valuenow={m.lift} aria-valuemin={0} aria-valuemax={3} {...handle}><Key m={m} look={look} /></span></div></div><div className="ed-readouts"><Readout label="Height above the page" value={m.lift.toFixed(1)} unit="" snap={token(m.lift, INITIAL.lift)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => change(m.lift + d * 0.1, false)} /></div></>;
}

function Layers({ m, set, focus, look }: Props) {
  const [well, z0] = useSpecimenZoom(); const zoom = z0 * KEY_ZOOM;  const list = LAYERS[m.surface], on = m.on[m.surface];
  const toggle = (i: number, value: boolean) => set({ on: { ...m.on, [m.surface]: on.map((v, j) => j === i ? value : v) } });
  return <><p>The key is built in layers; turn one off to see the part it adds.</p><div ref={well} className="ed-specimen"><div style={{ zoom }}><Key m={m} look={look} /></div></div><div className="ed-layers">{list.map((layer, i) => <Row.Root key={layer.name} variant="list" className="ed-layer" data-off={on[i] ? undefined : ''} onPointerEnter={() => focus(layer.name)} onPointerLeave={() => focus(null)} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(i, !on[i]); }}><Row.Text>{layer.name}</Row.Text><Row.Trail><Switch size="small" aria-label={layer.name} checked={on[i]} onCheckedChange={(v) => toggle(i, v)} onFocus={() => focus(layer.name)} onBlur={() => focus(null)} /></Row.Trail></Row.Root>)}</div></>;
}

export function KbdSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'shape': return <Shape {...props} />;
    case 'type': return <Type {...props} />;
    case 'surface': return <SurfaceCard {...props} />;
    case 'light': return <Light {...props} />;
    case 'shadow': return props.m.surface === 'default' ? <Shadow {...props} /> : <SurfaceCard {...props} />;
    case 'layers': return <Layers {...props} />;
  }
}
