import * as React from 'react';
import { Button, Row, Switch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { ChipReal, LAYERS, QUESTIONS, type Look, type Model, type Spot } from './ChipXray';
import { STEP_AT, Outline, Readout, blip, clamp, snapTo, summon, useHandle, useOnLand, useSpecimenZoom, type Hint, type Seg } from '../edit';
import './chip-specimens.css';

/* ─────────────────────────────────────────────────────────
 * THE SUGGESTION CHIP'S SPECIMENS · the x-ray card for each part
 *
 *   The card holds the real SuggestionChip to handle; the bench reads the same model.
 *     type      drag the question sideways to step through example questions (a step);
 *               drag the confidence sideways to change how sure it is (free)
 *     states    point at its line and the chip turns clear (the real host hover); a switch
 *               keeps it clear; replay its arrival
 *     answer    press ✓ or × on the chip itself
 *     surface   drag the chip up or down for its frost (catches on the recipe); the green
 *               line is a switch
 *     shape     the top line sets its height, the left edge the space on the left
 *     layers    a row with a switch per layer
 *   The chip is always a pill and comes in one size, so it gets no corner or size step.
 *   LAYERS and QUESTIONS come from ChipXray and are only read inside functions (the x-ray
 *   imports this file); every number is read from tokens.json here.
 * ───────────────────────────────────────────────────────── */

type Props = {
  spot: Spot; m: Model; set: (patch: Partial<Model>) => void; focus: (name: string | null) => void;
  look: Look; gone: null | 'yes' | 'no'; answer: (a: 'yes' | 'no') => void; arrive: () => void;
};

const P = tokens.recipes.chip.props.suggestion;
const SUGG = tokens.suggestion;
/** The frost at rest: the alpha of the recipe's suggestion background. */
const FROST = Number((tokens.recipes.chip.layers as { part: string; prop: string; value: string }[]).find((l) => l.part === 'suggestion' && l.prop === 'background')!.value.match(/,\s*([\d.]+)\)$/)![1]);
/**
 * How sure a suggestion can be: the agent guide's routing table (numbers suggest from .60 up to
 * below .85; above that the cue applies quietly, below it nothing happens). Not a token, so the
 * readout's LED stays off.
 */
const SURE = { lo: 0.6, hi: 0.84 };
const HEIGHT = { lo: SUGG['button-height'], hi: P.height * 1.6 };
const PAD = { lo: P['pad-right'], hi: P['pad-left'] * 2 };
const round2 = (v: number) => Math.round(v * 100) / 100;
const token = (v: number, at: number, name: string) => (v === at ? { at, name } : undefined);

/** The real chip, set to the config like the table's object and the model's face, so the specimen and the
 *  bench draw the same values. Nothing on it animates: a tunable follows the finger exactly. */
function Face({ m, look, host, answer }: { m: Model; look: Look; host?: boolean; answer?: (a: 'yes' | 'no') => void }) {
  return <ChipReal m={host === undefined ? m : { ...m, host }} look={look} onAnswer={answer} />;
}
function Well({ well, zoom, children }: { well: React.RefObject<HTMLDivElement | null>; zoom: number; children: React.ReactNode }) {
  return <div ref={well} className="ed-specimen"><div style={{ zoom }}>{children}</div></div>;
}

