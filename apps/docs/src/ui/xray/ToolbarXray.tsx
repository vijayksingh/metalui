import * as React from 'react';
import { tokens } from '../../lib/tokens';
import { Callouts, Exploded, Glyph, useFit, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { INITIAL, LAYERS, P, STRIP_SH, TOOLS, ToolbarObject, ToolbarSpecimenCard, useToolbarLook, type Spot, type ToolbarConfig } from './ToolbarSpecimens';
import { ToolbarCodePanel } from './ToolbarCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · TOOLBAR (a block: a strip, tool caps and a groove)
 *
 *   solid     the real graphite toolbar with four tools. Pick a tool, then open the x-ray.
 *   x-ray     a dark glass strip floating high over the gridded floor; round tool caps stand on it,
 *             the chosen one pressed down with a green light; a thin groove splits the groups.
 *             Three planes are the real toolbar itself, laid out at the object's own zoom and scaled
 *             by transform: the strip with its groove (the caps hidden), the raised caps (the strip
 *             turned off), and the pressed cap alone, lower. Under them: a wall of slices for the strip
 *             and one for each cap, and the three shadows the strip casts on the floor. Flown in, the
 *             top plane is the whole object on one plane; the others wait out of sight, then the model
 *             opens up once the flyer has gone.
 *   card      the real graphite toolbar, handled (ToolbarSpecimens):
 *             Strip      its right end sets the space around the tools
 *             Tools      drag the pressed tool onto another; the gap between two tools
 *             Groove     the space beside it; the groove on or off
 *             Shape      the corner arc; corners follow the caps
 *             Shadow     drag the strip up: how high it floats
 *             Layers     the strip's layers, each switchable
 *   code      under the card: the React, CSS and SwiftUI for exactly this config (ToolbarCode.tsx)
 * ───────────────────────────────────────────────────────── */

export { INITIAL, ToolbarObject, useToolbarLook, type ToolbarConfig } from './ToolbarSpecimens';

const OBJECT = tokens.springs.object as { duration: number };
const S = 2.2;
/** The strip's wall and each cap's, in slices. */
const STRIP_WALL = 5;
const TOOL_WALL = 3;
/** How high a cap stands on the strip, and how far the pressed one is down (the recipe presses it 1 pt). */
const RAISED = 2.4;
const DOWN = RAISED - P.tool.press * S;
const STRIP_WALL_TONE = '#161618';
const TOOL_WALL_TONE = '#141416';
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);
const capTop = (z: number, wall: number) => z + wall * 1.4;

