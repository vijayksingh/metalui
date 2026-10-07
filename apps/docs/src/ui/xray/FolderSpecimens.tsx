import * as React from 'react';
import { Row, Switch, type FolderHue } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway } from '../../app/colorway';
import { FolderFace, HUES, LAYERS, MORE, seeOf, type Look, type Model } from './FolderXray';
import { Readout, STEP_AT, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom } from '../edit';
import './folder-specimens.css';

/* ─────────────────────────────────────────────────────────
 * FOLDER X-RAY CARDS: the real folder, handled
 *
 *   Drop in  point at the folder and its blocks rise; drag the block beside it onto it:
 *            it opens as the block comes over, takes it, and the flap swings shut
 *   Paper    the tab, dragged sideways, steps through the six paper colours (a lean, then a snap)
 *   Fan      the front block, dragged: up or down for how far the blocks rise, sideways to lean
 *   Flap     its top edge, dragged: tips the glass back
 *   Glass    the flap, dragged: sideways for frost, up or down for how much you see through
 *   Layers   a switch per layer of its material (the blocks are what it holds: Drop in)
 *
 * Every value is read here from tokens.json (the x-ray file imports this one); values from the
 * x-ray file are used only inside functions.
 * ───────────────────────────────────────────────────────── */

type Spot = 'states' | 'surface' | 'thumb' | 'slide' | 'light' | 'layers';
type Props = { spot: Spot; m: Model; set: (patch: Partial<Model>) => void; focus: (name: string | null) => void; look: Look };

type ByColorway = { bone: string; graphite: string };
const FR = tokens.recipes.folder.props as unknown as {
  self: { width: number; height: number };
  back: { height: number; 'tab-width': number; 'tab-rise': number };
  hue: Record<string, ByColorway>;
  card: { width: number; height: number; bottom: number };
  flap: { height: number; rest: string; hover: string; open: string; frost: string; 'fill-opacity': ByColorway };
  fan: Record<string, string>;
};
const FW = FR.self.width, FH = FR.self.height;
const REST = parseFloat(FR.flap.rest), HOVER = parseFloat(FR.flap.hover), OPEN = parseFloat(FR.flap.open);
const LIFT = parseFloat(FR.fan['rest-y-front']), LEAN = parseFloat(FR.fan['rest-r-front']);
const FROST = Number(FR.flap.frost.match(/blur\(([\d.]+)px\)/)?.[1]);
const BACK_TOP = FH - FR.back.height - FR.back['tab-rise'];
const CARD_TOP = FH - FR.card.bottom - FR.card.height;
const FLAP_TOP = FH - FR.flap.height;
/** The folder is large; the specimen shows it a little smaller than the other parts. */
const SCALE = 0.62;

const round = (v: number, places = 1) => Number(v.toFixed(places));
const catchAt = (v: number, at: number, reach: number) => (Math.abs(v - at) <= reach ? at : v);
const token = (v: number, at: number) => (v === at ? { at, name: 'folder recipe token' } : undefined);
const hueName = (h: FolderHue) => h[0].toUpperCase() + h.slice(1);

function Well({ children, well, zoom }: { children: React.ReactNode; well: React.RefObject<HTMLDivElement | null>; zoom: number }) {
  return <div ref={well} className="ed-specimen ed-folder-well"><div style={{ zoom }}>{children}</div></div>;
}

/* ───────────────────────── drop in ───────────────────────── */

