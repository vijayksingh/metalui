import * as React from 'react';
import { Row, Switch, Switcher } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { INITIAL, OPTIONS, THUMB_LAYERS, WELL_LAYERS, type Look, type Model } from './SwitcherXray';
import { STEP_AT, Outline, Readout, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom, useStepMotion, type Hint, type Seg } from '../edit';
import './switcher-specimens.css';

type Spot = 'shape' | 'well' | 'thumb' | 'slide' | 'light' | 'layers';
type Props = { spot: Spot; m: Model; set: (patch: Partial<Model>) => void; sel: string; setSel: (value: string) => void; focus: (name: string | null) => void; look: Look };
type HandleName = 'size' | 'around' | 'beside' | 'depth' | 'lift' | 'choice' | 'stiffness' | 'damping';
// the two real sizes, from the switcher recipe (one source per fact)
const OPT = tokens.recipes.switcher.props.option as Record<string, unknown>;
const sizeHeight = { compact: Number(OPT.height), regular: Number(OPT['height-regular']) };
const names: Record<HandleName, string> = { size: 'Size', around: 'Space around the thumb', beside: 'Space beside each word', depth: 'Well depth', lift: 'Thumb lift', choice: 'Option', stiffness: 'Stiffness', damping: 'Damping' };

const round = (v: number) => Math.round(v * 10) / 10;
const token = (v: number, at: number) => v === at ? { at, name: 'token' } : undefined;

