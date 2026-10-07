import * as React from 'react';
import { Row, Switch, Toolbar, ToolButton, ToolbarSeparator } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { scalePx, type LayerDef } from './kit';
import { CornerArc, Outline, Readout, STEP_AT, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom, type Hint, type Seg } from '../edit';
import './toolbar-specimens.css';

/* ─────────────────────────────────────────────────────────
 * THE TOOLBAR X-RAY'S CARDS · the real graphite toolbar, changed by handling it
 *
 *   Strip    its right end: the space around the tools            (tunable, token pad)
 *   Tools    the pressed cap: drag it onto another tool            (step, the real tools)
 *            the gap between two caps: the space between tools     (tunable, token gap)
 *   Groove   the groove: the space beside it                       (tunable, token sep margin)
 *            Groove on or off                                      (switch)
 *   Shape    the corner arc: outer corners                         (tunable, token radius)
 *            corners follow the caps                               (switch)
 *   Shadow   the strip itself: drag it up to float it higher       (tunable, 1 = the recipe)
 *   Layers   one row and switch per layer; hover lights it on the bench
 *
 * This file owns the config, its look and the object (the real toolbar set to a config), and the
 * recipe reads. ToolbarXray and the floating table import them from here, so nothing here reads
 * ToolbarXray while it loads (no circular import).
 * ───────────────────────────────────────────────────────── */

type RL = { part: string; prop: string; value: string; state?: string }[];
type Props0 = { self: { pad: number; gap: number; radius: number }; tool: { size: number; radius: number; glyph: number; ink: string; press: number }; led: { size: number; inset: number }; sep: { width: number; height: number; margin: number } };
export const RECIPE = tokens.recipes.toolbar as unknown as { props: Props0; layers: RL };
export const P = RECIPE.props;
export const pick = (part: string, prop: string, state?: string) => RECIPE.layers.filter((l) => l.part === part && l.prop === prop && (l.state ?? '') === (state ?? '')).map((l) => l.value);
export const STRIP_BG = pick('self', 'background')[0];
export const STRIP_SH = pick('self', 'shadow');

export const TOOLS = [{ id: 'select', label: 'Select' }, { id: 'note', label: 'Note' }, { id: 'draw', label: 'Draw' }, null, { id: 'tidy', label: 'Tidy' }] as const;
const OPTIONS = TOOLS.filter(Boolean) as { id: string; label: string }[];

export const LAYERS: LayerDef[] = [
  { name: 'Dark glass', why: 'A dark, almost solid fill. The toolbar is dark in both light and dark mode, so it always looks like the same object.' },
  { name: 'Inner glow', why: 'A faint light just inside the edge, like light caught in thick glass.' },
  { name: 'Top light', why: 'A soft bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A soft dark edge along the bottom right, where the glass turns away from the light.' },
  { name: 'Rim', why: 'A thin dark outline.' },
  { name: 'Contact', why: 'A small shadow right under the strip.' },
  { name: 'Near shadow', why: 'A soft shadow, a bit bigger.' },
  { name: 'Far shadow', why: 'A very big, very soft shadow. Together the three shadows say the toolbar floats higher than anything else on the page.' },
];

/** Everything a toolbar is set to: its real props first (the strip, which tool is pressed, whether the
 *  groove is there), then what the x-ray lets you tune. One object, handed from the table to the x-ray
 *  and back; the code for it is read off it. */
export interface ToolbarConfig {
  /** props: the graphite strip (the frost strip reads the colorway's frost tokens, not this recipe, so
   *  nothing tuned here would reach it), the pressed tool, and the groove between the groups */
  variant: 'graphite'; active: string; sep: boolean;
  /** recipe values: --mu-r-toolbar-*; the outer corners follow the caps unless you take hold of them */
  pad: number; gap: number; follow: boolean; radius: number; sepMargin: number;
  /** the strip's shadow stack, as a height above the page and which layers are on */
  lift: number; on: boolean[];
}
export type Model = ToolbarConfig;
export const INITIAL: ToolbarConfig = { variant: 'graphite', active: 'select', sep: true, pad: P.self.pad, gap: P.self.gap, follow: true, radius: P.self.radius, sepMargin: P.sep.margin, lift: 1, on: LAYERS.map(() => true) };

