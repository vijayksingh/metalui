import * as React from 'react';
import { tokens } from '../../lib/tokens';
import { Callouts, Exploded, Glyph, capTop, tones, useFit, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { INITIAL, LAYERS, PaletteFor, PaletteSpecimenCard, usePaletteLook, type PaletteConfig, type Spot } from './PaletteSpecimens';
import { PaletteCodePanel } from './PaletteCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · COMMAND PALETTE (a block: a plate, a field, rows and a footer of keys)
 *
 *   solid     the palette as the library writes it (PaletteFor), set to the config; the real one opens
 *             modally from ⌘K, so this still stands for it everywhere: the table, the model, the card
 *   x-ray     a frosted plate floating high over a dimmed page. Three planes are the palette itself,
 *             laid out at the object's own zoom and scaled by transform: the plate alone (everything in
 *             it hidden), the body (the plate's paint turned off: the sunk field, the section names,
 *             the rows, the keys) and the chosen row alone, raised as the cap it is. Under them, a wall
 *             of slices and the shadow the plate casts. Flown in, all three start on one plane (the
 *             object that landed), then the plate lifts and the cap rises once the copy has gone.
 *   card      the same still, handled, not slid (PaletteSpecimens):
 *             Field   type in it; its top edge, corner and the line before the glass
 *             Rows    drag the chosen row to another (it snaps); its bottom edge and corner
 *             Labels  the line over a section name; the underline under a match
 *             Keys    the gap between keys, the line above them; pinning and status switches
 *             Plate   the line inside its right edge (padding) and its corner
 *             Layers  a switch per layer; hover lights the slice on the bench
 *   code      under the card: the React, CSS and SwiftUI for exactly this config (PaletteCode.tsx)
 * ───────────────────────────────────────────────────────── */

export { INITIAL, PALETTE_WIDTH, PaletteFor, usePaletteLook, type PaletteConfig } from './PaletteSpecimens';

const OBJECT = tokens.springs.object as { duration: number };
const S = 1.2;
/** The plate's wall, in slices, and how high it floats once the model opens. */
const WALL = 3;
const PLATE_Z = 30;
/** How far the chosen row's cap stands off the plate. */
const CAP_Z = 5;
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);

