import * as React from 'react';
import { Button, Row, Switch, type ButtonCap } from '@unlocalhosted/metalui';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { alphaK, scalePx, useRecipeLayers } from './kit';
import { BUTTON_XRAY_INITIAL, LAYERS, type ButtonXrayModel } from './ButtonXray';
import {
  Z, STEP_AT, snapTo, clamp, useStepMotion, useHandle, Readout, summon, blip, useOnLand, Outline, CornerArc, useSpecimenZoom,
  type Hint, type Seg, type Snap,
} from '../edit';

/* ─────────────────────────────────────────────────────────
 * THE BUTTON'S SPECIMENS · the x-ray card for each part
 *
 *   The card holds the real button to handle; the model on the bench reads the same
 *   values. Each part offers its own handles:
 *     shape    top edge steps the size, right end the padding, top-left corner the corners
 *     type     drag the words: sideways spacing, up or down size; weight and centring step
 *     light    a sun on an arc above the button: around turns it, nearer strengthens it
 *     shadow   lift the button up or set it down
 *     press    press it and pull down for how far it sinks
 *     layers   a row with a switch per layer
 *   Only the standard cap has two sizes, so no other cap gets a size handle.
 * ───────────────────────────────────────────────────────── */

export const P = tokens.recipes.button.props;

/** What the button says: the x-ray's own label and icon, so the specimen is the same button as the model. */
const Face = React.createContext<{ label: string; icon: IconName | 'none' }>({ label: 'New Canvas', icon: 'none' });
function Says() {
  const { label, icon } = React.useContext(Face);
  return <>{icon !== 'none' && <Icon name={icon} size={14} />}{label}</>;
}
export type SizeName = 'compact' | 'default';
export const SIZES: Record<SizeName, { h: number; pad: number; font: number }> = {
  compact: { h: Number(P.compact.height), pad: Number(P.compact.pad), font: 12 },
  default: { h: Number(P.self.height), pad: Number(P.self.pad), font: 12.5 },
};
export const other = (s: SizeName): SizeName => (s === 'compact' ? 'default' : 'compact');