/** Outer corner = the cap's corner + the space around it; the recipe's own gap between the two curves keeps it at its token. */
const FOLLOW = P.self.radius - P.tool.radius - P.self.pad;
export const outerRadius = (m: Model) => (m.follow ? P.tool.radius + m.pad + FOLLOW : m.radius);
const maxRadius = (m: Model) => (P.tool.size + m.pad * 2) / 2;
/** How far each tunable reaches (the model's range, not a token). */
const PAD = [2, 16] as const, GAP = [0, 16] as const, MARGIN = [0, 10] as const, LIFT = [0, 3] as const;

/** The strip's shadow layers as the model has them: switched on or not, the two far shadows spread by the lift. */
export const stripShadows = (m: Model) => STRIP_SH.map((v, i) => (m.on[i + 1] ? (i >= 5 ? scalePx(v, m.lift) : v) : null));
/** The strip's shadow stack as the model has it. */
export function stripShadow(m: Model) {
  return stripShadows(m).filter(Boolean).join(', ') || 'none';
}
const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);

/** What a config looks like: the strip's fill and shadows for the model's hand-built parts, and the variables
 *  that set the real toolbar to it. Only what differs from the recipe is set, so a default config is the
 *  toolbar exactly as it ships, and the variables are the overrides its code needs. The graphite strip is the
 *  same in both colorways, so the colorway only rides along. */
export function toolbarLook(m: ToolbarConfig, colorway: Colorway) {
  const look = { colorway, fill: m.on[0] ? STRIP_BG : 'transparent', shadows: stripShadows(m), shadow: stripShadow(m), radius: outerRadius(m) };
  const style: Record<string, string> = {};
  if (m.pad !== INITIAL.pad) style['--mu-r-toolbar-self-pad'] = `${m.pad}px`;
  if (m.gap !== INITIAL.gap) style['--mu-r-toolbar-self-gap'] = `${m.gap}px`;
  if (look.radius !== P.self.radius) style['--mu-r-toolbar-self-radius'] = `${look.radius}px`;
  if (m.sep && m.sepMargin !== INITIAL.sepMargin) style['--mu-r-toolbar-sep-margin'] = `${m.sepMargin}px`;
  // the fill changes with its own layer; the shadow stack with the height or any of its layers
  if (!m.on[0]) style['--mu-r-toolbar-self-background'] = look.fill;
  if (m.lift !== INITIAL.lift || !same(m.on.slice(1), INITIAL.on.slice(1))) style['--mu-r-toolbar-self-shadow'] = look.shadow;
  return { ...look, style: style as React.CSSProperties };
}
export function useToolbarLook(m: ToolbarConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => toolbarLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useToolbarLook>;

/** The toolbar set to a config: the object on the table, the model's faces, the specimen in every card.
 *  Its config reaches it the way the library supports from a host: the recipe's variables on a wrapper. */
export function ToolbarObject({ config: m, onActive, label = 'Tools' }: { config: ToolbarConfig; onActive?: (id: string) => void; label?: string }) {
  const { style } = useToolbarLook(m);
  return (
    <div className="xr-tb-vars" style={style}>
      <Toolbar variant={m.variant} aria-label={label}>
        {TOOLS.map((t, i) => (t
          ? <ToolButton key={t.id} label={t.label} icon={<Icon name={t.id} size={P.tool.glyph} />} pressed={m.active === t.id} onPressedChange={(p) => p && onActive?.(t.id)} />
          : m.sep ? <ToolbarSeparator key={i} /> : null))}
      </Toolbar>
    </div>
  );
}

export type Spot = 'surface' | 'press' | 'well' | 'shape' | 'shadow' | 'layers';
type Props = { spot: Spot; m: Model; set: (patch: Partial<Model>) => void; focus: (name: string | null) => void };

const round = (v: number, places = 1) => Number(v.toFixed(places));
const near = (v: number, at: number, reach: number) => (Math.abs(v - at) <= reach ? at : v);
const token = (v: number, at: number, name = 'token') => (v === at ? { at, name } : undefined);
const keys = (k: string): Hint['keys'] => [{ k, say: 'change' }, { k: '⇧', say: 'faster' }];

/* ───────────────────────── the specimen ───────────────────────── */

/** The real toolbar in a card, set to the config: the graphite strip, its latched tools and the groove. */
function Strip({ m, set }: { m: Model; set: Props['set'] }) {
  return <ToolbarObject config={m} onActive={(active) => set({ active })} />;
}

type Rect = { x: number; y: number; w: number; h: number };
const NONE: Rect = { x: 0, y: 0, w: 0, h: 0 };
/** Where a part sits inside the box, in the box's own (unzoomed) units. */
function within(el: HTMLElement, box: HTMLElement): Rect {
  let x = 0, y = 0, n: HTMLElement | null = el;
  while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}
/** The strip, each tool cap and the groove, measured from the real component. */
function useGeometry(box: React.RefObject<HTMLDivElement | null>, m: Model) {
  const [g, setG] = React.useState<{ strip: Rect; tools: Rect[]; sep: Rect }>({ strip: NONE, tools: [], sep: NONE });
  React.useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const read = () => {
      const strip = el.querySelector<HTMLElement>('.mu-toolbar'); if (!strip) return;
      const sep = el.querySelector<HTMLElement>('.mu-toolbar-sep');
      setG({ strip: within(strip, el), tools: [...el.querySelectorAll<HTMLElement>('.mu-tool')].map((t) => within(t, el)), sep: sep ? within(sep, el) : NONE });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [box, m.pad, m.gap, m.sep, m.sepMargin, m.active]);
  return g;
}

/** The well: the toolbar at the card's zoom, never wider than the card (a phone shrinks it to fit). */
function useFit() {
  const [well, zoom] = useSpecimenZoom();
  const [room, setRoom] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = well.current; if (!el) return;
    const read = () => setRoom(el.clientWidth);
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [well]);
  // the widest the strip can get (every space at its most), so the zoom holds still while you drag
  const widest = OPTIONS.length * P.tool.size + (TOOLS.length - 1) * GAP[1] + P.sep.width + 2 * MARGIN[1] + 2 * PAD[1];
  return [well, room ? Math.min(zoom, (room - 24) / widest) : zoom] as const;
}