const SPOTS: SpotDef<Spot>[] = [
  { id: 'well', title: 'Field', word: 'Where you type' },
  { id: 'states', title: 'Rows', word: 'The chosen row' },
  { id: 'type', title: 'Labels', word: 'Sections and matches' },
  { id: 'press', title: 'Keys', word: 'Shown at the bottom' },
  { id: 'surface', title: 'Plate', word: 'Over a dimmed page' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  surface: ['left', 0.2], well: ['left', 0.48], type: ['left', 0.76],
  layers: ['right', 0.2], states: ['right', 0.48], press: ['right', 0.76],
};

/** The palette's boxes in its own points, read off the model's body plane: the plate, its field, the first section, the chosen row and the footer. */
type Rect = { x: number; y: number; w: number; h: number };
const NONE: Rect = { x: 0, y: 0, w: 0, h: 0 };
interface Box { plate: Rect; field: Rect; sec: Rect; cap: Rect; foot: Rect }
const NO_BOX: Box = { plate: NONE, field: NONE, sec: NONE, cap: NONE, foot: NONE };
/** Where a part sits inside the plane, in the plane's own (unzoomed) units. */
function within(el: HTMLElement | null, box: HTMLElement): Rect {
  if (!el) return NONE;
  let x = 0, y = 0, n: HTMLElement | null = el;
  while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export function PaletteXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<PaletteConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('well');
  const [m, setM] = React.useState<PaletteConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<PaletteConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = usePaletteLook(m);
  const flat = pose === 'flat';
  // the layers come apart only with the model open: landed or leaving, the palette is one thing
  const exploded = spot === 'layers' && !flat;

  // the palette's boxes, read off the body plane whenever it changes
  const bench = React.useRef<HTMLDivElement>(null);
  const body = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<Box>(NO_BOX);
  React.useLayoutEffect(() => {
    const el = body.current; if (!el) return;
    const read = () => {
      const plate = el.querySelector<HTMLElement>('.mu-palette');
      // a plane that has gone, or one not laid out yet, measures nothing
      if (!plate || !plate.offsetWidth) return;
      const q = (s: string) => el.querySelector<HTMLElement>(s);
      setBox({ plate: within(plate, el), field: within(q('.mu-palette-field'), el), sec: within(q('.mu-palette-sec'), el), cap: within(q('.mu-palette-row[data-highlighted]'), el), foot: within(q('.mu-palette-foot'), el) });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [xray, exploded, m]);

  // geometry in points, then scaled
  const W = box.plate.w * S, H = box.plate.h * S, R = m.radius * S;
  const plateZ = flat ? 0 : PLATE_Z;
  const plateTop = flat ? 0.5 : capTop(PLATE_Z, WALL);
  const bodyZ = plateTop + 0.5;
  const capZ = flat ? bodyZ + 0.05 : bodyZ + CAP_Z;
  const fit = useFit(bench, W, H, xray);
  const tone = tones(look.colorway);
  const rise = 'transform var(--spring-object-d) var(--spring-object)';
  const current = SPOTS.find((x) => x.id === spot)!;
  // the model's planes are the palette laid out at the object's own zoom, then scaled: the same boxes, to the pixel.
  // The zoom scales the plane's translate too, so its height is given in the plane's own units to stand where it says.
  const face = (z: number) => ({ transform: `translateZ(${z / oz}px) scale(${S / oz})`, zoom: oz });
  const still = <PaletteFor m={m} look={look} inert />;
  const pt = (r: Rect, fx: number, fy: number): [number, number] => [(r.x + r.w * fx) * S, (r.y + r.h * fy) * S];

  const anchors: Record<Spot, [number, number, number]> = {
    well: [...pt(box.field, 0.12, 0.5), bodyZ],
    states: [...pt(box.cap, 0.94, 0.5), capZ],
    type: [...pt(box.sec, 0.1, 0.6), bodyZ],
    press: [...pt(box.foot, 0.7, 0.55), bodyZ],
    surface: [W * 0.05, H * 0.92, plateTop],
    layers: exploded ? [W * 0.9, 20, 10 + (LAYERS.length - 1) * 14] : [W - 12, 12, plateTop],
  };

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit" style={{ zoom: 0.9 }}>{still}</div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {/* the dimmed page the plate floats over; it is not the object that landed, so it comes once the model opens */}
              {!flat && <div className="xr-pscrim" style={{ left: -30 * S, top: -20 * S, width: W + 60 * S, height: H + 40 * S, borderRadius: 18 * S, background: look.colorway === 'graphite' ? 'rgba(14,14,15,.25)' : 'rgba(243,243,241,.25)' }} />}

              {exploded ? (
                <>
                  <Exploded layers={LAYERS} on={m.on} fill={look.raw.fill} shadows={look.raw.shadows} w={W} h={H} r={R} z0={10} gap={14} focus={focus} scale={S} />
                  {/* the body plane stays, out of sight, so the layers keep their measure */}
                  <div ref={body} className="xr-segface is-pbody" aria-hidden inert style={{ ...face(0), visibility: 'hidden' }}>{still}</div>
                </>
              ) : (
                <>
                  {m.on[8] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: R, filter: 'blur(22px)', opacity: flat ? 0 : 0.2, transform: 'translate(12px, 26px)' }} />}

                  {/* the plate's wall: slices that rise from the floor once the model opens (landed, they lie under the planes) */}
                  <div className="xr-thumb">
                    {Array.from({ length: WALL }, (_, i) => (
                      <div key={i} className="xr-slice" style={{ width: W, height: H, borderRadius: R, transition: rise, transform: `translateZ(${flat ? 0 : plateZ + i * 1.4}px)`, background: i === 0 || !m.on[0] ? 'transparent' : tone.wall }} />
                    ))}
                  </div>

                  {/* the plate: the palette with everything in it hidden */}
                  <div className="xr-segface is-pplate" aria-hidden inert style={face(plateTop)}>{still}</div>

                  {/* the body: the palette with its plate's paint turned off; you can choose a row in it */}
                  <div ref={body} className="xr-segface is-pbody" style={face(bodyZ)}><PaletteFor m={m} look={look} inert onSelect={(sel) => set({ sel })} /></div>

                  {/* the chosen row: the palette with only its raised cap left, standing off the plate */}
                  <div className="xr-segface is-pcap" aria-hidden inert style={face(capZ)}>{still}</div>
                </>
              )}

              {SPOTS.map((s) => {
                const [x, y, z] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM(INITIAL)}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <PaletteSpecimenCard spot={spot} m={m} set={set} focus={setFocus} look={look} />
        </div>
      )}
      {xray && <PaletteCodePanel config={m} />}
    </div></HintLayer>
  );
}