/** Where a part of the chip sits inside the box, in the box's own (unzoomed) units. */
function usePlace(box: React.RefObject<HTMLElement | null>, selector: string, deps: unknown[]) {
  const [at, setAt] = React.useState<React.CSSProperties>({ display: 'none' });
  React.useLayoutEffect(() => {
    const b = box.current, el = b?.querySelector<HTMLElement>(selector);
    if (!b || !el) return;
    // layout offsets, not client rects: the chip arrives with a small drop and scale, and the
    // frame must sit where the word rests, not where it was mid-arrival
    const read = () => {
      let left = 0, top = 0;
      for (let n: HTMLElement | null = el; n && n !== b; n = n.offsetParent as HTMLElement | null) { left += n.offsetLeft; top += n.offsetTop; }
      setAt({ left: left - 2, top, width: el.offsetWidth + 4, height: el.offsetHeight });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(b);
    return () => ro.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return at;
}

/* ───────────────────────── type: the question and how sure ───────────────────────── */

function Type({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const box = React.useRef<HTMLDivElement>(null);
  const qEl = React.useRef<HTMLSpanElement>(null), cEl = React.useRef<HTMLSpanElement>(null);
  const [live, setLive] = React.useState<null | 'q' | 'c'>(null);
  const [peek, setPeek] = React.useState<null | 'q' | 'c'>(null);
  const [lean, setLean] = React.useState<string | null>(null);
  const index = Math.max(0, QUESTIONS.indexOf(m.label));
  const qAt = usePlace(box, '.mu-chip-text', [m.label, m.conf, m.h, m.padL, zoom]);
  const cAt = usePlace(box, '.mu-suggestion-conf', [m.label, m.conf, m.h, m.padL, zoom]);
  const ask = (d: number) => { const next = QUESTIONS[clamp(index + Math.sign(d), 0, QUESTIONS.length - 1)]; if (next !== m.label) set({ label: next }); };
  const sure = (v: number) => set({ conf: round2(clamp(v, SURE.lo, SURE.hi)) });
  const question = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'steps', title: 'Question', value: live === 'q' ? (lean ? `→ ${lean}` : m.label) : undefined, how: 'drag sideways to change it' }),
    keyHint: (): Hint => ({ gesture: 'steps', title: 'Question', value: m.label, keys: [{ k: '←→', say: 'step' }] }),
    start: () => { setLive('q'); return { index, at: 0 }; },
    move: (s, dx) => {
      const delta = dx - s.at, d = Math.sign(delta), next = QUESTIONS[s.index + d];
      if (next && Math.abs(delta) >= STEP_AT) { set({ label: next }); s.index += d; s.at = dx; setLean(null); }
      else setLean(next && Math.abs(delta) > 2 ? next : null);
    },
    end: () => { setLive(null); setLean(null); },
    step: (d) => ask(d), axis: 'x', over: (on) => setPeek(on ? 'q' : null),
  });
  const confidence = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'sides', title: 'How sure', value: live === 'c' ? m.conf.toFixed(2) : undefined, how: 'drag right for surer' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'How sure', value: m.conf.toFixed(2), keys: [{ k: '←→', say: 'change' }] }),
    start: () => { setLive('c'); return m.conf; },
    move: (start, dx) => sure(start + dx / 200),
    end: () => setLive(null),
    step: (d) => sure(m.conf + d * 0.01), axis: 'x', over: (on) => setPeek(on ? 'c' : null),
  });
  return <>
    <p>The chip asks one short question and always says how sure the app is, from 0 to 1. Drag the question sideways to try another one, or drag the number to change how sure it is.</p>
    <Well well={well} zoom={zoom}>
      <div ref={box} className="ed-chip-box" data-hint-anchor>
        <Face m={m} look={look} />
        <span ref={qEl} className="ed-chip-word" style={qAt} data-peek={peek === 'q' ? '' : undefined} data-live={live === 'q' ? '' : undefined} data-lean={lean ? '' : undefined}
          role="slider" tabIndex={0} aria-label="Question" aria-valuetext={m.label} aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={QUESTIONS.length} {...question} />
        <span ref={cEl} className="ed-chip-word" style={cAt} data-peek={peek === 'c' ? '' : undefined} data-live={live === 'c' ? '' : undefined}
          role="slider" tabIndex={0} aria-label="How sure" aria-valuenow={m.conf} aria-valuemin={SURE.lo} aria-valuemax={SURE.hi} {...confidence} />
      </div>
    </Well>
    <div className="ed-readouts">
      <Readout label="Question" value={m.label} unit="" snap={{ at: index, name: 'an example question' }} peek={(on) => setPeek(on ? 'q' : null)} pick={() => summon(qEl.current)} scrub={ask} />
      <Readout label="How sure" value={m.conf.toFixed(2)} unit="" peek={(on) => setPeek(on ? 'c' : null)} pick={() => summon(cEl.current)} scrub={(d) => sure(m.conf + d * 0.01)} />
    </div>
  </>;
}