function Well({ well, zoom, children }: { well: React.RefObject<HTMLDivElement | null>; zoom: number; children: React.ReactNode }) {
  return <div ref={well} className="ed-specimen ed-tb-well"><div style={{ zoom }}>{children}</div></div>;
}

/* ───────────────────────── strip: the space around the tools ───────────────────────── */

function StripCard({ m, set }: Props) {
  const [well, zoom] = useFit();
  const box = React.useRef<HTMLDivElement>(null);
  const g = useGeometry(box, m);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const handleEl = React.useRef<HTMLSpanElement>(null);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const pad = (v: number, caught = true) => { const n = round(clamp(v, PAD[0], PAD[1])); set({ pad: caught ? near(n, P.self.pad, 0.6) : n }); };
  const handle = useHandle({
    zoom, axis: 'x',
    hint: () => ({ gesture: 'sides', title: 'Space around the tools', value: live ? `${m.pad}pt` : undefined, how: 'drag the end sideways', keys: keys('←→') }),
    keyHint: () => ({ gesture: 'sides', title: 'Space around the tools', value: `${m.pad}pt`, keys: keys('←→') }),
    start: () => m.pad, move: (s, dx) => { setLive(true); pad(s + dx); }, end: () => setLive(false),
    step: (d) => pad(m.pad + d), over: setPeek, grab: () => blip(segs.current.right),
  });
  useOnLand(live && m.pad === P.self.pad ? 'pad' : undefined, () => blip(segs.current.right));
  const lit = live || peek;
  return <>
    <p>The strip is a piece of dark glass that holds the tools, and it stays dark in light and dark mode. Drag its right end to change the space around the tools.</p>
    <Well well={well} zoom={zoom}>
      <div ref={box} className="ed-box ed-tb" data-hint-anchor data-live={live ? 'pad' : undefined} data-peek={peek ? '' : undefined} data-shown="right">
        <Strip m={m} set={set} />
        <div className="ed-overlay" style={{ left: g.strip.x, top: g.strip.y, width: g.strip.w, height: g.strip.h, right: 'auto', bottom: 'auto' }}>
          <Outline W={g.strip.w} h={g.strip.h} r={outerRadius(m)} on={lit ? ['right'] : []} only={['right']} segs={segs} />
          <span ref={handleEl} className="ed-edge is-x ed-tb-end" role="slider" tabIndex={0} aria-label="Space around the tools" aria-valuenow={m.pad} aria-valuemin={PAD[0]} aria-valuemax={PAD[1]} {...handle} />
        </div>
      </div>
    </Well>
    <div className="ed-readouts"><Readout label="Space around the tools" value={`${m.pad}`} snap={token(m.pad, P.self.pad)} peek={setPeek} pick={() => summon(handleEl.current)} scrub={(d) => pad(m.pad + d, false)} /></div>
  </>;
}