function DropIn({ m, set, look }: Props) {
  const [well, zoom0] = useSpecimenZoom();
  // the block and the folder side by side: a little smaller again, so both fit the well
  const zoom = zoom0 * SCALE * 0.72;
  const folder = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<{ x: number; y: number } | null>(null);
  const [over, setOver] = React.useState(false);
  const [landed, setLanded] = React.useState(0);
  const [next, setNext] = React.useState(0);
  const start = React.useRef({ x: 0, y: 0 });
  const block = MORE[next % MORE.length];
  const inside = (x: number, y: number) => { const r = folder.current?.getBoundingClientRect(); return !!r && x > r.left && x < r.right && y > r.top && y < r.bottom; };
  const putIn = () => {
    set({ peeks: [...m.peeks, { ...block, id: `more-${next}` }], count: m.count + 1 });
    setLanded((n) => n + 1); setNext((n) => n + 1);
  };
  const takeOut = () => { if (m.count > 0) set({ peeks: m.peeks.slice(0, -1), count: m.count - 1 }); };
  return (
    <>
      <p>Point at the folder and its blocks rise out of it. Drag the block beside it onto it: the folder opens as the block comes over, takes it, and the flap swings shut.</p>
      <Well well={well} zoom={zoom}>
        <div className="ed-folder-drop" data-hint-anchor>
          <button
            type="button" className="ed-folder-block" aria-label="A block: drag it onto the folder, or press Enter to put it in"
            data-held={drag ? '' : undefined}
            style={{ translate: drag ? `${drag.x}px ${drag.y}px` : undefined }}
            onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); start.current = { x: e.clientX, y: e.clientY }; setDrag({ x: 0, y: 0 }); }}
            onPointerMove={(e) => { if (!drag) return; setDrag({ x: (e.clientX - start.current.x) / zoom, y: (e.clientY - start.current.y) / zoom }); setOver(inside(e.clientX, e.clientY)); }}
            onPointerUp={(e) => { if (!drag) return; if (inside(e.clientX, e.clientY)) putIn(); setDrag(null); setOver(false); }}
            onPointerCancel={() => { setDrag(null); setOver(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); putIn(); } }}
          >
            <span className="folder-card ed-folder-block-card">
              <span className="folder-thumb" style={{ background: block.thumb }} />
              <i className="folder-line folder-line-lg" style={{ width: '70%' }} />
              <i className={block.link ? 'folder-line folder-line-blue' : 'folder-line'} />
              <i className="folder-line" style={{ width: '60%' }} />
            </span>
          </button>
          <div ref={folder}><FolderFace m={m} look={look} open={over} landed={landed} /></div>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Blocks" value={`${m.count}`} unit="" scrub={(d) => (d > 0 ? putIn() : takeOut())} />
        <Readout label="Showing" value={`${Math.min(6, m.peeks.length)}`} unit="" />
      </div>
    </>
  );
}

/* ───────────────────────── paper ───────────────────────── */

function Paper({ m, set, look }: Props) {
  const [well, zoom0] = useSpecimenZoom();
  const zoom = zoom0 * SCALE;
  const { colorway } = useColorway();
  const ref = React.useRef<HTMLSpanElement>(null);
  const [lean, setLean] = React.useState<{ to: FolderHue; k: number } | null>(null);
  const [peek, setPeek] = React.useState(false);
  const at = HUES.indexOf(m.hue);
  const go = (i: number) => set({ hue: HUES[(i + HUES.length) % HUES.length] });
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'steps', title: 'Colour', value: lean ? `→ ${hueName(lean.to)}` : undefined, how: 'drag the tab sideways to change the paper' }),
    keyHint: () => ({ gesture: 'steps', title: 'Colour', value: hueName(m.hue), keys: [{ k: '←→', say: 'step' }] }),
    start: () => at,
    move: (s, dx) => {
      const steps = Math.trunc(dx / STEP_AT), rest = dx / STEP_AT - steps;
      const i = clamp(s + steps, 0, HUES.length - 1);
      if (HUES[i] !== m.hue) { go(i); blip(ref.current); }
      const toward = clamp(i + Math.sign(rest), 0, HUES.length - 1);
      setLean(toward !== i ? { to: HUES[toward], k: Math.abs(rest) } : null);
    },
    end: () => setLean(null),
    step: (d) => go(clamp(at + d, 0, HUES.length - 1)),
    axis: 'x', over: setPeek,
  });
  return (
    <>
      <p>The paper comes in six soft colours and the frosted flap takes the colour too. Drag the tab sideways to change it.</p>
      <Well well={well} zoom={zoom}>
        <div className="ed-folder-box" data-hint-anchor data-peek={peek || lean ? '' : undefined}>
          <FolderFace m={m} look={look} still />
          <span
            ref={ref} className="ed-folder-tab" role="slider" tabIndex={0} aria-label="Colour"
            aria-valuetext={hueName(m.hue)} aria-valuenow={at + 1} aria-valuemin={1} aria-valuemax={HUES.length}
            style={{ top: BACK_TOP - 4, width: FR.back['tab-width'] + 8, height: FR.back['tab-rise'] + 12 }}
            {...handle}
          >
            {lean && <i className="ed-folder-ghost" style={{ background: FR.hue[`${lean.to}-top`][colorway], opacity: 0.35 + lean.k * 0.65 }} />}
          </span>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Colour" value={hueName(m.hue)} unit="" peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => go(clamp(at + d, 0, HUES.length - 1))} />
      </div>
    </>
  );
}

/* ───────────────────────── fan ───────────────────────── */