/* ───────────────────────── states: quiet until you look ───────────────────────── */

function States({ m, set, look, arrive }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [arrivals, setArrivals] = React.useState(0);
  const held = React.useRef(m.host);
  const line = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'press', title: 'Point at the line', how: 'the chip turns clear' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Point at the line', how: 'use the switch below' }),
    start: () => null, move: () => {}, step: () => {},
    // pointing at the line is the host's hover: the real chip brightens, and so does the bench
    over: (on) => { if (on) { held.current = m.host; set({ host: true }); } else set({ host: held.current }); },
  });
  const rest = Math.round(SUGG['rest-opacity'] * 100);
  return <>
    <p>The chip waits half see-through so it never shouts over your writing. Point at the line it belongs to and it turns clear; when it first shows up it drops in from just above, without bouncing.</p>
    <Well well={well} zoom={zoom}>
      <span className="mu-icon-trigger ed-chip-line" data-hint-anchor>
        <span className="ed-chip-host" {...line}>slept 6h · mood 3</span>
        <Face key={arrivals} m={m} look={look} />
      </span>
    </Well>
    <div className="ed-readouts">
      <Readout label="At rest" value={`${rest}`} unit="%" snap={{ at: rest, name: 'suggestion rest opacity' }} />
      <Readout label="Drops from" value={`${SUGG['enter-rise']}`} snap={{ at: SUGG['enter-rise'], name: 'suggestion enter rise' }} />
    </div>
    <div className="ed-layers">
      <Row.Root variant="list" className="ed-layer" onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) set({ host: !m.host }); }}>
        <Row.Text>Point at the line</Row.Text>
        <Row.Trail><Switch size="small" aria-label="Point at the line" checked={m.host} onCheckedChange={(host) => { held.current = host; set({ host }); }} /></Row.Trail>
      </Row.Root>
    </div>
    <p className="ed-chip-actions"><Button size="compact" onClick={() => { setArrivals((n) => n + 1); arrive(); }}>Show it arriving</Button></p>
  </>;
}

/* ───────────────────────── answer: ✓ and × ───────────────────────── */

function Answer({ m, look, gone, answer }: Props) {
  const [well, zoom] = useSpecimenZoom();
  return <>
    <p>✓ says yes: the app makes the change, and you can undo it. × says no: the app remembers and never asks about this line again. Press either one on the chip.</p>
    <Well well={well} zoom={zoom}>
      <span className="ed-chip-answer" data-hint-anchor>
        {gone ? <span className="eng">{gone === 'yes' ? 'accepted · undo' : 'dismissed · won’t ask again'}</span> : <Face m={m} look={look} answer={answer} />}
      </span>
    </Well>
    <div className="ed-readouts">
      <Readout label="Each button" value={`${SUGG['button-width']} × ${SUGG['button-height']}`} snap={{ at: SUGG['button-width'], name: 'suggestion button size' }} />
    </div>
  </>;
}

/* ───────────────────────── surface: frost and the green line ───────────────────────── */