/* ───────────────────────── tools: the pressed tool, the space between tools ───────────────────────── */

function ToolsCard({ m, set }: Props) {
  const [well, zoom] = useFit();
  const box = React.useRef<HTMLDivElement>(null);
  const g = useGeometry(box, m);
  const els = React.useRef<Partial<Record<'tool' | 'gap', HTMLSpanElement | null>>>({});
  const [active, setActive] = React.useState<'tool' | 'gap' | null>(null);
  const [peek, setPeek] = React.useState<'tool' | 'gap' | null>(null);
  const [lean, setLean] = React.useState<number | null>(null);
  const current = Math.max(0, OPTIONS.findIndex((t) => t.id === m.active));
  const choose = (i: number) => { const next = OPTIONS[clamp(i, 0, OPTIONS.length - 1)]; if (next.id !== m.active) set({ active: next.id }); };
  const gap = (v: number, caught = true) => { const n = round(clamp(v, GAP[0], GAP[1])); set({ gap: caught ? near(n, P.self.gap, 0.6) : n }); };
  const tool = useHandle<{ index: number; traveled: number }>({
    zoom, axis: 'x',
    hint: () => ({ gesture: 'steps', title: 'Tool', value: active === 'tool' ? (lean !== null ? `→ ${OPTIONS[lean].label}` : OPTIONS[current].label) : undefined, how: 'drag it onto another tool', keys: [{ k: '←→', say: 'choose' }] }),
    keyHint: () => ({ gesture: 'steps', title: 'Tool', value: OPTIONS[current].label, keys: [{ k: '←→', say: 'choose' }] }),
    start: () => ({ index: current, traveled: 0 }),
    move: (s, dx) => {
      setActive('tool');
      const travel = dx - s.traveled, dir = Math.sign(travel), target = s.index + dir;
      const real = dir !== 0 && target >= 0 && target < OPTIONS.length;
      // lean first (the target cap's outline lights), then click over; the cap never slides
      if (real && Math.abs(travel) >= STEP_AT) { choose(target); s.index = target; s.traveled = dx; setLean(null); }
      else setLean(real && Math.abs(travel) > 2 ? target : null);
    },
    end: () => { setActive(null); setLean(null); },
    step: (d) => choose(current + Math.sign(d)),
    over: (on) => setPeek(on ? 'tool' : null),
  });
  const gapHandle = useHandle({
    zoom, axis: 'x',
    hint: () => ({ gesture: 'sides', title: 'Space between tools', value: active === 'gap' ? `${m.gap}pt` : undefined, how: 'drag the gap sideways', keys: keys('←→') }),
    keyHint: () => ({ gesture: 'sides', title: 'Space between tools', value: `${m.gap}pt`, keys: keys('←→') }),
    start: () => m.gap, move: (s, dx) => { setActive('gap'); gap(s + dx / 2); }, end: () => setActive(null),
    step: (d) => gap(m.gap + d), over: (on) => setPeek(on ? 'gap' : null), grab: () => blip(els.current.gap),
  });
  useOnLand(active === 'gap' && m.gap === P.self.gap ? 'gap' : undefined, () => blip(els.current.gap));
  const cap = g.tools[current] ?? NONE, a = g.tools[0] ?? NONE, b = g.tools[1] ?? NONE;
  const leanAt = lean !== null ? g.tools[lean] : undefined;
  return <>
    <p>Each tool is a small dark cap, and the one you are using stays down with a green light. Drag the pressed tool onto another one to pick it, or drag the gap between two tools to space them out.</p>
    <Well well={well} zoom={zoom}>
      <div ref={box} className="ed-box ed-tb" data-hint-anchor data-live={active ?? undefined} data-peek={peek ?? undefined}>
        <Strip m={m} set={set} />
        <div className="ed-overlay">
          {leanAt && <i className="ed-tb-lean" style={{ left: leanAt.x, top: leanAt.y, width: leanAt.w, height: leanAt.h }} aria-hidden />}
          <span ref={(el) => { els.current.tool = el; }} className="ed-tb-cap" data-on={active === 'tool' || peek === 'tool' ? '' : undefined} style={{ left: cap.x, top: cap.y, width: cap.w, height: cap.h }}
            role="slider" tabIndex={0} aria-label="Tool" aria-valuetext={OPTIONS[current].label} aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={OPTIONS.length} {...tool} />
          <span ref={(el) => { els.current.gap = el; }} className="ed-tb-gap" data-on={active === 'gap' || peek === 'gap' ? '' : undefined} style={{ left: a.x + a.w, top: a.y + a.h * 0.2, width: Math.max(0, b.x - a.x - a.w), height: a.h * 0.6 }}
            role="slider" tabIndex={0} aria-label="Space between tools" aria-valuenow={m.gap} aria-valuemin={GAP[0]} aria-valuemax={GAP[1]} {...gapHandle} />
        </div>
      </div>
    </Well>
    <div className="ed-readouts">
      <Readout label="Tool" value={OPTIONS[current].label} unit="" snap={{ at: current, name: OPTIONS[current].label }} peek={(on) => setPeek(on ? 'tool' : null)} pick={() => summon(els.current.tool ?? null)} scrub={(d) => choose(current + d)} />
      <Readout label="Space between tools" value={`${m.gap}`} snap={token(m.gap, P.self.gap)} peek={(on) => setPeek(on ? 'gap' : null)} pick={() => summon(els.current.gap ?? null)} scrub={(d) => gap(m.gap + d, false)} />
    </div>
  </>;
}

