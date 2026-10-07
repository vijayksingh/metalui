import * as React from 'react';
import { Button, Row, Switch } from '@unlocalhosted/metalui';
import { useColorway, type Colorway } from '../../app/colorway';
import { Wordmark, WORDMARK_ALL_LAYERS, WORDMARK_LAYERS, type WordmarkLayers } from '../Wordmark';
import { Callouts, Glyph, tones, useFit, type SpotDef, planeStyle } from './kit';
import { HintLayer, useSpecimenZoom } from '../edit';
import type { XrayViewProps } from '.';

/* ─────────────────────────────────────────────────────────
 * X-RAY · WORDMARK
 *
 *   solid     the mark as the table holds it: the enamel pill in its link button
 *   x-ray     a thick pill on the gridded floor. Its top is the table's object itself, laid out at
 *             the object's own zoom and scaled by transform, so the mark that lands on it is the
 *             mark that was on the table; the wall stands under it. Flown in, every part starts on
 *             one plane (the object that landed), then opens.
 *   card      the mark again, handled: a switch for each of its four layers.
 *   code      none. The wordmark is the site's own mark (apps/docs/src/ui/Wordmark.tsx), built
 *             from gradients and shadows of its own, not a library component, so there is no
 *             honest npm code to write for it.
 * ───────────────────────────────────────────────────────── */

const S = 2.6;
const SLICES = 5;
const WALL = 1.5;

type Spot = 'layers';
const SPOTS: SpotDef<Spot>[] = [{ id: 'layers', title: 'Layers', word: 'Enamel and chrome' }];
const SIDE: Record<Spot, ['right', number]> = { layers: ['right', 0.5] };

/** Everything the wordmark is set to: its real prop first (the cap height), then what the x-ray lets you switch.
 *  One object, handed from the table to the x-ray and back. */
export interface WordmarkConfig {
  /** prop: the cap height, in px */
  size: number;
  /** which of the four layers are on */
  layers: WordmarkLayers;
}
export const INITIAL: WordmarkConfig = { size: 21, layers: WORDMARK_ALL_LAYERS };
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = 560;

/** What a config looks like to the model's hand-built parts: the pill's wall, in the two enamels (nothing when the enamel is off). */
export function wordmarkLook(m: WordmarkConfig, colorway: Colorway) {
  const on = m.layers.fill;
  return { colorway, wall: { left: on ? '#7a100b' : 'transparent', right: on ? '#0e0e10' : 'transparent' } };
}
export function useWordmarkLook(m: WordmarkConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => wordmarkLook(m, colorway), [m, colorway]);
}

/** The mark as the table holds it, set to a config: the table's object, the model's face and the solid view are this. */
export function WordmarkObject({ m, style, ...props }: { m: WordmarkConfig } & Omit<React.ComponentProps<typeof Button>, 'cap' | 'children'>) {
  return (
    <Button cap="link" aria-label="MetalUI: open the x-ray" aria-haspopup="dialog" {...props} style={{ borderRadius: '999px', cursor: 'zoom-in', ...style }}>
      <Wordmark size={m.size} layers={m.layers} />
    </Button>
  );
}

/** The object's box and its pill's, in the object's own points, read off the real thing. */
interface Box { W: number; H: number; px: number; py: number; pw: number; ph: number; split: number }

export function WordmarkXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<WordmarkConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [m, setM] = React.useState<WordmarkConfig>(() => ({ ...INITIAL, ...seed }));
  const [well, zoom] = useSpecimenZoom();
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useWordmarkLook(m);

  // the object's boxes, measured on an unseen copy at its own zoom (so fractions of a point survive)
  const bench = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState<Box>({ W: 0, H: 0, px: 0, py: 0, pw: 0, ph: 0, split: 0 });
  React.useLayoutEffect(() => {
    const el = measure.current; if (!el) return;
    const read = () => {
      const object = el.firstElementChild as HTMLElement | null, pill = object?.querySelector<HTMLElement>('[data-wordmark]'), half = pill?.firstElementChild as HTMLElement | null;
      if (!object || !pill || !half) return;
      const o = object.getBoundingClientRect(), p = pill.getBoundingClientRect(), h = half.getBoundingClientRect();
      setBox({ W: o.width / oz, H: o.height / oz, px: (p.left - o.left) / oz, py: (p.top - o.top) / oz, pw: p.width / oz, ph: p.height / oz, split: h.width / oz });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [m.size, oz]);

  const W = box.W * S, H = box.H * S;
  const flat = pose === 'flat';
  const top = WALL + SLICES * 1.4;
  const fit = useFit(bench, W, H, xray);
  const t = tones(look.colorway);
  const face = (z: number) => planeStyle(z, S, oz);
  const px = box.px * S, py = box.py * S, pw = box.pw * S, ph = box.ph * S, split = (box.split / box.pw) * 100 || 0;
  const wall = `linear-gradient(90deg, ${look.wall.left} ${split}%, ${look.wall.right} ${split}%)`;

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? 'layers' : undefined}>
      <span ref={measure} aria-hidden inert className="xr-measure" style={{ zoom: oz }}><WordmarkObject m={m} tabIndex={-1} /></span>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: S }}><WordmarkObject m={m} tabIndex={-1} /></div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />
              {m.layers.shadow && <div className="xr-shadow" style={{ left: px, top: py, width: pw, height: ph, borderRadius: ph / 2, filter: 'blur(8px)', opacity: flat ? 0 : 0.2, transform: 'translate(4px, 9px)' }} />}
              {/* the wall: the pill's outline stood on the floor, under the real mark */}
              <div className="xr-thumb">
                {Array.from({ length: SLICES }, (_, i) => (
                  <div key={i} className="xr-slice" style={{ left: px, top: py, width: pw, height: ph, borderRadius: ph / 2, opacity: flat ? 0 : 1, transform: `translateZ(${flat ? 0 : WALL + i * 1.4}px)`, background: i === 0 ? 'transparent' : wall }} />
                ))}
              </div>
              {/* the top: the table's object, raised */}
              <div className="xr-segface is-top" aria-hidden inert style={{ display: 'flex', ...face(flat ? 1 : top) }}><WordmarkObject m={m} tabIndex={-1} /></div>
              <i className="xr-anchor" data-spot="layers" style={{ transform: `translate3d(${px + pw * 0.75}px, ${py + ph * 0.5}px, ${top + 1}px)` }} />
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot="layers" setSpot={() => {}} deps={[m, box, fit, t]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM(INITIAL)}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised">
          <span className="eng xr-card-head"><Glyph id="layers" /> {SPOTS[0].title} · {SPOTS[0].word}</span>
          <p>Red and graphite enamel form the capsule. Chrome lettering and a top reflection give it shine; its rim and shadows give it weight. Switch layers off to see their effect.</p>
          <div ref={well} className="ed-specimen"><Wordmark size={m.size} layers={m.layers} style={{ zoom }} /></div>
          <div className="ed-layers">
            {WORDMARK_LAYERS.map(({ id, name, why }) => <Row key={id} className="ed-layer" data-off={m.layers[id] ? undefined : ''} title={why}>
              <Row.Text>{name}</Row.Text>
              <Row.Trail><Switch size="small" aria-label={name} checked={m.layers[id]} onCheckedChange={(on) => setM((old) => ({ ...old, layers: { ...old.layers, [id]: on } }))} /></Row.Trail>
            </Row>)}
          </div>
          <p>This is the site's own mark, not a library component, so there is no code to copy.</p>
        </div>
      )}
    </div></HintLayer>
  );
}
