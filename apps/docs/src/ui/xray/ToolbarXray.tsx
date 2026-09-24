import * as React from 'react';
import { Toolbar, ToolButton, ToolbarSeparator } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, Proof, Switch, XrayFrame, capTop, scalePx, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · TOOLBAR (a block: a strip, tool caps and a separator)
 *
 *   solid     the dark toolbar with four tools
 *   x-ray     a dark glass strip floating high over the page; round tool caps stand on it,
 *             the chosen one pressed down with a green light; a thin groove splits the groups
 *   play      Strip      the dark glass and its deep shadow
 *             Tools      pick a tool: it stays down, the others come up
 *             Groove     the separator
 *             Shape      padding · gap · corners that follow each other
 *             Shadow     how high it floats
 *             Layers     the strip's layers
 * ───────────────────────────────────────────────────────── */

type RL = { part: string; prop: string; value: string; state?: string }[];
const R = tokens.recipes.toolbar as { props: { self: { pad: number; gap: number; radius: number }; tool: { size: number; radius: number; glyph: number; ink: string }; led: { size: number; inset: number }; sep: { width: number; height: number; margin: number } }; layers: RL };
const P = R.props;
const pick = (part: string, prop: string, state?: string) => R.layers.filter((l) => l.part === part && l.prop === prop && (l.state ?? '') === (state ?? '')).map((l) => l.value);
const STRIP_BG = pick('self', 'background')[0];
const STRIP_SH = pick('self', 'shadow');
const TOOL_BG = pick('tool', 'background')[0], TOOL_SH = pick('tool', 'shadow');
const DOWN_BG = pick('tool', 'background', 'pressed')[0], DOWN_SH = pick('tool', 'shadow', 'pressed');
const LED_BG = pick('led', 'background')[0], LED_SH = pick('led', 'shadow')[0];
const SEP_BG = pick('sep', 'background')[0], SEP_SH = pick('sep', 'shadow')[0];
const S = 2.2;
const TOOLS = [{ id: 'select', label: 'Select' }, { id: 'note', label: 'Note' }, { id: 'draw', label: 'Draw' }, null, { id: 'tidy', label: 'Tidy' }] as const;

type Spot = 'surface' | 'press' | 'well' | 'shape' | 'shadow' | 'layers';
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

const LAYERS: LayerDef[] = [
  { name: 'Dark glass', why: 'A dark, almost solid fill. The toolbar is dark in both light and dark mode, so it always looks like the same object.' },
  { name: 'Inner glow', why: 'A faint light just inside the edge, like light caught in thick glass.' },
  { name: 'Top light', why: 'A soft bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A soft dark edge along the bottom right, where the glass turns away from the light.' },
  { name: 'Rim', why: 'A thin dark outline.' },
  { name: 'Contact', why: 'A small shadow right under the strip.' },
  { name: 'Near shadow', why: 'A soft shadow, a bit bigger.' },
  { name: 'Far shadow', why: 'A very big, very soft shadow. Together the three shadows say the toolbar floats higher than anything else on the page.' },
];

interface Model { active: string; pad: number; gap: number; follow: boolean; radius: number; lift: number; sep: boolean; on: boolean[] }
const INITIAL: Model = { active: 'select', pad: P.self.pad, gap: P.self.gap, follow: true, radius: P.self.radius, lift: 1, sep: true, on: LAYERS.map(() => true) };