/* ───────────────────────── groove: on or off, and the space beside it ───────────────────────── */

function GrooveCard({ m, set }: Props) {
  const [well, zoom] = useFit();
  const box = React.useRef<HTMLDivElement>(null);
  const g = useGeometry(box, m);
  const el = React.useRef<HTMLSpanElement>(null);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const margin = (v: number, caught = true) => { const n = round(clamp(v, MARGIN[0], MARGIN[1])); set({ sepMargin: caught ? near(n, P.sep.margin, 0.4) : n }); };
  const handle = useHandle({
    zoom, axis: 'x',
    hint: () => ({ gesture: 'sides', title: 'Space beside the groove', value: live ? `${m.sepMargin}pt` : undefined, how: 'drag the groove sideways', keys: keys('←→') }),
    keyHint: () => ({ gesture: 'sides', title: 'Space beside the groove', value: `${m.sepMargin}pt`, keys: keys('←→') }),
    start: () => m.sepMargin, move: (s, dx) => { setLive(true); margin(s + dx / 2); }, end: () => setLive(false),
    step: (d) => margin(m.sepMargin + d * 0.5), over: setPeek, grab: () => blip(el.current),
  });
  useOnLand(live && m.sepMargin === P.sep.margin ? 'margin' : undefined, () => blip(el.current));
  // the handle frames the groove and the space either side of it, never the caps
  const frame = { left: g.sep.x - m.sepMargin, top: g.sep.y, width: g.sep.w + m.sepMargin * 2, height: g.sep.h };
  return <>
    <p>A thin groove cut into the strip splits the tools into groups: tools that make things, and a tool that tidies. Drag the groove sideways to change the space beside it, or switch it off.</p>
    <Well well={well} zoom={zoom}>
      <div ref={box} className="ed-box ed-tb" data-hint-anchor data-live={live ? '' : undefined} data-peek={peek ? '' : undefined}>
        <Strip m={m} set={set} />
        <div className="ed-overlay">
          {m.sep && <span ref={el} className="ed-tb-groove" data-on={live || peek ? '' : undefined} style={frame} role="slider" tabIndex={0} aria-label="Space beside the groove" aria-valuenow={m.sepMargin} aria-valuemin={MARGIN[0]} aria-valuemax={MARGIN[1]} {...handle} />}
        </div>
      </div>
    </Well>
    {m.sep && <div className="ed-readouts"><Readout label="Space beside the groove" value={`${m.sepMargin}`} snap={token(m.sepMargin, P.sep.margin)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => margin(m.sepMargin + d * 0.5, false)} /></div>}
    <div className="ed-layers"><Row.Root variant="list" className="ed-layer" data-off={m.sep ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) set({ sep: !m.sep }); }}><Row.Text>Groove</Row.Text><Row.Trail><Switch size="small" aria-label="Groove" checked={m.sep} onCheckedChange={(sep) => set({ sep })} /></Row.Trail></Row.Root></div>
  </>;
}