function Surface({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const box = React.useRef<HTMLDivElement>(null);
  const el = React.useRef<HTMLSpanElement>(null);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => { const b = box.current; if (!b) return; const read = () => setWidth(b.offsetWidth); read(); const ro = new ResizeObserver(read); ro.observe(b); return () => ro.disconnect(); }, []);
  const frost = (v: number, caught = true) => { const n = round2(clamp(v, 0.2, 1)); set({ frost: caught && Math.abs(n - FROST) <= 0.03 ? FROST : n }); };
  const handle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'press', title: 'Frost', value: live ? `${Math.round(m.frost * 100)}%` : undefined, how: 'drag up for more frost' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Frost', value: `${Math.round(m.frost * 100)}%`, keys: [{ k: '↑↓', say: 'change' }] }),
    start: () => { setLive(true); return m.frost; },
    move: (start, _dx, dy) => frost(start - dy / 40),
    end: () => setLive(false),
    step: (d) => frost(m.frost + d * 0.05), axis: 'y', over: setPeek, grab: () => blip(segs.current.top),
  });
  useOnLand(live && m.frost === FROST ? 'frost' : undefined, () => blip(segs.current.top, segs.current.right));
  const toggle = (on: boolean) => set({ on: m.on.map((v, i) => (i === 1 ? on : v)) });
  return <>
    <p>The chip is frosted, so the page shows through a little and it floats over your text. A thin green line goes around it: green always means the app suggests this. Drag the chip up for more frost or down for less.</p>
    <Well well={well} zoom={zoom}>
      <div ref={box} className="ed-box ed-chip-box" data-hint-anchor data-live={live ? 'frost' : undefined} data-peek={peek ? '' : undefined}>
        <Face m={m} look={look} />
        <div className="ed-overlay"><Outline W={width} h={m.h} r={m.h / 2} on={live || peek ? ['top', 'right'] : []} only={['top', 'right']} segs={segs} /></div>
        <span ref={el} className="ed-chip-frost" role="slider" tabIndex={0} aria-label="Frost" aria-valuenow={m.frost} aria-valuemin={0.2} aria-valuemax={1} aria-valuetext={`${Math.round(m.frost * 100)} percent`} {...handle} />
      </div>
    </Well>
    <div className="ed-readouts">
      <Readout label="Frost" value={`${Math.round(m.frost * 100)}`} unit="%" snap={token(m.frost, FROST, 'suggestion background')} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => frost(m.frost + d * 0.05, false)} />
    </div>
    <div className="ed-layers">
      <Row.Root variant="list" className="ed-layer" data-off={m.on[1] ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(!m.on[1]); }}>
        <Row.Text>Green line</Row.Text>
        <Row.Trail><Switch size="small" aria-label="Green line" checked={m.on[1]} onCheckedChange={toggle} /></Row.Trail>
      </Row.Root>
    </div>
  </>;
}

/* ───────────────────────── shape: height and the space on the left ───────────────────────── */