const SPOTS: SpotDef<Spot>[] = [
  { id: 'surface', title: 'Strip', word: 'Dark glass' },
  { id: 'press', title: 'Tools', word: 'The one you are using' },
  { id: 'well', title: 'Groove', word: 'Splitting the groups' },
  { id: 'shape', title: 'Shape', word: 'Corners that match' },
  { id: 'shadow', title: 'Shadow', word: 'Floating high' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  surface: ['left', 0.2], press: ['left', 0.48], shape: ['left', 0.76],
  layers: ['right', 0.2], well: ['right', 0.48], shadow: ['right', 0.76],
};

/** The real toolbar's boxes in its own points, read off the model's top plane: the strip, each cap and the groove. */
type Rect = { x: number; y: number; w: number; h: number };
const NONE: Rect = { x: 0, y: 0, w: 0, h: 0 };
interface Box { strip: Rect; tools: Rect[]; sep: Rect }
const NO_BOX: Box = { strip: NONE, tools: [], sep: NONE };
/** Where a part sits inside the plane, in the plane's own (unzoomed) units. */
function within(el: HTMLElement, box: HTMLElement): Rect {
  let x = 0, y = 0, n: HTMLElement | null = el;
  while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export function ToolbarXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<ToolbarConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('press');
  const [m, setM] = React.useState<ToolbarConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<ToolbarConfig>) => setM((o) => ({ ...o, ...p })), []);
  const setActive = React.useCallback((active: string) => set({ active }), [set]);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useToolbarLook(m);
  const exploded = spot === 'layers';
  const bench = React.useRef<HTMLDivElement>(null);
  const top = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<Box>(NO_BOX);
  React.useLayoutEffect(() => {
    const el = top.current; if (!el) return;
    const read = () => {
      // a plane that has just been swapped out (the layers view keeps its own) reports nothing
      if (!el.isConnected) return;
      const strip = el.querySelector<HTMLElement>('.mu-toolbar'); if (!strip || !strip.offsetWidth) return;
      const sep = el.querySelector<HTMLElement>('.mu-toolbar-sep');
      setBox({ strip: within(strip, el), tools: [...el.querySelectorAll<HTMLElement>('.mu-tool')].map((t) => within(t, el)), sep: sep ? within(sep, el) : NONE });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [xray, exploded, m.pad, m.gap, m.sep, m.sepMargin, m.active, m.follow, m.radius]);

  // geometry in points, then scaled
  const W = box.strip.w * S, H = box.strip.h * S, R = look.radius * S;
  const flat = pose === 'flat';
  const stripZ = 2 + m.lift * 8;
  const stripTop = capTop(stripZ, STRIP_WALL);
  const toolsTop = stripTop + capTop(RAISED, TOOL_WALL);
  const downTop = stripTop + capTop(DOWN, TOOL_WALL);
  const fit = useFit(bench, W, H, xray);
  const rise = 'transform var(--spring-object-d) var(--spring-object)';

  const current = SPOTS.find((x) => x.id === spot)!;
  const control = (onActive?: (id: string) => void) => <ToolbarObject config={m} onActive={onActive} />;
  // the model's planes are the toolbar laid out at the object's own zoom, then scaled: the same boxes, to the pixel
  const face = (z: number) => ({ transform: `translateZ(${z}px) scale(${S / oz})`, zoom: oz });
  const first = box.tools[0] ?? NONE;

  const anchors: Record<Spot, [number, number, number]> = {
    surface: [W * 0.08, H * 0.85, stripTop],
    press: [(first.x + first.w / 2) * S, (first.y + 2) * S, toolsTop],
    well: m.sep ? [(box.sep.x + box.sep.w / 2) * S, H * 0.3, stripTop + 1] : [W * 0.72, H * 0.5, stripTop],
    shape: [R * 0.3, H - R * 0.3, stripTop],
    shadow: [W * 0.85, H + 30, 0],
    layers: exploded ? [W * 0.9, H * 0.3, 2 + (LAYERS.length - 1) * 14] : [W * 0.97, H * 0.5, stripTop],
  };

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" style={{ zoom: 1.8 }}>{control(setActive)}</div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {/* the three shadows on the floor: contact, near and far, the far ones spread by the height */}
              {!exploded && (
                <>
                  {m.on[7] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: R, filter: `blur(${14 + m.lift * 14}px)`, opacity: flat ? 0 : 0.3, transform: `translate(${m.lift * 10}px, ${m.lift * 22}px)` }} />}
                  {m.on[6] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: R, filter: `blur(${6 + m.lift * 6}px)`, opacity: flat ? 0 : 0.3, transform: `translate(${m.lift * 4}px, ${m.lift * 10}px)` }} />}
                  {m.on[5] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: R, filter: 'blur(2px)', opacity: flat ? 0 : 0.2 }} />}
                </>
              )}

              {/* the strip's wall, then the strip plane: the real toolbar with its caps hidden, so the dark glass and the groove */}
              {!exploded && (
                <>
                  <div className="xr-thumb">
                    {Array.from({ length: STRIP_WALL }, (_, i) => (
                      <div key={i} className="xr-slice" style={{ width: W, height: H, borderRadius: R, opacity: flat ? 0 : 1, transition: `${rise}, opacity .2s`, transform: `translateZ(${flat ? 0 : stripZ + i * 1.4}px)`, background: i === 0 || !m.on[0] ? 'transparent' : STRIP_WALL_TONE }} />
                    ))}
                  </div>
                  <div className="xr-segface is-tbstrip" aria-hidden inert style={{ ...face(flat ? 0.5 : stripTop), visibility: flat ? 'hidden' : undefined }}>{control()}</div>
                </>
              )}

              {/* each cap's wall on the strip: the pressed one shorter, so its cap sits down in the strip */}
              {!exploded && box.tools.map((t, i) => {
                const tool = TOOLS.filter(Boolean)[i]; if (!tool) return null;
                const down = m.active === tool.id, z = down ? DOWN : RAISED;
                return (
                  <div key={tool.id} className="xr-tool" data-tool={tool.id} data-down={down ? '' : undefined}>
                    <div className="xr-thumb" style={{ transform: `translate(${t.x * S}px, ${t.y * S}px)` }}>
                      {Array.from({ length: TOOL_WALL }, (_, j) => (
                        <div key={j} className="xr-slice" style={{ width: t.w * S, height: t.h * S, borderRadius: P.tool.radius * S, opacity: flat ? 0 : 1, transition: `${rise}, opacity .2s`, transform: `translateZ(${flat ? 0 : stripTop + z + j * 1.4}px)`, background: j === 0 ? 'transparent' : TOOL_WALL_TONE }} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* the pressed cap alone, lower than the others */}
              {!exploded && (
                <div className="xr-segface is-tbdown" aria-hidden inert style={{ ...face(flat ? 1 : downTop), visibility: flat ? 'hidden' : undefined }}>{control()}</div>
              )}

              {/* the top: the real toolbar. Flat, it is the whole object on one plane; open, its strip and groove are turned off
                  and its pressed cap hidden, so the raised caps stand on their walls. Click a cap to pick it. */}
              {!exploded && (
                <div ref={top} className={flat ? 'xr-segface is-top' : 'xr-segface is-top is-tbtools'} style={face(flat ? 1.05 : toolsTop)}>{control(setActive)}</div>
              )}

              {spot === 'shape' && !exploded && (
                <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${stripTop + 8}px)` }} aria-hidden>
                  <path d={`M0 ${H + 16}H${m.pad * S}M0 ${H + 10}V${H + 22}M${m.pad * S} ${H + 10}V${H + 22}`} />
                  <text x={(m.pad * S) / 2} y={H + 34} textAnchor="middle">{m.pad}</text>
                  <path d={`M${R} 0A${R} ${R} 0 0 0 0 ${R}`} className="is-arc" />
                  <text x={R + 6} y={-8}>r {Number(look.radius.toFixed(1))}</text>
                </svg>
              )}

              {exploded && (
                <>
                  <Exploded layers={LAYERS} on={m.on} fill={look.fill} shadows={STRIP_SH} w={W} h={H} r={R} z0={2} gap={14} focus={focus} scale={S} />
                  {/* the top plane stays, out of sight, so the layers keep their measure */}
                  <div ref={top} className="xr-segface is-top" aria-hidden inert style={{ ...face(0), visibility: 'hidden' }}>{control()}</div>
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
        <div className="xr-hint eng">{xray ? (spot === 'press' ? 'Click a cap to pick that tool' : 'Pick an icon to learn about that part') : 'Pick a tool, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, active: o.active }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <ToolbarSpecimenCard spot={spot} m={m} set={set} focus={setFocus} />
        </div>
      )}
      {xray && <ToolbarCodePanel config={m} />}
    </div></HintLayer>
  );
}