function Fan({ m, set, look }: Props) {
  const [well, zoom0] = useSpecimenZoom();
  const zoom = zoom0 * SCALE;
  const ref = React.useRef<HTMLSpanElement>(null);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const setLift = (v: number, caught = true) => { const c = round(clamp(v, -60, 20)); set({ lift: caught ? catchAt(c, LIFT, 2) : c }); };
  const setLeanV = (v: number, caught = true) => { const c = round(clamp(v, -30, 30)); set({ lean: caught ? catchAt(c, LEAN, 1.5) : c }); };
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Fan', value: live ? `${-m.lift}pt · ${m.lean}°` : undefined, how: 'drag the front block up to raise it, sideways to lean it' }),
    keyHint: () => ({ gesture: 'corner', title: 'Fan', value: `${-m.lift}pt · ${m.lean}°`, keys: [{ k: '↑↓', say: 'rise' }, { k: '←→', say: 'lean' }] }),
    start: () => ({ lift: m.lift, lean: m.lean }),
    move: (s, dx, dy) => { setLive(true); setLift(s.lift + dy); setLeanV(s.lean + dx / 4); },
    end: () => setLive(false),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? setLift(m.lift - d, false) : setLeanV(m.lean + d, false)),
    axis: 'both', over: setPeek,
  });
  useOnLand(live && m.lift === LIFT ? 'lift' : undefined, () => blip(ref.current));
  useOnLand(live && m.lean === LEAN ? 'lean' : undefined, () => blip(ref.current));
  return (
    <>
      <p>The blocks inside peek out as cards, each leaning by its place in the pile. Drag the front one up to raise them, or sideways to lean them.</p>
      <Well well={well} zoom={zoom}>
        <div className="ed-folder-box" data-hint-anchor data-live={live ? '' : undefined} data-peek={peek ? '' : undefined}>
          <FolderFace m={m} look={look} still className={live ? 'is-live' : undefined} />
          <span
            ref={ref} className="ed-folder-front" role="slider" tabIndex={0} aria-label="Fan"
            aria-valuetext={`rise ${-m.lift}, lean ${m.lean} degrees`} aria-valuenow={-m.lift} aria-valuemin={-20} aria-valuemax={60}
            style={{ left: (FW - FR.card.width) / 2, top: CARD_TOP + m.lift - 4, width: FR.card.width, height: 34, rotate: `${m.lean}deg` }}
            {...handle}
          />
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Rise" value={`${-m.lift}`} snap={token(m.lift, LIFT)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => setLift(m.lift - d, false)} />
        <Readout label="Lean" value={`${m.lean}`} unit="°" snap={token(m.lean, LEAN)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => setLeanV(m.lean + d, false)} />
      </div>
    </>
  );
}

/* ───────────────────────── flap ───────────────────────── */

function Flap({ m, set, look }: Props) {
  const [well, zoom0] = useSpecimenZoom();
  const zoom = zoom0 * SCALE;
  const ref = React.useRef<HTMLSpanElement>(null);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  // it catches where it rests, and where it tips for a pointer and for a block coming over
  const change = (v: number, caught = true) => {
    const c = Math.round(clamp(v, -70, 0));
    const near = [REST, HOVER, OPEN].find((t) => Math.abs(c - t) <= 2);
    set({ flap: caught && near !== undefined ? near : c });
  };
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'sides', title: 'Tilt', value: live ? `${-m.flap}°` : undefined, how: 'drag the top edge up to tip the flap back' }),
    keyHint: () => ({ gesture: 'sides', title: 'Tilt', value: `${-m.flap}°`, keys: [{ k: '↑↓', say: 'tip' }] }),
    start: () => m.flap,
    move: (s, _dx, dy) => { setLive(true); change(s + dy * 0.8); },
    end: () => setLive(false),
    step: (d) => change(m.flap - d, false),
    axis: 'y', over: setPeek,
  });
  useOnLand(live && [REST, HOVER, OPEN].includes(m.flap) ? `flap${m.flap}` : undefined, () => blip(ref.current));
  const tipped = FR.flap.height * (1 - Math.cos((m.flap * Math.PI) / 180));
  return (
    <>
      <p>The front is a frosted glass flap hinged at the bottom. It rests tipped back a little, and further when you point at it or bring a block over. Drag its top edge to tip it.</p>
      <Well well={well} zoom={zoom}>
        <div className="ed-folder-box" data-hint-anchor data-live={live ? '' : undefined} data-peek={peek ? '' : undefined}>
          <FolderFace m={m} look={look} still className={live ? 'is-live' : undefined} />
          <span
            ref={ref} className="ed-folder-edge" role="slider" tabIndex={0} aria-label="Tilt"
            aria-valuenow={-m.flap} aria-valuemin={0} aria-valuemax={70}
            style={{ top: FLAP_TOP + tipped - 5 }}
            {...handle}
          />
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Tilt" value={`${-m.flap}`} unit="°" snap={token(m.flap, REST)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => change(m.flap - d, false)} />
      </div>
    </>
  );
}