/** Shape, on the specimen: the top line steps the size, the right end sets padding, the arc the corners. */
export function ShapeSpecimen({ m, set, cap }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void; cap: ButtonCap }) {
  // only the standard cap has two sizes; any other cap has one, so its size is not a handle
  const steps = cap === 'standard';
  const [well, zoom] = useSpecimenZoom();
  const size: SizeName = steps && m.h <= (SIZES.compact.h + SIZES.default.h) / 2 ? 'compact' : 'default';
  // the height is the model's own; if something else (the page's workbench) tuned it off a real
  // size, the specimen shows that truthfully, with its LED off; stepping lands on real sizes only
  const h = m.h;
  const onSize = h === SIZES[size].h;
  const auto = h / 2 - 1;
  const pad = m.padAuto ? auto : m.pad;
  const radius = (h / 2) * m.corners;
  const [live, setLive] = React.useState<null | 'size' | 'pad' | 'corners'>(null);
  const [lean, setLean] = React.useState(0);
  const [over, setOver] = React.useState<Seg | null>(null);
  const [peek, setPeek] = React.useState<Seg[]>([]);
  const motion = useStepMotion();
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const handles = React.useRef<Partial<Record<'pad' | 'size' | 'corner', HTMLSpanElement | null>>>({});
  const box = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const read = () => setW(el.offsetWidth); read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const padSnaps: Snap[] = [{ at: SIZES.compact.pad, name: 'compact' }, { at: SIZES.default.pad, name: 'default' }, { at: auto, name: 'half the height − 1' }];
  const [, padSnap] = snapTo(pad, padSnaps, 0);
  const radSnap: Snap | undefined = m.corners >= 1 ? { at: h / 2, name: 'pill' } : radius === 0 ? { at: 0, name: 'square' } : undefined;
  const stepTo = (next: SizeName) => set({ h: SIZES[next].h, size: SIZES[next].font });
  const setPad = (v: number) => { const [p] = snapTo(clamp(v, 4, 24), padSnaps); set(p === auto ? { padAuto: true } : { padAuto: false, pad: p }); };
  const setRad = (v: number) => { const r = clamp(v, 0, h / 2); set({ corners: r >= h / 2 - 0.6 ? 1 : Math.round(r) / (h / 2) }); };
  const hover = (seg: Seg) => (on: boolean) => setOver((o) => (on ? seg : o === seg ? null : o));
  useOnLand(size, () => blip(segs.current.top, segs.current.bottom));
  useOnLand(live === 'pad' ? padSnap?.name : undefined, () => blip(segs.current.left, segs.current.right));
  useOnLand(live === 'corners' ? radSnap?.name : undefined, () => blip(segs.current.corner));

  const sizeEdge = useHandle({
    zoom,
    hint: () => ({ gesture: 'steps', title: 'Size', value: live === 'size' ? (lean > 0.3 ? `→ ${other(size)}` : size) : undefined, how: size === 'default' ? 'drag in for compact' : 'drag out for default' }),
    keyHint: (): Hint => ({ gesture: 'steps', title: 'Size', value: size, keys: [{ k: '↑↓', say: 'step' }] }),
    start: () => { motion.held(); return { size, y: 0 }; },
    move: (st, _dx, dy) => {
      setLive('size');
      const grow = -dy * 2 - st.y, toward = st.size === 'default' ? -1 : 1;
      if (grow * toward > STEP_AT) { st.y += grow; motion.stepped(); stepTo(other(st.size)); st.size = other(st.size); setLean(0); }
      else setLean(clamp((grow * toward) / STEP_AT, 0, 1));
    },
    end: () => { motion.let(); setLive(null); setLean(0); }, axis: 'y',
    step: (d) => { if ((d < 0 && size === 'default') || (d > 0 && size === 'compact')) { motion.stepped(); stepTo(other(size)); } },
    over: hover('top'), grab: () => blip(segs.current.top),
  });
  const padEdge = useHandle({
    zoom,
    hint: () => ({ gesture: 'sides', title: 'Padding', value: live === 'pad' ? `${pad}pt` : undefined, how: 'drag to change the padding on both sides' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Padding', value: `${pad}pt`, keys: [{ k: '←→', say: 'wider' }, { k: '⇧', say: '×4' }] }),
    start: () => pad, move: (p0, dx) => { setLive('pad'); setPad(p0 + dx); }, end: () => setLive(null),
    step: (d) => setPad(pad + d),
    over: hover('right'), grab: () => blip(segs.current.right),
  });
  const cornerHandle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Corners', value: live === 'corners' ? `${Math.round(radius)}pt` : undefined, how: 'drag in to round, out to square' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Corners', value: `${Math.round(radius)}pt`, keys: [{ k: '←→', say: 'rounder' }] }),
    start: () => radius, move: (r0, dx, dy) => { setLive('corners'); setRad(r0 + (dx + dy) / 1.2); }, end: () => setLive(null),
    step: (d) => setRad(radius + d), axis: 'both',
    over: hover('corner'), grab: () => blip(segs.current.corner),
  });
  const holding: Seg[] = live === 'pad' ? ['left', 'right'] : live === 'size' ? ['top', 'bottom'] : live === 'corners' ? ['corner'] : [];
  const shown: Seg[] = over ? [over] : holding.length ? holding : peek.length ? peek : steps ? ['top', 'right', 'corner'] : ['right', 'corner'];
  const peekAt = (on: Seg[]) => (show: boolean) => { setPeek(show ? on : []); if (show) requestAnimationFrame(() => blip(...on.map((k) => segs.current[k]))); };

  return (
    <>
      <p>{steps
        ? 'The size, the padding beside the label, and how round the corners are. Drag the top edge to change the size, the right end to change the padding, or the top-left corner to change the corners.'
        : 'The padding beside the label and how round the corners are; this button comes in one size. Drag the right end to change the padding, or the top-left corner to change the corners.'}</p>
      <div ref={well} className="ed-specimen">
        <div style={{ zoom }}>
          <div ref={box} className="ed-box" data-live={live ?? undefined} data-shown={shown.join(' ')} style={{ ['--lean' as string]: lean }} data-hint-anchor>
            <Button cap={cap} size={size} style={{ ...(onSize ? {} : { [size === 'compact' ? '--mu-r-button-compact-height' : '--mu-r-button-self-height']: `${h}px` }), paddingLeft: pad, paddingRight: pad, borderRadius: radius, transition: live && live !== 'size' ? 'none' : motion.transition }}><Says /></Button>
            <div className="ed-overlay">
              <i className="ed-content" style={{ left: pad, right: pad }} />
              <Outline W={W} h={h} r={radius} on={[...(over ? [over] : []), ...holding, ...peek]} only={shown} segs={segs} />
              {steps && <span ref={(el) => { handles.current.size = el; }} className="ed-edge is-y" style={{ top: -3 }} role="slider" tabIndex={0} aria-label="Size" aria-valuetext={size} aria-valuenow={h} aria-valuemin={SIZES.compact.h} aria-valuemax={SIZES.default.h} {...sizeEdge} />}
              <span ref={(el) => { handles.current.pad = el; }} className="ed-edge is-x" style={{ right: -3 }} role="slider" tabIndex={0} aria-label="Padding" aria-valuenow={pad} aria-valuemin={4} aria-valuemax={24} {...padEdge} />
              <span ref={(el) => { handles.current.corner = el; }} className="ed-corner" style={{ width: Math.max(radius, 6) + 3, height: Math.max(radius, 6) + 3 }} role="slider" tabIndex={0} aria-label="Corner roundness" aria-valuenow={Math.round(radius)} aria-valuemin={0} aria-valuemax={h / 2} {...cornerHandle}>
                <CornerArc r={radius} on={shown.includes('corner') && (over === 'corner' || live === 'corners' || peek.includes('corner'))} arcRef={(el) => { segs.current.corner = el; }} />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="ed-readouts">
        {steps
          ? <Readout label="size" value={`${h}`} snap={onSize ? { at: h, name: size } : undefined} peek={peekAt(['top'])} pick={() => summon(handles.current.size ?? null)} scrub={(d) => { const next: SizeName = d > 0 ? 'default' : 'compact'; if (next !== size) { motion.stepped(); stepTo(next); } }} />
          : <Readout label="size" value={`${h}`} snap={onSize ? { at: h, name: 'its one size' } : undefined} />}
        <Readout label="padding" value={`${pad}`} snap={padSnap} peek={peekAt(['right'])} pick={() => summon(handles.current.pad ?? null)} scrub={(d) => { const p = clamp(pad + d, 4, 24); set(p === auto ? { padAuto: true } : { padAuto: false, pad: p }); }} />
        <Readout label="corners" value={`${Math.round(radius)}`} snap={radSnap} peek={peekAt(['corner'])} pick={() => summon(handles.current.corner ?? null)} scrub={(d) => setRad(radius + d)} />
      </div>
    </>
  );
}