/* ───────────────────────── shape: outer corners that follow the caps ───────────────────────── */

function ShapeCard({ m, set }: Props) {
  const [well, zoom] = useFit();
  const box = React.useRef<HTMLDivElement>(null);
  const g = useGeometry(box, m);
  const arc = React.useRef<SVGPathElement | null>(null);
  const el = React.useRef<HTMLSpanElement>(null);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const r = outerRadius(m);
  // taking hold of the corner lets go of the rule: the corners are now yours
  const corners = (v: number, caught = true) => { const n = round(clamp(v, 0, maxRadius(m))); set({ follow: false, radius: caught ? near(n, P.self.radius, 0.8) : n }); };
  const handle = useHandle({
    zoom, axis: 'both',
    hint: () => ({ gesture: 'corner', title: 'Outer corners', value: live ? `${r}pt` : undefined, how: 'drag the corner in or out', keys: keys('←→') }),
    keyHint: () => ({ gesture: 'corner', title: 'Outer corners', value: `${r}pt`, keys: keys('←→') }),
    start: () => r, move: (s, dx, dy) => { setLive(true); corners(s + (dx + dy) / 2); }, end: () => setLive(false),
    step: (d) => corners(r + d), over: setPeek, grab: () => blip(arc.current),
  });
  useOnLand(live && r === P.self.radius ? 'corners' : undefined, () => blip(arc.current));
  return <>
    <p>The outer corners wrap the caps with the same gap all round, so they follow the space around the tools. Drag the corner to round it yourself, or let it follow the caps again.</p>
    <Well well={well} zoom={zoom}>
      <div ref={box} className="ed-box ed-tb" data-hint-anchor data-live={live ? 'corners' : undefined} data-peek={peek ? '' : undefined} data-shown="corner">
        <Strip m={m} set={set} />
        <div className="ed-overlay" style={{ left: g.strip.x, top: g.strip.y, width: g.strip.w, height: g.strip.h, right: 'auto', bottom: 'auto' }}>
          <span ref={el} className="ed-corner" style={{ width: Math.max(r, 6) + 3, height: Math.max(r, 6) + 3 }} role="slider" tabIndex={0} aria-label="Outer corners" aria-valuenow={r} aria-valuemin={0} aria-valuemax={maxRadius(m)} {...handle}>
            <CornerArc r={r} on={live || peek} arcRef={(p) => { arc.current = p; }} />
          </span>
        </div>
      </div>
    </Well>
    <div className="ed-readouts"><Readout label="Outer corners" value={`${r}`} snap={token(r, P.self.radius)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => corners(r + d, false)} /></div>
    <div className="ed-layers"><Row.Root variant="list" className="ed-layer" data-off={m.follow ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) set({ follow: !m.follow }); }}><Row.Text>Corners follow the caps</Row.Text><Row.Trail><Switch size="small" aria-label="Corners follow the caps" checked={m.follow} onCheckedChange={(follow) => set({ follow })} /></Row.Trail></Row.Root></div>
  </>;
}

