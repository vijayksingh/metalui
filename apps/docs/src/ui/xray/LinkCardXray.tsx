import * as React from 'react';
import { LinkCard, linkHueDegrees } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, Proof, Switch, XrayFrame, capTop, scalePx, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · LINK CARD (a block: a glass face, a tinted screen, two chips and two lines of type)
 *
 *   solid     a link card
 *   x-ray     a dark glass bezel standing on the page, a screen set into it, the screen's glow
 *             tinted by the website's name, the LINK tag and the OPEN chip on the glass
 *   play      Bezel   the dark glass frame
 *             Screen  the colour comes from the site's name; the glare
 *             Type    the site big, the path small
 *             Open    only OPEN can be clicked
 *             Shape   corners that follow each other
 *             Layers  bezel and screen layers
 * ───────────────────────────────────────────────────────── */

type RL = { part: string; prop: string; value: string }[];
const LC = tokens.recipes['link-card'] as { props: { self: { width: number }; screen: { height: number; 'pad-y': number; 'pad-x': number; tint: string; 'tint-saturation': string; 'tint-lightness': string }; host: { ink: string }; path: { ink: string }; chip: { inset: number } }; layers: RL };
const GF = tokens.recipes['glass-face'] as { props: { self: { radius: number; pad: number }; screen: { radius: number } }; layers: RL };
const pick = (r: { layers: RL }, part: string, prop: string) => r.layers.filter((l) => l.part === part && l.prop === prop).map((l) => l.value);
const BEZEL_BG = pick(GF, 'self', 'background')[0], BEZEL_SH = pick(GF, 'self', 'shadow');
const GLARE_BG = pick(GF, 'glare', 'background'), GLARE_SH = pick(GF, 'glare', 'shadow');
const SCREEN_BG = pick(LC, 'screen', 'background')[0];
const P = LC.props;
const S = 2;

type Spot = 'surface' | 'light' | 'type' | 'press' | 'shape' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'surface', title: 'Bezel', word: 'The glass frame' },
  { id: 'light', title: 'Screen', word: 'A colour for each site' },
  { id: 'type', title: 'Type', word: 'Site and path' },
  { id: 'press', title: 'Open', word: 'The only button' },
  { id: 'shape', title: 'Shape', word: 'Corners that match' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  layers: ['left', 0.2], type: ['left', 0.48], surface: ['left', 0.76],
  light: ['right', 0.2], press: ['right', 0.48], shape: ['right', 0.76],
};

const BEZEL: LayerDef[] = [
  { name: 'Dark glass', why: 'A near-black frame, a little lighter at the top. A link is something that leads out of your page, so it looks like a small screen, not like paper.' },
  { name: 'Top edge', why: 'A thin bright line along the top edge of the glass.' },
  { name: 'Inner glow', why: 'A faint light just inside the edge.' },
  { name: 'Rim', why: 'A thin dark outline.' },
  { name: 'Contact', why: 'A small shadow right under the card.' },
  { name: 'Near shadow', why: 'A soft shadow, a bit bigger.' },
  { name: 'Far shadow', why: 'A big, soft shadow. The card stands up off the page like an object.' },
];
const SCREEN: LayerDef[] = [
  { name: 'Tinted glow', why: 'A coloured glow from the top right corner, fading to black. The colour comes from the site\'s name, so the same site always gets the same colour.' },
  { name: 'Glare', why: 'A pale diagonal stripe with a sharp edge, like light caught on a phone screen. It says "this is glass".' },
  { name: 'Shade', why: 'The bottom of the screen gets a little darker, so the white text there stays easy to read.' },
];

interface Model { host: string; glare: boolean; pad: number; follow: boolean; screenR: number; bezel: boolean[]; screen: boolean[] }
const INITIAL: Model = { host: 'lanterns.photo', glare: true, pad: GF.props.self.pad, follow: true, screenR: GF.props.screen.radius, bezel: BEZEL.map(() => true), screen: SCREEN.map(() => true) };
const HOSTS = ['lanterns.photo', 'github.com', 'maps.apple.com', 'figma.com'];