/** Type, on the specimen: drag the label (sideways spacing, up or down size); weight and centring step. */
export function TypeSpecimen({ m, set, cap }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void; cap: ButtonCap }) {
  const { label } = React.useContext(Face);
  const [well, zoom] = useSpecimenZoom();
  const SIZE_TOKEN = BUTTON_XRAY_INITIAL.size, TRACK_TOKEN = BUTTON_XRAY_INITIAL.track;
  const WEIGHTS = [400, 500, 600];
  const [live, setLive] = React.useState<null | 'size' | 'track'>(null);
  const [over, setOver] = React.useState(false);
  const [peek, setPeek] = React.useState<null | 'label' | 'centre'>(null);
  const labelEl = React.useRef<HTMLSpanElement>(null);
  const box = React.useRef<HTMLDivElement>(null);
  // tunables catch on their tokens; sizes move in half points, spacing in thousandths
  const setSize = (v: number) => { const x = Math.round(clamp(v, 10, 16) * 2) / 2; set({ size: Math.abs(x - SIZE_TOKEN) <= 0.3 ? SIZE_TOKEN : x }); };
  const setTrack = (v: number) => { const x = Math.round(clamp(v, -0.03, 0.08) * 1000) / 1000; set({ track: Math.abs(x - TRACK_TOKEN) <= 0.002 ? TRACK_TOKEN : x }); };
  const labelHandle = useHandle({
    zoom,
    hint: () => live === 'size' ? { gesture: 'type', title: 'Size', value: `${m.size}pt` }
      : live === 'track' ? { gesture: 'type', title: 'Letter spacing', value: `${m.track.toFixed(3)}em` }
      : { gesture: 'type', title: 'Label', how: 'drag sideways for spacing, up or down for size' },
    keyHint: (): Hint => ({ gesture: 'type', title: 'Label', value: `${m.size}pt · ${m.track.toFixed(3)}em`, keys: [{ k: '←→', say: 'spacing' }, { k: '↑↓', say: 'size' }] }),
    start: () => ({ axis: '' as '' | 'x' | 'y', size: m.size, track: m.track }),
    move: (st, dx, dy) => {
      if (!st.axis && Math.abs(dx) + Math.abs(dy) > 1.2) st.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (st.axis === 'x') { setLive('track'); setTrack(st.track + dx * 0.0015); }
      if (st.axis === 'y') { setLive('size'); setSize(st.size - dy / 3); }
    },
    end: () => setLive(null),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? setSize(m.size + d * 0.5) : setTrack(m.track + d * 0.005)), axis: 'both',
    over: setOver,
  });
  const show = over || live || peek === 'label' ? 'label' : peek === 'centre' ? 'centre' : undefined;
  const nextWeight = WEIGHTS[(WEIGHTS.indexOf(m.weight) + 1) % WEIGHTS.length];
  return (
    <>
      <p>The label decides how wide the button is. Drag the words sideways to change the space between letters, or up and down to change their size.</p>
      <div ref={well} className="ed-specimen">
        <div ref={box} className="ed-typebox" data-show={show} data-live={live ?? undefined} style={{ zoom }} data-hint-anchor>
          <Button cap={cap} style={{ fontSize: m.size, fontWeight: m.weight, letterSpacing: `${m.track}em` }}>
            <span ref={labelEl} className="ed-type-label" style={{ transform: m.optical ? 'translateY(-.5px)' : 'translateY(1px)' }} role="slider" tabIndex={0} aria-label="Label size and spacing" aria-valuetext={`${m.size} points, spacing ${m.track} em`} aria-valuenow={m.size} aria-valuemin={10} aria-valuemax={16} {...labelHandle}>{label}</span>
          </Button>
          {/* the two centres: the box's (grey) and the letters' (green), shown while you look at centring */}
          <span className="ed-centres" aria-hidden>
            <i className="is-box" /><i className="is-letters" style={{ top: `calc(50% ${m.optical ? '-' : '+'} ${m.optical ? 1.5 : 0}px)` }} />
          </span>
        </div>
      </div>
      <div className="ed-readouts">
        <Readout label="size" value={`${m.size}`} snap={m.size === SIZE_TOKEN ? { at: SIZE_TOKEN, name: 'token' } : undefined} peek={(on) => setPeek(on ? 'label' : null)} pick={() => { if (labelEl.current) { labelEl.current.dataset.summoned = ''; labelEl.current.focus(); } }}  scrub={(d) => setSize(m.size + d * 0.5)} />
        <Readout label="weight" value={`${m.weight}`} unit="" snap={m.weight === BUTTON_XRAY_INITIAL.weight ? { at: 500, name: 'token' } : undefined} peek={(on) => setPeek(on ? 'label' : null)} pick={() => set({ weight: nextWeight })} scrub={(d) => set({ weight: WEIGHTS[clamp(WEIGHTS.indexOf(m.weight) + d, 0, WEIGHTS.length - 1)] })} />
        <Readout label="spacing" value={m.track.toFixed(3)} unit="em" snap={m.track === TRACK_TOKEN ? { at: TRACK_TOKEN, name: 'token' } : undefined} peek={(on) => setPeek(on ? 'label' : null)} pick={() => { if (labelEl.current) { labelEl.current.dataset.summoned = ''; labelEl.current.focus(); } }}  scrub={(d) => setTrack(m.track + d * 0.005)} />
        <Readout label="centred on" value={m.optical ? 'letters' : 'box'} unit="" snap={m.optical ? { at: 1, name: 'token' } : undefined} peek={(on) => setPeek(on ? 'centre' : null)} pick={() => set({ optical: !m.optical })} scrub={(d) => set({ optical: d > 0 })} />
      </div>
    </>
  );
}