type ShapeName = 'Height' | 'Space on the left';
function Shape({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const box = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => { const b = box.current; if (!b) return; const read = () => setWidth(b.offsetWidth); read(); const ro = new ResizeObserver(read); ro.observe(b); return () => ro.disconnect(); }, []);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const refs = React.useRef<Partial<Record<ShapeName, HTMLSpanElement | null>>>({});
  const [active, setActive] = React.useState<ShapeName | null>(null);
  const [peek, setPeek] = React.useState<ShapeName | null>(null);
  const height = (v: number, caught = true) => { const n = clamp(v, HEIGHT.lo, HEIGHT.hi); set({ h: caught ? snapTo(n, [{ at: P.height, name: 'height' }])[0] : Math.round(n) }); };
  const pad = (v: number, caught = true) => { const n = clamp(v, PAD.lo, PAD.hi); set({ padL: caught ? snapTo(n, [{ at: P['pad-left'], name: 'pad-left' }])[0] : Math.round(n) }); };
  const on = (name: ShapeName) => (yes: boolean) => setPeek(yes ? name : null);
  const hHandle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'sides', title: 'Height', value: active === 'Height' ? `${m.h}pt` : undefined, how: 'drag up to make it taller' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Height', value: `${m.h}pt`, keys: [{ k: '↑↓', say: 'change' }] }),
    start: () => { setActive('Height'); return m.h; }, move: (start, _dx, dy) => height(start - dy), end: () => setActive(null),
    step: (d) => height(m.h + d, false), axis: 'y', over: on('Height'), grab: () => blip(segs.current.top),
  });
  const pHandle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'sides', title: 'Space on the left', value: active === 'Space on the left' ? `${m.padL}pt` : undefined, how: 'drag left for more space' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Space on the left', value: `${m.padL}pt`, keys: [{ k: '←→', say: 'change' }] }),
    start: () => { setActive('Space on the left'); return m.padL; }, move: (start, dx) => pad(start - dx), end: () => setActive(null),
    step: (d) => pad(m.padL + d, false), axis: 'x', over: on('Space on the left'), grab: () => blip(segs.current.left),
  });
  useOnLand(active === 'Height' && m.h === P.height ? 'h' : undefined, () => blip(segs.current.top));
  useOnLand(active === 'Space on the left' && m.padL === P['pad-left'] ? 'pad' : undefined, () => blip(segs.current.left));
  const lit = active ?? peek;
  const shown: Seg[] = lit === 'Height' ? ['top'] : lit === 'Space on the left' ? ['left'] : ['top', 'left'];
  return <>
    <p>A small pill, {P.height} pt tall, with more space on the left than the right because ✓ and × carry their own. Drag the top edge to change its height, or the left end to change the space before the question.</p>
    <Well well={well} zoom={zoom}>
      <div ref={box} className="ed-box ed-chip-box" data-hint-anchor data-live={active ?? undefined} data-peek={peek ?? undefined} data-shown={shown.join(' ')}>
        <Face m={m} look={look} />
        <div className="ed-overlay">
          <Outline W={width} h={m.h} r={m.h / 2} on={lit === 'Height' ? ['top'] : lit === 'Space on the left' ? ['left'] : []} only={shown} segs={segs} />
          <span ref={(el) => { refs.current.Height = el; }} className="ed-edge is-y" style={{ top: -3 }} role="slider" tabIndex={0} aria-label="Height" aria-valuenow={m.h} aria-valuemin={HEIGHT.lo} aria-valuemax={HEIGHT.hi} {...hHandle} />
          <span ref={(el) => { refs.current['Space on the left'] = el; }} className="ed-edge is-x" style={{ left: -3 }} role="slider" tabIndex={0} aria-label="Space on the left" aria-valuenow={m.padL} aria-valuemin={PAD.lo} aria-valuemax={PAD.hi} {...pHandle} />
        </div>
      </div>
    </Well>
    <div className="ed-readouts">
      <Readout label="Height" value={`${m.h}`} snap={token(m.h, P.height, 'suggestion height')} peek={on('Height')} pick={() => summon(refs.current.Height ?? null)} scrub={(d) => height(m.h + d, false)} />
      <Readout label="Space on the left" value={`${m.padL}`} snap={token(m.padL, P['pad-left'], 'suggestion pad left')} peek={on('Space on the left')} pick={() => summon(refs.current['Space on the left'] ?? null)} scrub={(d) => pad(m.padL + d, false)} />
      <Readout label="Space on the right" value={`${P['pad-right']}`} snap={{ at: P['pad-right'], name: 'suggestion pad right' }} />
    </div>
  </>;
}

/* ───────────────────────── layers ───────────────────────── */

function Layers({ m, set, focus, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const toggle = (index: number, value: boolean) => set({ on: m.on.map((old, i) => (i === index ? value : old)) });
  return <>
    <p>The chip has seven layers; turn one off to see what it adds.</p>
    <Well well={well} zoom={zoom}><Face m={m} look={look} /></Well>
    <div className="ed-layers">{LAYERS.map((layer, i) => (
      <Row.Root key={layer.name} variant="list" className="ed-layer" data-off={m.on[i] ? undefined : ''} onPointerEnter={() => focus(layer.name)} onPointerLeave={() => focus(null)} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(i, !m.on[i]); }}>
        <Row.Text>{layer.name}</Row.Text>
        <Row.Trail><Switch size="small" aria-label={layer.name} checked={m.on[i]} onCheckedChange={(v) => toggle(i, v)} onFocus={() => focus(layer.name)} onBlur={() => focus(null)} /></Row.Trail>
      </Row.Root>
    ))}</div>
  </>;
}

export function ChipSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'type': return <Type {...props} />;
    case 'states': return <States {...props} />;
    case 'press': return <Answer {...props} />;
    case 'surface': return <Surface {...props} />;
    case 'shape': return <Shape {...props} />;
    case 'layers': return <Layers {...props} />;
  }
}