export function LinkCardXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('light');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [opened, setOpened] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);

  const hue = m.host === INITIAL.host ? P.screen.tint : `hsl(${linkHueDegrees(m.host)} ${P.screen['tint-saturation']} ${P.screen['tint-lightness']})`;
  const Wp = P.self.width, SHp = P.screen.height, Hp = SHp + m.pad * 2;
  const W = Wp * S, H = Hp * S;
  const bezelR = m.follow ? m.screenR + m.pad : GF.props.self.radius;
  const z = 3, top = capTop(z, 5);
  const exploded = spot === 'layers';
  const screenBg = [
    ...(m.screen[1] && m.glare ? [GLARE_BG[0]] : []),
    ...(m.screen[2] ? [GLARE_BG[1]] : []),
    m.screen[0] ? SCREEN_BG.replace('self', hue) : '#121316',
  ].join(', ');
  const bezelShadow = scalePx(BEZEL_SH.slice(0, 4).filter((_, i) => m.bezel[i + 1]).join(', ') || 'none', S);
  const sx = m.pad * S, sy = m.pad * S, sw = (Wp - m.pad * 2) * S, sh = SHp * S;
  const inset = P.chip.inset * S;

  const screen = (
    <div className="xr-face is-flat xr-linkscreen" style={{ left: sx, top: sy, width: sw, height: sh, borderRadius: m.screenR * S, transform: `translateZ(${top + 0.5}px)`, background: screenBg, boxShadow: scalePx(GLARE_SH.join(', '), S), padding: `${P.screen['pad-y'] * S}px ${P.screen['pad-x'] * S}px` }}>
      <span className="xr-linkchip" style={{ left: inset, top: inset, fontSize: 9 * S, gap: 5 * S, height: 18 * S, padding: `0 ${7 * S}px`, borderRadius: 7 * S }}><i style={{ width: 5 * S, height: 5 * S }} />LINK</span>
      <span className={spot === 'press' ? 'xr-linkchip is-action is-lit' : 'xr-linkchip is-action'} onClick={() => setOpened(m.host)} style={{ right: inset, top: inset, fontSize: 9 * S, height: 18 * S, padding: `0 ${7 * S}px`, borderRadius: 7 * S }}>OPEN ↗</span>
      <b style={{ font: `620 ${15 * S}px/1.2 var(--sans)`, letterSpacing: '-.015em', color: P.host.ink }}>{m.host}</b>
      <span style={{ font: `400 ${9.5 * S}px/1.4 var(--mono)`, letterSpacing: '.06em', color: P.path.ink }}>/NIGHT-MARKET</span>
    </div>
  );

  const scene = exploded ? (
    <>
      <Exploded layers={BEZEL} on={m.bezel} fill={BEZEL_BG} shadows={BEZEL_SH} w={W} h={H} r={bezelR * S} z0={3} gap={14} focus={focus} scale={S} />
      <Exploded layers={SCREEN} on={m.screen} fill={SCREEN_BG.replace('self', hue)} backgrounds={[SCREEN_BG.replace('self', hue), GLARE_BG[0], GLARE_BG[1]]} shadows={['none', 'none']} x={sx} y={sy} w={sw} h={sh} r={m.screenR * S} z0={3 + BEZEL.length * 14 + 10} gap={16} focus={focus} scale={S} />
    </>
  ) : (
    <>
      {m.bezel[6] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: bezelR * S, filter: 'blur(18px)', opacity: 0.28, transform: 'translate(10px, 22px)' }} />}
      {m.bezel[4] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: bezelR * S, filter: 'blur(2px)', opacity: 0.25 }} />}
      <IsoCap w={W} h={H} r={bezelR * S} z={z} wall={5} fill={m.bezel[0] ? BEZEL_BG : 'transparent'} shadow={bezelShadow} wallTone="#121214" />
      {screen}
    </>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    surface: [W * 0.04, H * 0.8, top],
    light: [sx + sw * 0.85, sy + 8, top + 1],
    type: [sx + P.screen['pad-x'] * S + 40, sy + sh - 30, top + 1],
    press: [sx + sw - inset - 30, sy + inset + 18, top + 1],
    shape: [W - bezelR * S * 0.3, H - bezelR * S * 0.3, top],
    layers: exploded ? [W * 0.2, H * 0.2, 3 + (BEZEL.length - 1) * 14] : [W * 0.06, H * 0.2, top],
  };

  const card = (
    <>
      {spot === 'surface' && (
        <p>The card is a small piece of dark glass: a frame with a screen set into it. A link leads out of your page to somewhere else, so it looks like a little window, not like a note.</p>
      )}
      {spot === 'light' && (
        <>
          <p>The screen glows from the top right corner. The colour is worked out from the site's name, so the same site always gets the same colour, and you start to recognise sites by colour. Try another site.</p>
          <div className="xr-actions-row">{HOSTS.map((h) => <button key={h} type="button" className="status" onClick={() => set({ host: h })}><span className={m.host === h ? 'led' : 'led off'} />{h}</button>)}</div>
          <div className="xr-dials"><Switch label="Glare" on={m.glare} onChange={(glare) => set({ glare })} /></div>
        </>
      )}
      {spot === 'type' && (
        <p>The site's name is big and bright, so you know where the link goes. The path is small, in spaced-out capitals, and dimmer. Both sit at the bottom of the screen, where the shade keeps them readable.</p>
      )}
      {spot === 'press' && (
        <>
          <p>Clicking the card does nothing. Only the OPEN chip opens the link, in a new tab. That way you can move, select or drag the card without leaving your page by accident. The LINK tag is only a label; its small blue light says what kind of thing this is.</p>
          <p className="readout-t">{opened ? `would open ${opened} in a new tab` : 'click OPEN on the model'}</p>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>The frame's corners are the screen's corners plus the frame's width, so the frame is the same thickness all the way round, even at the corners.</p>
          <div className="xr-dials">
            <Dial label="Frame width" value={m.pad} min={2} max={16} step={1} fmt={(v) => `${v} pt`} onChange={(pad) => set({ pad })} />
            <Dial label="Screen corners" value={m.screenR} min={0} max={30} step={1} fmt={(v) => `${v} pt`} onChange={(screenR) => set({ screenR })} />
            <Switch label="Frame corners follow the screen" on={m.follow} onChange={(follow) => set({ follow })} />
          </div>
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>Two parts: the frame has seven layers and the screen has three. Turn one off to see what it adds.</p>
          <LayerList focus={focus} setFocus={setFocus} groups={[
            { title: 'The frame', layers: BEZEL, on: m.bezel, toggle: (i, v) => set({ bezel: m.bezel.map((x, j) => (j === i ? v : x)) }) },
            { title: 'The screen', layers: SCREEN, on: m.screen, toggle: (i, v) => set({ screen: m.screen.map((x, j) => (j === i ? v : x)) }) },
          ]} />
        </>
      )}
      <Proof><LinkCard href={`https://${m.host}/night-market`} hue={m.host === INITIAL.host ? undefined : hue} /></Proof>
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 1.6 }}><LinkCard href="https://lanterns.photo/night-market" /></div>}
      W={W} H={H} scene={scene} anchors={anchors}
      hint={spot === 'press' ? 'Click OPEN on the model' : undefined}
      onReset={() => { setM(INITIAL); setOpened(null); }} deps={[spot, m]}
      card={card}
    />
  );
}