/* ───────────────────────── glass ───────────────────────── */

function Glass({ m, set, look }: Props) {
  const [well, zoom0] = useSpecimenZoom();
  const zoom = zoom0 * SCALE;
  const { colorway } = useColorway();
  const ref = React.useRef<HTMLSpanElement>(null);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const SEE = Number(FR.flap['fill-opacity'][colorway]);
  const see = seeOf(m, colorway);
  const setFrost = (v: number, caught = true) => { const c = round(clamp(v, 0, 20)); set({ frost: caught ? catchAt(c, FROST, 0.8) : c }); };
  const setSee = (v: number, caught = true) => { const c = round(clamp(v, 0, 1), 2); set({ see: caught && Math.abs(c - SEE) <= 0.04 ? null : c }); };
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Glass', value: live ? `${m.frost}pt · ${Math.round((1 - see) * 100)}%` : undefined, how: 'drag sideways to frost it, up to see through it more' }),
    keyHint: () => ({ gesture: 'corner', title: 'Glass', value: `${m.frost}pt · ${Math.round((1 - see) * 100)}%`, keys: [{ k: '←→', say: 'frost' }, { k: '↑↓', say: 'see through' }] }),
    start: () => ({ frost: m.frost, see }),
    move: (s, dx, dy) => { setLive(true); setFrost(s.frost + dx / 6); setSee(s.see + dy / 120); },
    end: () => setLive(false),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? setSee(see - d * 0.05, false) : setFrost(m.frost + d * 0.5, false)),
    axis: 'both', over: setPeek,
  });
  useOnLand(live && m.frost === FROST ? 'frost' : undefined, () => blip(ref.current));
  useOnLand(live && m.see === null ? 'see' : undefined, () => blip(ref.current));
  return (
    <>
      <p>The flap blurs the blocks behind it, under a see-through fill in the paper's colour, so the name stays easy to read. Drag across it: sideways to frost it more, up to see through it more.</p>
      <Well well={well} zoom={zoom}>
        <div className="ed-folder-box" data-hint-anchor data-live={live ? '' : undefined} data-peek={peek ? '' : undefined}>
          <FolderFace m={m} look={look} still className={live ? 'is-live' : undefined} />
          <span
            ref={ref} className="ed-folder-glass" role="slider" tabIndex={0} aria-label="Glass"
            aria-valuetext={`frost ${m.frost}, see through ${Math.round((1 - see) * 100)} percent`} aria-valuenow={m.frost} aria-valuemin={0} aria-valuemax={20}
            style={{ top: FLAP_TOP + 14, height: FR.flap.height - 28 }}
            {...handle}
          />
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Frost" value={`${m.frost}`} snap={token(m.frost, FROST)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => setFrost(m.frost + d * 0.5, false)} />
        <Readout label="See through" value={`${Math.round((1 - see) * 100)}`} unit="%" snap={m.see === null ? { at: SEE, name: 'folder recipe token' } : undefined} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => setSee(see - d * 0.05, false)} />
      </div>
    </>
  );
}

/* ───────────────────────── layers ───────────────────────── */

function Layers({ m, set, focus, look }: Props) {
  const [well, zoom0] = useSpecimenZoom();
  const toggle = (i: number, v: boolean) => set({ on: m.on.map((o, j) => (j === i ? v : o)) });
  return (
    <>
      <p>The folder is paper, glass and shadow in layers. Turn one off to see what it adds; the blocks are what it holds, not a layer.</p>
      <Well well={well} zoom={zoom0 * SCALE}><FolderFace m={m} look={look} still /></Well>
      <div className="ed-layers">
        {LAYERS.map((l, i) => (
          <Row.Root key={l.name} variant="list" className="ed-layer" data-off={m.on[i] ? undefined : ''}
            onPointerEnter={() => focus(l.name)} onPointerLeave={() => focus(null)}
            onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(i, !m.on[i]); }}>
            <Row.Text>{l.name}</Row.Text>
            <Row.Trail><Switch size="small" aria-label={l.name} checked={m.on[i]} onCheckedChange={(v) => toggle(i, v)} onFocus={() => focus(l.name)} onBlur={() => focus(null)} /></Row.Trail>
          </Row.Root>
        ))}
      </div>
    </>
  );
}

export function FolderSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'states': return <DropIn {...props} />;
    case 'surface': return <Paper {...props} />;
    case 'thumb': return <Fan {...props} />;
    case 'slide': return <Flap {...props} />;
    case 'light': return <Glass {...props} />;
    case 'layers': return <Layers {...props} />;
  }
}