function Specimen({ spot, m, set, sel, setSel, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const box = React.useRef<HTMLDivElement>(null);
  const handleEls = React.useRef<Partial<Record<HandleName, HTMLSpanElement | null>>>({});
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const [width, setWidth] = React.useState(0);
  const [thumb, setThumb] = React.useState({ x: 0, y: 0, w: 0, h: 0 });
  const [active, setActive] = React.useState<HandleName | null>(null);
  const [peek, setPeek] = React.useState<HandleName | null>(null);
  const [lean, setLean] = React.useState<string | null>(null);
  const stepMotion = useStepMotion();
  const current = OPTIONS.findIndex((o) => o.value === sel);
  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => {
      const track = el.querySelector<HTMLElement>('.mu-switcher');
      const option = track?.querySelector<HTMLElement>('[aria-checked="true"]');
      if (!track || !option) return;
      setWidth(track.offsetWidth);
      setThumb({ x: option.offsetLeft, y: option.offsetTop, w: option.offsetWidth, h: option.offsetHeight });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    const mo = new MutationObserver(read);
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ['aria-checked'] });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [sel, m.size, m.pad, m.padX]);

  const catchValue = (value: number, min: number, max: number, at: number) => {
    const next = round(clamp(value, min, max));
    return Math.abs(next - at) < 0.15 ? at : next;
  };
  const around = (v: number, caught = true) => set({ pad: caught ? catchValue(v, 0, 8, INITIAL.pad) : round(clamp(v, 0, 8)) });
  const beside = (v: number, caught = true) => set({ padX: caught ? catchValue(v, 4, 20, INITIAL.padX) : round(clamp(v, 4, 20)) });
  const depth = (v: number, caught = true) => set({ depth: caught ? catchValue(v, 0, 3, 1) : round(clamp(v, 0, 3)) });
  const lift = (v: number, caught = true) => set({ lift: caught ? catchValue(v, 0, 3, 1) : round(clamp(v, 0, 3)) });
  const stiffness = (v: number, caught = true) => { const n = clamp(Math.round(v / 10) * 10, 60, 600); set({ k: caught && Math.abs(n - INITIAL.k) <= 10 ? INITIAL.k : n }); };
  const damping = (v: number, caught = true) => { const n = clamp(Math.round(v), 6, 50); set({ c: caught && Math.abs(n - INITIAL.c) <= 1 ? INITIAL.c : n }); };
  const choose = (index: number) => { const next = OPTIONS[clamp(index, 0, OPTIONS.length - 1)]; if (next.value !== sel) { stepMotion.stepped(); setSel(next.value); } };
  const stepSize = (d: number) => { const next = d > 0 ? 'regular' : 'compact'; if (next !== m.size) { stepMotion.stepped(); set({ size: next }); } };
  const show = (name: HandleName) => active === name || peek === name;
  const peekAt = (name: HandleName) => (on: boolean) => setPeek(on ? name : null);
  const hint = (name: HandleName, value: string, how: string, gesture: Hint['gesture'], keys = '↑↓'): Hint => ({ gesture, title: names[name], value: active === name ? value : undefined, how, keys: [{ k: keys, say: 'change' }, { k: '⇧', say: 'faster' }] });
  const keyHint = (name: HandleName, value: string, gesture: Hint['gesture'], keys = '↑↓'): Hint => ({ gesture, title: names[name], value, keys: [{ k: keys, say: 'change' }, { k: '⇧', say: 'faster' }] });
  const useNamedHandle = <S,>(name: HandleName, opts: Parameters<typeof useHandle<S>>[0]) => {
    const events = useHandle({ ...opts, zoom, over: (on) => setPeek(on ? name : null), grab: () => blip(segs.current[name === 'size' ? 'top' : name === 'around' ? 'right' : 'bottom']) });
    return { ...events, ref: (el: HTMLSpanElement | null) => { handleEls.current[name] = el; } };
  };
  const sizeHandle = useNamedHandle('size', {
    hint: () => hint('size', lean ? `→ ${lean}` : m.size, m.size === 'regular' ? 'drag down for compact' : 'drag up for regular', 'steps'),
    keyHint: () => keyHint('size', m.size, 'steps'),
    start: () => { stepMotion.held(); return { size: m.size, traveled: 0 }; },
    move: (s, _dx, dy) => { setActive('size'); const travel = dy - s.traveled; const target = s.size === 'regular' ? 'compact' : 'regular'; const toward = s.size === 'regular' ? 1 : -1; if (travel * toward >= STEP_AT) { stepSize(s.size === 'regular' ? -1 : 1); s.size = target; s.traveled = dy; setLean(null); } else setLean(travel * toward > 2 ? target : null); },
    end: () => { setActive(null); setLean(null); stepMotion.let(); }, step: (d) => stepSize(d), axis: 'y',
  });
  const aroundHandle = useNamedHandle('around', { hint: () => hint('around', `${m.pad}pt`, 'drag right for more space', 'sides', '←→'), keyHint: () => keyHint('around', `${m.pad}pt`, 'sides', '←→'), start: () => m.pad, move: (v, dx) => { setActive('around'); around(v + dx / 2); }, end: () => setActive(null), step: (d) => around(m.pad + d * 0.1), axis: 'x' });
  const besideHandle = useNamedHandle('beside', { hint: () => hint('beside', `${m.padX}pt`, 'drag sideways for more space', 'type', '←→'), keyHint: () => keyHint('beside', `${m.padX}pt`, 'type', '←→'), start: () => m.padX, move: (v, dx) => { setActive('beside'); beside(v + dx / 2); }, end: () => setActive(null), step: (d) => beside(m.padX + d * 0.1), axis: 'x' });
  const depthHandle = useNamedHandle('depth', { hint: () => hint('depth', m.depth.toFixed(1), 'drag down to deepen the well', 'press'), keyHint: () => keyHint('depth', m.depth.toFixed(1), 'press'), start: () => m.depth, move: (v, _dx, dy) => { setActive('depth'); depth(v + dy / 8); }, end: () => setActive(null), step: (d) => depth(m.depth + d * 0.1), axis: 'y' });
  const liftHandle = useNamedHandle('lift', { hint: () => hint('lift', m.lift.toFixed(1), 'drag up to raise the thumb', 'press'), keyHint: () => keyHint('lift', m.lift.toFixed(1), 'press'), start: () => m.lift, move: (v, _dx, dy) => { setActive('lift'); lift(v - dy / 8); }, end: () => setActive(null), step: (d) => lift(m.lift + d * 0.1), axis: 'y' });
  const choiceHandle = useNamedHandle('choice', { hint: () => ({ gesture: 'steps', title: 'Option', value: active === 'choice' ? lean ? `→ ${lean}` : sel : undefined, how: 'drag the thumb toward another option', keys: [{ k: '←→', say: 'choose' }] }), keyHint: () => keyHint('choice', sel, 'steps', '←→'), start: () => { stepMotion.held(); return { index: current, traveled: 0 }; }, move: (s, dx) => { setActive('choice'); const travel = dx - s.traveled; const direction = Math.sign(travel); const target = OPTIONS[s.index + direction]; if (target && Math.abs(travel) >= STEP_AT * 2) { choose(s.index + direction); s.index += direction; s.traveled = dx; setLean(null); } else setLean(target && Math.abs(travel) > 2 ? target.value : null); }, end: () => { setActive(null); setLean(null); stepMotion.let(); }, step: (d) => choose(current + Math.sign(d)), axis: 'x' });
  const stiffnessHandle = useNamedHandle('stiffness', { hint: () => hint('stiffness', `${m.k}`, 'drag right for a firmer spring', 'sides', '←→'), keyHint: () => keyHint('stiffness', `${m.k}`, 'sides', '←→'), start: () => m.k, move: (v, dx) => { setActive('stiffness'); stiffness(v + dx * 3); }, end: () => setActive(null), step: (d) => stiffness(m.k + d * 10), axis: 'x' });
  const dampingHandle = useNamedHandle('damping', { hint: () => hint('damping', `${m.c}`, 'drag down for a calmer spring', 'press'), keyHint: () => keyHint('damping', `${m.c}`, 'press'), start: () => m.c, move: (v, _dx, dy) => { setActive('damping'); damping(v + dy / 2); }, end: () => setActive(null), step: (d) => damping(m.c + d), axis: 'y' });
  const refs = (name: HandleName) => handleEls.current[name] ?? null;
  const read = (name: HandleName, value: string, unit: string, snap: ReturnType<typeof token>, scrub: (d: number) => void) => <Readout label={names[name]} value={value} unit={unit} snap={snap} peek={peekAt(name)} pick={() => summon(refs(name))} scrub={scrub} />;
  useOnLand(active === 'around' && m.pad === INITIAL.pad ? 'around' : undefined, () => blip(segs.current.right));
  useOnLand(active === 'beside' && m.padX === INITIAL.padX ? 'beside' : undefined, () => blip(handleEls.current.beside));
  useOnLand(active === 'depth' && m.depth === 1 ? 'depth' : undefined, () => blip(segs.current.bottom));
  useOnLand(active === 'lift' && m.lift === 1 ? 'lift' : undefined, () => blip(handleEls.current.lift));
  useOnLand(active === 'stiffness' && m.k === INITIAL.k ? 'stiffness' : undefined, () => blip(handleEls.current.stiffness));
  useOnLand(active === 'damping' && m.c === INITIAL.c ? 'damping' : undefined, () => blip(handleEls.current.damping));
  const selected = OPTIONS.find((o) => o.value === sel)?.label ?? sel;
  // the specimen is the control set to the config, like the table object and the model's face
  const face = look.style;
  const shown: Seg[] = active === 'size' || peek === 'size' ? ['top'] : active === 'around' || peek === 'around' ? ['right'] : active === 'depth' || peek === 'depth' ? ['bottom'] : spot === 'shape' ? ['top', 'right'] : spot === 'well' ? ['bottom'] : [];
  return <>
    <p>{{
      shape: 'How much room the switcher takes. Drag the top edge to change its size, the right end to change the space around the thumb, or a word to change the space beside it.',
      well: 'The well is the tray the options sit in. Drag its bottom edge down to make it deeper.',
      thumb: 'The thumb is the raised part under the chosen option. Drag it up to raise it higher.',
      slide: 'The thumb slides between options on a spring. Drag it to another option, drag its top edge to make the spring firmer, or its bottom edge to make it settle more calmly.',
      light: 'Light falls from the top, so the thumb is brightest along its top edge. Drag the sun to move the light, or closer to make it stronger.',
      layers: '',
    }[spot]}</p>
    {spot === 'light' ? <LightControl m={m} set={set} face={face} sel={sel} setSel={setSel} /> : <div ref={well} className="ed-specimen"><div style={{ zoom }}>
        <div ref={box} className="ed-box ed-switcher" data-live={active ?? undefined} data-peek={peek ?? undefined} data-size-handle={spot === 'shape' ? '' : undefined} data-hint-anchor data-instant={m.instant ? '' : undefined} style={{ ...face, ['--lean' as string]: lean && active === 'size' ? 1 : 0, ['--ed-step-transition' as string]: active && active !== 'size' ? 'none' : stepMotion.transition }}>
          <Switcher aria-label="View" size={m.size} value={sel} onValueChange={setSel} options={OPTIONS} />
          <div className="ed-overlay">
            {(spot === 'shape' || spot === 'well') && <Outline W={width} h={sizeHeight[m.size] + m.pad * 2} r={(sizeHeight[m.size] + m.pad * 2) / 2} on={shown} only={shown} segs={segs} />}
            {spot === 'shape' && <>
              <span className="ed-edge is-y" role="slider" tabIndex={0} aria-label={names.size} aria-valuetext={m.size} aria-valuenow={sizeHeight[m.size]} aria-valuemin={24} aria-valuemax={28} {...sizeHandle} />
              <span className="ed-edge is-x" role="slider" tabIndex={0} aria-label={names.around} aria-valuenow={m.pad} aria-valuemin={0} aria-valuemax={8} {...aroundHandle} />
              <span className="ed-switcher-word" style={{ left: thumb.x + 8, top: thumb.y + 6, width: Math.max(12, thumb.w - 16), height: thumb.h - 12 }} role="slider" tabIndex={0} aria-label={names.beside} aria-valuenow={m.padX} aria-valuemin={4} aria-valuemax={20} {...besideHandle} />
            </>}
            {spot === 'well' && <span className="ed-switcher-bottom" role="slider" tabIndex={0} aria-label={names.depth} aria-valuenow={m.depth} aria-valuemin={0} aria-valuemax={3} {...depthHandle} />}
            {spot === 'thumb' && <span className="ed-switcher-thumb" style={{ left: thumb.x, top: thumb.y, width: thumb.w, height: thumb.h }} role="slider" tabIndex={0} aria-label={names.lift} aria-valuenow={m.lift} aria-valuemin={0} aria-valuemax={3} {...liftHandle} />}
            {spot === 'slide' && <>
              {lean && <i className="ed-switcher-lean" style={{ left: box.current?.querySelectorAll<HTMLElement>('.mu-switcher-option')[OPTIONS.findIndex((o) => o.value === lean)]?.offsetLeft, width: box.current?.querySelectorAll<HTMLElement>('.mu-switcher-option')[OPTIONS.findIndex((o) => o.value === lean)]?.offsetWidth, top: thumb.y, height: thumb.h }} aria-hidden />}
              <span className="ed-switcher-thumb" style={{ left: thumb.x, top: thumb.y + 6, width: thumb.w, height: thumb.h - 12 }} role="slider" tabIndex={0} aria-label={names.choice} aria-valuetext={selected} aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={OPTIONS.length} {...choiceHandle} />
              <span className="ed-switcher-thumb-line is-top" style={{ left: thumb.x, top: thumb.y, width: thumb.w }} role="slider" tabIndex={0} aria-label={names.stiffness} aria-valuenow={m.k} aria-valuemin={60} aria-valuemax={600} {...stiffnessHandle} />
              <span className="ed-switcher-thumb-line is-bottom" style={{ left: thumb.x, top: thumb.y + thumb.h - 5, width: thumb.w }} role="slider" tabIndex={0} aria-label={names.damping} aria-valuenow={m.c} aria-valuemin={6} aria-valuemax={50} {...dampingHandle} />
            </>}
          </div>
        </div>
      </div></div>}
    {spot === 'shape' && <div className="ed-readouts">{read('size', `${sizeHeight[m.size]}`, 'pt', { at: sizeHeight[m.size], name: m.size }, (d) => stepSize(d))}{read('around', `${m.pad}`, 'pt', token(m.pad, INITIAL.pad), (d) => around(m.pad + d * 0.1, false))}{read('beside', `${m.padX}`, 'pt', token(m.padX, INITIAL.padX), (d) => beside(m.padX + d * 0.1, false))}</div>}
    {spot === 'well' && <div className="ed-readouts">{read('depth', m.depth.toFixed(1), '', token(m.depth, 1), (d) => depth(m.depth + d * 0.1, false))}</div>}
    {spot === 'thumb' && <div className="ed-readouts">{read('lift', m.lift.toFixed(1), '', token(m.lift, 1), (d) => lift(m.lift + d * 0.1, false))}</div>}
    {spot === 'slide' && <><div className="ed-readouts">{read('choice', selected, '', { at: current, name: sel }, (d) => choose(current + d))}{read('stiffness', `${m.k}`, '', token(m.k, INITIAL.k), (d) => stiffness(m.k + d * 10, false))}{read('damping', `${m.c}`, '', token(m.c, INITIAL.c), (d) => damping(m.c + d, false))}</div><div className="ed-layers"><Row.Root variant="list" className="ed-layer"><Row.Text>No animation</Row.Text><Row.Trail><Switch size="small" aria-label="No animation" checked={m.instant} onCheckedChange={(instant) => set({ instant })} /></Row.Trail></Row.Root></div></>}
  </>;
}