/**
 * The specimen's face from the model, the same recipe the x-ray draws: the fill turns with
 * the light, the inner lights scale with its strength, the outer shadows with the lift, and
 * a layer that is off is gone.
 */
export function useSpecimenFace(m: ButtonXrayModel, cap: ButtonCap) {
  const recipe = useRecipeLayers('button', cap === 'standard' ? 'self' : cap);
  const sh = recipe.shadows;
  const fill = m.on[0] ? `linear-gradient(${180 + m.lightDeg}deg, ${recipe.stops.join(', ')})` : 'transparent';
  const layers = [
    m.on[1] && sh[0] ? alphaK(sh[0], m.lightK) : null,
    m.on[2] && sh[1] ? alphaK(sh[1], m.lightK) : null,
    m.on[3] ? sh[2] ?? null : null,
    m.on[4] && sh[3] && m.lift > 0 ? scalePx(sh[3], Math.min(m.lift, 1.5)) : null,
    m.on[5] && sh[4] && m.lift > 0 ? scalePx(sh[4], m.lift) : null,
  ].filter(Boolean) as string[];
  return { background: fill, boxShadow: layers.join(', ') || 'none' };
}

/** Light, on the specimen: a sun on a faint orbit; around it turns the light, nearer or further sets its strength. */
export function LightSpecimen({ m, set, cap }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void; cap: ButtonCap }) {
  const [well, zoom] = useSpecimenZoom();
  const face = useSpecimenFace(m, cap);
  const [live, setLive] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const sunEl = React.useRef<HTMLSpanElement>(null);
  const R = 40; // the orbit, in the specimen's own units, around the button's centre
  const reach = (k: number) => R * (1.35 - k * 0.35); // stronger light sits nearer
  const at = (deg: number, k: number) => ({ x: Math.sin((deg * Math.PI) / 180) * reach(k), y: -Math.cos((deg * Math.PI) / 180) * reach(k) });
  const sun = at(m.lightDeg, m.lightK);
  const setLight = (x: number, y: number) => {
    let deg = clamp((Math.atan2(x, -y) * 180) / Math.PI, -90, 90);
    let k = clamp((1.35 - Math.hypot(x, y) / R) / 0.35, 0, 1.5);
    if (Math.abs(deg) < 4) deg = 0; else deg = Math.round(deg / 5) * 5;
    if (Math.abs(k - 1) < 0.08) k = 1; else k = Math.round(k * 20) / 20;
    set({ lightDeg: deg, lightK: k });
  };
  useOnLand(live && m.lightDeg === 0 && m.lightK === 1 ? 'home' : undefined, () => sunEl.current?.animate([{ scale: 1 }, { scale: 1.6, offset: 0.3 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' }));
  const sunHandle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Light', value: live ? `${m.lightDeg === 0 ? 'top' : m.lightDeg < 0 ? `${-m.lightDeg}° left` : `${m.lightDeg}° right`} · ${Math.round(m.lightK * 100)}%` : undefined, how: 'drag around the button, closer for stronger' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Light', value: `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%`, keys: [{ k: '←→', say: 'turn' }, { k: '↑↓', say: 'stronger' }] }),
    start: () => ({ ...sun }), move: (s0, dx, dy) => { setLive(true); setLight(s0.x + dx, s0.y + dy); }, end: () => setLive(false),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? set({ lightK: clamp(Math.round((m.lightK + d * 0.05) * 20) / 20, 0, 1.5) }) : set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) })), axis: 'both',
    over: setOver,
  });
  const lit = over || live || peek;
  return (
    <>
      <p>Light falls from the top, so the top edge of the button is brightest. Drag the sun to move the light, or closer to make it stronger.</p>
      <div ref={well} className="ed-specimen is-light">
        <div className="ed-lightbox" data-lit={lit ? '' : undefined} style={{ zoom }} data-hint-anchor>
          <Button cap={cap} style={face}><Says /></Button>
          {/* the sun's path: the upper half only, from the left, over the top, to the right */}
          <svg className="ed-orbit" width={reach(0) * 2 + 2} height={reach(0) + 1} viewBox={`${-reach(0) - 1} ${-reach(0) - 1} ${reach(0) * 2 + 2} ${reach(0) + 1}`} style={{ translate: `0 ${-reach(0) / 2}px` }} aria-hidden>
            <path d={`M${-reach(0)} 0A${reach(0)} ${reach(0)} 0 0 1 ${reach(0)} 0`} />
            <path className="is-near" d={`M${-reach(1.5)} 0A${reach(1.5)} ${reach(1.5)} 0 0 1 ${reach(1.5)} 0`} />
          </svg>
          <span ref={sunEl} className="ed-sun" style={{ translate: `${sun.x}px ${sun.y}px` }} role="slider" tabIndex={0} aria-label="Light direction and strength" aria-valuetext={`${m.lightDeg} degrees, ${Math.round(m.lightK * 100)} percent`} aria-valuenow={m.lightDeg} aria-valuemin={-90} aria-valuemax={90} {...sunHandle} />
        </div>
      </div>
      <div className="ed-readouts">
        <Readout label="from" value={m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}`} unit={m.lightDeg === 0 ? '' : m.lightDeg < 0 ? '° left' : '° right'} snap={m.lightDeg === 0 ? { at: 0, name: 'token' } : undefined} peek={setPeek} pick={() => summon(sunEl.current)}  scrub={(d) => set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) })} />
        <Readout label="strength" value={`${Math.round(m.lightK * 100)}`} unit="%" snap={m.lightK === 1 ? { at: 1, name: 'token' } : undefined} peek={setPeek} pick={() => summon(sunEl.current)} scrub={(d) => set({ lightK: clamp(Math.round((m.lightK + d * 0.05) * 20) / 20, 0, 1.5) })} />
      </div>
    </>
  );
}

/** Shadow, on the specimen: lift the button off the well; the shadow spreads under it as it rises. */
export function ShadowSpecimen({ m, set, cap }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void; cap: ButtonCap }) {
  const [well, zoom] = useSpecimenZoom();
  const face = useSpecimenFace(m, cap);
  const token = BUTTON_XRAY_INITIAL.lift;
  const [live, setLive] = React.useState(false);
  const btn = React.useRef<HTMLSpanElement>(null);
  const setLift = (v: number) => { const x = Math.round(clamp(v, 0, 3) * 10) / 10; set({ lift: Math.abs(x - token) < 0.15 ? token : x }); };
  const lift = useHandle({
    zoom,
    hint: () => ({ gesture: 'press', title: 'Height', value: live ? m.lift.toFixed(1) : undefined, how: 'drag up to raise, down to lower' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Height', value: m.lift.toFixed(1), keys: [{ k: '↑↓', say: 'higher' }] }),
    start: () => m.lift, move: (l0, _dx, dy) => { setLive(true); setLift(l0 - dy / 6); }, end: () => setLive(false),
    step: (d) => setLift(m.lift + d * 0.1), axis: 'y',
  });
  useOnLand(live && m.lift === token ? 'token' : undefined, () => btn.current?.animate([{ scale: 1 }, { scale: 1.04, offset: 0.3 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' }));
  return (
    <>
      <p>The shadow shows how high the button sits above the page. Drag the button up to raise it: the shadow grows bigger and softer.</p>
      <div ref={well} className="ed-specimen">
        <div style={{ zoom }} data-hint-anchor>
          <span ref={btn} className="ed-lift" data-live={live ? '' : undefined} style={{ translate: `0 ${-(m.lift - token) * 3}px` }} role="slider" tabIndex={0} aria-label="Height above the page" aria-valuenow={m.lift} aria-valuemin={0} aria-valuemax={3} {...lift}>
            <Button cap={cap} tabIndex={-1} style={face}><Says /></Button>
          </span>
        </div>
      </div>
      <div className="ed-readouts"><Readout label="height" value={m.lift.toFixed(1)} unit="" snap={m.lift === token ? { at: token, name: 'token' } : undefined} scrub={(d) => set({ lift: Math.round(clamp(m.lift + d * 0.1, 0, 3) * 10) / 10 })} /></div>
    </>
  );
}

/**
 * Layers, on the specimen: each layer is a row with a switch, since turning a layer off
 * takes effect at once. The whole row toggles; hovering it points at its slice in the model.
 */
export function LayersSpecimen({ m, set, focus, cap }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void; focus: (i: number | null) => void; cap: ButtonCap }) {
  const [well, zoom] = useSpecimenZoom();
  const face = useSpecimenFace(m, cap);
  const toggle = (i: number, on: boolean) => set({ on: m.on.map((v, j) => (j === i ? on : v)) });
  return (
    <>
      <p>The button is six layers stacked on top of each other. Turn a layer off to see what it adds.</p>
      <div ref={well} className="ed-specimen"><div style={{ zoom }}><Button cap={cap} style={face}><Says /></Button></div></div>
      <div className="ed-layers">
        {LAYERS.map((l, i) => (
          <Row.Root key={l.name} variant="list" className="ed-layer" data-off={m.on[i] ? undefined : ''}
            onPointerEnter={() => focus(i)} onPointerLeave={() => focus(null)}
            onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(i, !m.on[i]); }}>
            <Row.Text>{l.name}</Row.Text>
            <Row.Trail>
              <Switch size="small" aria-label={l.name} checked={m.on[i]} onCheckedChange={(v) => toggle(i, v)} onFocus={() => focus(i)} onBlur={() => focus(null)} />
            </Row.Trail>
          </Row.Root>
        ))}
      </div>
    </>
  );
}

/** Press, on the specimen: hold it and pull down to set how far it sinks; the model sinks with it. */
export function PressSpecimen({ travel, setTravel, onPress, cap }: { travel: number; setTravel: (v: number) => void; onPress: (on: boolean) => void; cap: ButtonCap }) {
  const [well, zoom] = useSpecimenZoom();
  const token = Number(P.self.travel);
  const [held, setHeld] = React.useState(false);
  const set = (v: number) => setTravel(Math.round(clamp(v, 0.5, 4) * 4) / 4);
  const press = useHandle({
    zoom,
    hint: () => ({ gesture: 'press', title: 'Press depth', value: held ? `${travel}pt` : undefined, how: 'press and pull down' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Press depth', value: `${travel}pt`, keys: [{ k: '↑↓', say: 'deeper' }] }),
    start: () => { setHeld(true); onPress(true); return travel; }, move: (t0, _dx, dy) => set(t0 + dy / 6), end: () => { setHeld(false); onPress(false); },
    step: (d) => set(travel - d * 0.25), axis: 'y',
  });
  return (
    <>
      <p>When you press the button it moves down a little, then springs back when you let go. Press it and pull down to choose how far it moves.</p>
      <div ref={well} className="ed-specimen">
        <div className="ed-press" style={{ zoom }} data-hint-anchor>
          <Button cap={cap} style={{ ['--mu-r-button-self-travel' as string]: `${travel}px` }} {...press}><Says /></Button>
          <div className="ed-gauge" aria-hidden data-held={held ? '' : undefined}>
            {[0, 1, 2, 3, 4].map((n) => <i key={n} style={{ top: n * 6 }} data-token={n === token ? '' : undefined} />)}
            <b style={{ top: travel * 6 }} />
          </div>
        </div>
      </div>
      <div className="ed-readouts"><Readout label="sinks" value={`${travel}`} snap={travel === token ? { at: token, name: 'token' } : undefined} scrub={(d) => set(travel + d * 0.25)} /></div>
    </>
  );
}

/** The card for a part of the button's x-ray. */
export function ButtonSpecimenCard({ spot, m, set, cap, label, icon, travel, setTravel, setPressed, setFocusLayer }: {
  spot: string; m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void; cap: ButtonCap; label: string; icon: IconName | 'none';
  travel: number; setTravel: (v: number) => void; setPressed: (on: boolean) => void; setFocusLayer: (i: number | null) => void;
}) {
  return <Face.Provider value={{ label, icon }}><Part spot={spot} m={m} set={set} cap={cap} travel={travel} setTravel={setTravel} setPressed={setPressed} setFocusLayer={setFocusLayer} /></Face.Provider>;
}

function Part({ spot, m, set, cap, travel, setTravel, setPressed, setFocusLayer }: {
  spot: string; m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void; cap: ButtonCap;
  travel: number; setTravel: (v: number) => void; setPressed: (on: boolean) => void; setFocusLayer: (i: number | null) => void;
}) {
  switch (spot) {
    case 'shape': return <ShapeSpecimen m={m} set={set} cap={cap} />;
    case 'type': return <TypeSpecimen m={m} set={set} cap={cap} />;
    case 'light': return <LightSpecimen m={m} set={set} cap={cap} />;
    case 'shadow': return <ShadowSpecimen m={m} set={set} cap={cap} />;
    case 'layers': return <LayersSpecimen m={m} set={set} focus={setFocusLayer} cap={cap} />;
    default: return <PressSpecimen travel={travel} setTravel={setTravel} onPress={setPressed} cap={cap} />;
  }
}