export function ToolbarXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('press');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);

  const T = P.tool.size, sepW = P.sep.width + P.sep.margin * 2;
  const items = TOOLS.map((t) => (t ? T : m.sep ? sepW : 0));
  const Wp = m.pad * 2 + items.reduce((a, b) => a + b, 0) + m.gap * (items.filter(Boolean).length - 1);
  const Hp = T + m.pad * 2;
  const W = Wp * S, H = Hp * S;
  const radius = m.follow ? P.tool.radius + m.pad + 2 : m.radius;
  const lift = 2 + m.lift * 8;
  const stripTop = capTop(lift, 5);
  const exploded = spot === 'layers';
  const stripShadow = scalePx(STRIP_SH.slice(0, 4).filter((_, i) => m.on[i + 1]).join(', ') || 'none', S);

  let cx = m.pad;
  const placed = TOOLS.map((t, i) => { const x = cx; if (items[i]) cx += items[i] + m.gap; return { t, x }; });

  const scene = exploded ? (
    <Exploded layers={LAYERS} on={m.on} fill={STRIP_BG} shadows={STRIP_SH} w={W} h={H} r={radius * S} z0={2} gap={14} focus={focus} scale={S} />
  ) : (
    <>
      {m.on[7] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: radius * S, filter: `blur(${14 + m.lift * 14}px)`, opacity: 0.3, transform: `translate(${m.lift * 10}px, ${m.lift * 22}px)` }} />}
      {m.on[6] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: radius * S, filter: `blur(${6 + m.lift * 6}px)`, opacity: 0.3, transform: `translate(${m.lift * 4}px, ${m.lift * 10}px)` }} />}
      {m.on[5] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: radius * S, filter: 'blur(2px)', opacity: 0.2 }} />}
      <IsoCap w={W} h={H} r={radius * S} z={lift} wall={5} fill={m.on[0] ? STRIP_BG : 'transparent'} shadow={stripShadow} wallTone="#161618" />
      <div className="xr-thumb" style={{ transform: `translateZ(${stripTop}px)` }}>
        {placed.map(({ t, x }, i) => {
          if (!t) return m.sep ? <i key={i} className="xr-face is-flat" style={{ left: (x + P.sep.margin) * S, top: (Hp - P.sep.height) / 2 * S, width: P.sep.width * S, height: P.sep.height * S, background: SEP_BG, boxShadow: scalePx(SEP_SH, S), transform: 'translateZ(0.5px)' }} /> : null;
          const down = m.active === t.id;
          return (
            <div key={t.id} className="xr-tool" onClick={() => set({ active: t.id })}>
              <IsoCap x={x * S} y={m.pad * S} w={T * S} h={T * S} r={P.tool.radius * S} z={down ? 0.2 : 2.4} wall={3}
                fill={(down ? DOWN_BG : TOOL_BG)} shadow={scalePx((down ? DOWN_SH : TOOL_SH).join(', '), S)} wallTone="#141416"
                transition="transform 50ms linear, box-shadow 90ms ease-out">
                <span style={{ color: P.tool.ink, display: 'grid' }}><Icon name={t.id} size={P.tool.glyph * S} /></span>
                {down && <span className="xr-led" style={{ top: P.led.inset * S, right: P.led.inset * S, width: P.led.size * S, height: P.led.size * S, background: LED_BG, boxShadow: scalePx(LED_SH, S) }} />}
              </IsoCap>
            </div>
          );
        })}
      </div>
      {spot === 'shape' && (
        <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${stripTop + 8}px)` }} aria-hidden>
          <path d={`M0 ${H + 16}H${m.pad * S}M0 ${H + 10}V${H + 22}M${m.pad * S} ${H + 10}V${H + 22}`} />
          <text x={(m.pad * S) / 2} y={H + 34} textAnchor="middle">{m.pad}</text>
          <path d={`M${radius * S} 0A${radius * S} ${radius * S} 0 0 0 0 ${radius * S}`} className="is-arc" />
          <text x={radius * S + 6} y={-8}>r {Number(radius.toFixed(1))}</text>
        </svg>
      )}
    </>
  );

  const first = placed[0].x * S, sepX = (placed[3].x + P.sep.margin) * S;
  const anchors: Record<Spot, [number, number, number]> = {
    surface: [W * 0.08, H * 0.85, stripTop],
    press: [first + T * S * 0.5, m.pad * S + 4, stripTop + 6],
    well: [sepX, H * 0.3, stripTop + 1],
    shape: [radius * S * 0.3, H - radius * S * 0.3, stripTop],
    shadow: [W * 0.85, H + 30, 0],
    layers: exploded ? [W * 0.9, H * 0.3, 2 + (LAYERS.length - 1) * 14] : [W * 0.97, H * 0.5, stripTop],
  };

  const real = (
    <Toolbar variant="graphite" aria-label="Tools">
      {TOOLS.map((t, i) => t
        ? <ToolButton key={t.id} label={t.label} icon={<Icon name={t.id} size={16} />} pressed={m.active === t.id} onPressedChange={(p) => p && set({ active: t.id })} />
        : m.sep ? <ToolbarSeparator key={i} /> : null)}
    </Toolbar>
  );

  const card = (
    <>
      {spot === 'surface' && (
        <>
          <p>The toolbar is a strip of dark glass. It stays dark in light mode and in dark mode, so you always find it by its shape and colour. It floats over the page, so it never looks like part of your work.</p>
        </>
      )}
      {spot === 'press' && (
        <>
          <p>Each tool is a small dark cap, the same icon button you saw on its own. The tool you are using stays down with a green light. Pick another one and the first pops back up. Click a cap on the model.</p>
        </>
      )}
      {spot === 'well' && (
        <>
          <p>A thin line cut into the strip splits the tools into groups: tools that make things on the left, tools that tidy on the right. It is a groove, so it is dark with a faint bright edge.</p>
          <div className="xr-dials"><Switch label="Groove" on={m.sep} onChange={(sep) => set({ sep })} /></div>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>The strip's corners are round enough to wrap its caps with the same gap all round. The rule: outer corner = inner corner + the space between them. Break it and the corners look pinched.</p>
          <div className="xr-dials">
            <Dial label="Space around the tools" value={m.pad} min={2} max={16} step={1} fmt={(v) => `${v} pt`} onChange={(pad) => set({ pad })} />
            <Dial label="Space between tools" value={m.gap} min={0} max={16} step={1} fmt={(v) => `${v} pt`} onChange={(gap) => set({ gap })} />
            <Switch label="Outer corners follow the caps" on={m.follow} onChange={(follow) => set({ follow })} />
            {!m.follow && <Dial label="Outer corners" value={m.radius} min={0} max={Hp / 2} step={1} fmt={(v) => `${v} pt`} onChange={(radius) => set({ radius })} />}
          </div>
        </>
      )}
      {spot === 'shadow' && (
        <>
          <p>The toolbar has three shadows, more than anything else. A small one where it would touch, a bigger one, and a very big soft one. Together they say it floats high above the page.</p>
          <div className="xr-dials"><Dial label="Height above the page" value={m.lift} min={0} max={3} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(lift) => set({ lift })} /></div>
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>The strip has eight layers. The caps on it have their own; open the icon button to see those. Turn a layer off to see what it adds.</p>
          <LayerList groups={[{ layers: LAYERS, on: m.on, toggle: (i, v) => set({ on: m.on.map((x, j) => (j === i ? v : x)) }) }]} focus={focus} setFocus={setFocus} />
        </>
      )}
      <Proof>{real}</Proof>
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 1.8 }} onClick={(e) => e.stopPropagation()}>{real}</div>}
      W={W} H={H} scene={scene} anchors={anchors}
      hint={spot === 'press' ? 'Click a cap to pick that tool' : undefined}
      onReset={() => setM(INITIAL)} deps={[spot, m]}
      card={card}
    />
  );
}