function LightControl({ m, set, face, sel, setSel }: { m: Model; set: Props['set']; face: React.CSSProperties; sel: string; setSel: Props['setSel'] }) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const sunEl = React.useRef<HTMLSpanElement>(null);
  const radius = 42;
  const reach = (k: number) => radius * (1.35 - k * 0.35);
  const at = (deg: number, k: number) => ({ x: Math.sin(deg * Math.PI / 180) * reach(k), y: -Math.cos(deg * Math.PI / 180) * reach(k) });
  const sun = at(m.lightDeg, m.lightK);
  const setLight = (x: number, y: number) => {
    const deg = clamp(Math.round(Math.atan2(x, -y) * 180 / Math.PI / 5) * 5, -90, 90);
    const strength = clamp(Math.round((1.35 - Math.hypot(x, y) / radius) / 0.35 * 20) / 20, 0, 1.5);
    set({ lightDeg: Math.abs(deg) < 5 ? 0 : deg, lightK: Math.abs(strength - 1) < 0.08 ? 1 : strength });
  };
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'corner', title: 'Light', value: live ? `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%` : undefined, how: 'drag around, closer for stronger' }), keyHint: () => ({ gesture: 'corner', title: 'Light', value: `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%`, keys: [{ k: '←→', say: 'turn' }, { k: '↑↓', say: 'strength' }] }), start: () => sun, move: (s, dx, dy) => { setLive(true); setLight(s.x + dx, s.y + dy); }, end: () => setLive(false), step: (d, e) => e.key === 'ArrowUp' || e.key === 'ArrowDown' ? set({ lightK: clamp(round(m.lightK + d * 0.05), 0, 1.5) }) : set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) }), axis: 'both', over: setPeek });
  useOnLand(live && m.lightDeg === 0 && m.lightK === 1 ? 'light' : undefined, () => blip(sunEl.current));
  return <><div ref={well} className="ed-specimen is-light"><div className="ed-lightbox ed-switcher" data-hint-anchor data-instant={m.instant ? '' : undefined} data-lit={live || peek ? '' : undefined} style={{ ...face, zoom }}>
    <Switcher aria-label="View" size={m.size} value={sel} onValueChange={setSel} options={OPTIONS} />
    <svg className="ed-orbit" width={reach(0) * 2 + 2} height={reach(0) + 1} viewBox={`${-reach(0) - 1} ${-reach(0) - 1} ${reach(0) * 2 + 2} ${reach(0) + 1}`} style={{ translate: `0 ${-reach(0) / 2}px` }} aria-hidden><path d={`M${-reach(0)} 0A${reach(0)} ${reach(0)} 0 0 1 ${reach(0)} 0`} /><path className="is-near" d={`M${-reach(1.5)} 0A${reach(1.5)} ${reach(1.5)} 0 0 1 ${reach(1.5)} 0`} /></svg>
    <span ref={sunEl} className="ed-sun" style={{ translate: `${sun.x}px ${sun.y}px` }} role="slider" tabIndex={0} aria-label="Light" aria-valuetext={`${m.lightDeg} degrees, ${Math.round(m.lightK * 100)} percent`} aria-valuenow={m.lightDeg} aria-valuemin={-90} aria-valuemax={90} {...handle} />
  </div></div><div className="ed-readouts"><Readout label="Light direction" value={m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}`} unit={m.lightDeg === 0 ? '' : m.lightDeg < 0 ? '° left' : '° right'} snap={token(m.lightDeg, 0)} peek={setPeek} pick={() => summon(sunEl.current)} scrub={(d) => set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) })} /><Readout label="Light strength" value={`${Math.round(m.lightK * 100)}`} unit="%" snap={token(m.lightK, 1)} peek={setPeek} pick={() => summon(sunEl.current)} scrub={(d) => set({ lightK: clamp(round(m.lightK + d * 0.05), 0, 1.5) })} /></div></>;
}

export function SwitcherSpecimenCard(props: Props) {
  const { spot, m, set, sel, setSel, focus, look } = props;
  if (spot !== 'layers') return <Specimen {...props} />;
  const toggle = (group: 'well' | 'thumb', index: number, on: boolean) => set({ [group]: m[group].map((value, i) => i === index ? on : value) });
  const face = look.style;
  return <><p>The well and the thumb are each made of layers. Turn a layer off to see what it adds.</p><LayerSpecimen m={m} sel={sel} setSel={setSel} face={face} /><div className="ed-layers">{([['well', WELL_LAYERS], ['thumb', THUMB_LAYERS]] as const).flatMap(([group, list]) => list.map((layer, index) => <Row.Root key={`${group}-${layer.name}`} variant="list" className="ed-layer" data-off={m[group][index] ? undefined : ''} onPointerEnter={() => focus(layer.name)} onPointerLeave={() => focus(null)} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(group, index, !m[group][index]); }}><Row.Text>{layer.name}</Row.Text><Row.Trail><Switch size="small" aria-label={layer.name} checked={m[group][index]} onCheckedChange={(on) => toggle(group, index, on)} onFocus={() => focus(layer.name)} onBlur={() => focus(null)} /></Row.Trail></Row.Root>))}</div></>;
}

function LayerSpecimen({ m, sel, setSel, face }: { m: Model; sel: string; setSel: Props['setSel']; face: React.CSSProperties }) {
  const [well, zoom] = useSpecimenZoom();
  return <div ref={well} className="ed-specimen"><div className="ed-switcher" data-instant={m.instant ? '' : undefined} style={{ ...face, zoom }}><Switcher aria-label="View" size={m.size} value={sel} onValueChange={setSel} options={OPTIONS} /></div></div>;
}