/* ───────────────────────── shadow: how high it floats ───────────────────────── */

function ShadowCard({ m, set }: Props) {
  const [well, zoom] = useFit();
  const box = React.useRef<HTMLDivElement>(null);
  const g = useGeometry(box, m);
  const el = React.useRef<HTMLSpanElement>(null);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const lift = (v: number, caught = true) => { const n = round(clamp(v, LIFT[0], LIFT[1])); set({ lift: caught ? near(n, 1, 0.15) : n }); };
  const handle = useHandle({
    zoom, axis: 'y',
    hint: () => ({ gesture: 'press', title: 'Height above the page', value: live ? m.lift.toFixed(1) : undefined, how: 'drag the strip up or down', keys: keys('↑↓') }),
    keyHint: () => ({ gesture: 'press', title: 'Height above the page', value: m.lift.toFixed(1), keys: keys('↑↓') }),
    start: () => m.lift, move: (s, _dx, dy) => { setLive(true); lift(s - dy / 8); }, end: () => setLive(false),
    step: (d) => lift(m.lift + d * 0.1), over: setPeek,
  });
  useOnLand(live && m.lift === 1 ? 'lift' : undefined, () => blip(el.current));
  return <>
    <p>The toolbar floats higher than anything else on the page, so it casts three shadows: a small one where it would touch, a bigger one, and a very soft one. Drag the strip up to lift it higher.</p>
    <Well well={well} zoom={zoom}>
      <div ref={box} className="ed-box ed-tb" style={{ translate: `0 ${-(m.lift - 1) * 3}px` }} data-hint-anchor data-live={live ? '' : undefined} data-peek={peek ? '' : undefined}>
        <Strip m={m} set={set} />
        <div className="ed-overlay">
          <span ref={el} className="ed-tb-lift" data-on={live || peek ? '' : undefined} style={{ left: g.strip.x, top: g.strip.y, width: g.strip.w, height: g.strip.h, borderRadius: outerRadius(m) }}
            role="slider" tabIndex={0} aria-label="Height above the page" aria-valuenow={m.lift} aria-valuemin={LIFT[0]} aria-valuemax={LIFT[1]} {...handle} />
        </div>
      </div>
    </Well>
    <div className="ed-readouts"><Readout label="Height above the page" value={m.lift.toFixed(1)} unit="" snap={token(m.lift, 1)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => lift(m.lift + d * 0.1, false)} /></div>
  </>;
}

/* ───────────────────────── layers ───────────────────────── */

function LayersCard({ m, set, focus }: Props) {
  const [well, zoom] = useFit();
  const toggle = (i: number, on: boolean) => set({ on: m.on.map((x, j) => (j === i ? on : x)) });
  return <>
    <p>The strip is made of eight layers; the caps on it have their own, which the icon button shows. Turn a layer off to see what it adds.</p>
    <Well well={well} zoom={zoom}><div className="ed-tb"><Strip m={m} set={set} /></div></Well>
    <div className="ed-layers">{LAYERS.map((l, i) => (
      <Row.Root key={l.name} variant="list" className="ed-layer" data-off={m.on[i] ? undefined : ''} onPointerEnter={() => focus(l.name)} onPointerLeave={() => focus(null)} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(i, !m.on[i]); }}>
        <Row.Text>{l.name}</Row.Text>
        <Row.Trail><Switch size="small" aria-label={l.name} checked={m.on[i]} onCheckedChange={(on) => toggle(i, on)} onFocus={() => focus(l.name)} onBlur={() => focus(null)} /></Row.Trail>
      </Row.Root>
    ))}</div>
  </>;
}

export function ToolbarSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'surface': return <StripCard {...props} />;
    case 'press': return <ToolsCard {...props} />;
    case 'well': return <GrooveCard {...props} />;
    case 'shape': return <ShapeCard {...props} />;
    case 'shadow': return <ShadowCard {...props} />;
    case 'layers': return <LayersCard {...props} />;
  }
}
