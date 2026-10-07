import * as React from 'react';
import { LinkCard, Row, Switch, linkHueDegrees } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { BEZEL, SCREEN, type Look, type Model } from './LinkCardXray';
import { useColorway, type Colorway } from '../../app/colorway';
import { STEP_AT, CornerArc, Readout, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom, type Hint } from '../edit';
import './link-card-specimens.css';

/* ─────────────────────────────────────────────────────────
 * THE LINK CARD'S SPECIMENS · the x-ray card for each part
 *
 *   The card holds the real LinkCard to handle; the bench reads the same model.
 *     surface  the frame's right side sets the frame width
 *     light    the glow's source on the screen's top edge steps through sites; glare on/off
 *     type     drag the site's name or the path: sideways spacing, up or down size
 *     press    drag the LINK tag toward or away from its corner; click OPEN
 *     shape    the screen's corner sets its corners; the frame's corners may follow
 *     layers   a row with a switch per layer of the frame and the screen
 *   The link card has one size, no kinds and no states, so nothing else steps but the site.
 *   Tokens are read here from tokens.json, never from LinkCardXray at load (a circular import).
 * ───────────────────────────────────────────────────────── */

type Layer = { part: string; prop: string; value: string; colorway?: string };
type ByColorway = { bone: string; graphite: string };
const LC = tokens.recipes['link-card'] as { props: { self: { width: number }; screen: { height: number; tint: ByColorway; 'tint-saturation': string; 'tint-lightness': ByColorway }; host: { font: string; tracking: string; ink: ByColorway }; path: { font: string; tracking: string; ink: ByColorway }; chip: { inset: number } }; layers: Layer[] };
const GF = tokens.recipes['glass-face'] as { props: { self: { radius: number; pad: number }; screen: { radius: number } }; layers: Layer[] };
const pick = (r: { layers: Layer[] }, part: string, prop: string, cw: Colorway) => r.layers.filter((l) => l.part === part && l.prop === prop && (!l.colorway || l.colorway === cw)).map((l) => l.value);
/** The glass face's and the link card's layers and inks in one colorway. */
export function linkLook(cw: Colorway) {
  const screenBg = pick(LC, 'screen', 'background', cw)[0];
  return {
    bezelBg: pick(GF, 'self', 'background', cw)[0], bezelSh: pick(GF, 'self', 'shadow', cw),
    glareBg: pick(GF, 'glare', 'background', cw), glareSh: pick(GF, 'glare', 'shadow', cw),
    screenBg, noGlow: screenBg.match(/(#[0-9a-f]{6})\s+\d+%\)\s*$/i)?.[1] ?? 'transparent',
    hostInk: P.host.ink[cw], pathInk: P.path.ink[cw],
  };
}
const P = LC.props;
const W = P.self.width, SCREEN_H = P.screen.height;
const px = (font: string) => Number(font.match(/([\d.]+)px/)?.[1]);

/** The recipe's own values, the tokens each tunable catches on. */
export const LINK_TOKENS = {
  pad: GF.props.self.pad, frameR: GF.props.self.radius, screenR: GF.props.screen.radius, inset: P.chip.inset,
  hostSize: px(P.host.font), hostTrack: parseFloat(P.host.tracking), pathSize: px(P.path.font), pathTrack: parseFloat(P.path.tracking),
};
/** Sites to try: the first wears the recipe's own tint; the others are tinted from their names, as the reference does. */
export const HOSTS = ['lanterns.photo', 'github.com', 'maps.apple.com', 'figma.com'];
/** The site a link goes to, as the card names it: its host without www. */
export const hostOf = (href: string) => { try { return new URL(href).hostname.replace(/^www\./, ''); } catch { return href; } };
/** A link to a site's night-market page: what stepping through the sites writes into the card's href. */
export const hrefFor = (host: string) => `https://${host}/night-market`;
export const tintFor = (host: string, cw: Colorway) => host === HOSTS[0] ? P.screen.tint[cw] : `hsl(${linkHueDegrees(host)} ${P.screen['tint-saturation']} ${P.screen['tint-lightness'][cw]})`;
/** A font token with its size swapped, in the form the stylesheet writes it. */
export const fontAt = (font: string, size: number) => font.replace(/[\d.]+px/, `${size}px`).replace(/ (sans|mono)$/, ' var(--mu-$1)');
export const frameRadius = (m: Model) => m.follow ? m.screenR + m.pad : GF.props.self.radius;

function hueOfHex(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}
const hueFor = (host: string, cw: Colorway) => host === HOSTS[0] ? hueOfHex(P.screen.tint[cw]) : linkHueDegrees(host);

const half = (v: number) => Math.round(v * 2) / 2;
const thou = (v: number) => Math.round(v * 1000) / 1000;
const near = (v: number, at: number, reach: number) => Math.abs(v - at) <= reach ? at : v;
const token = (v: number, at: number) => v === at ? { at, name: 'recipe token' } : undefined;

type Spot = 'surface' | 'light' | 'type' | 'press' | 'shape' | 'layers';
type Props = { spot: Spot; m: Model; look: Look; set: (patch: Partial<Model>) => void; focus: (name: string | null) => void; opened: string | null; setOpened: (host: string) => void };

/** The real link card, set to the model through its recipe variables (the look the bench and the code read too). */
function Card({ m, look }: { m: Model; look: Look }) {
  return <LinkCard href={m.href} preview={m.preview} style={{ ...look.style, transition: 'none' } as React.CSSProperties} />;
}

/** The well: the card is 250 wide, so it is shown as large as the zoom allows but never wider than the well. */
function useCardZoom() {
  const [well, zoom] = useSpecimenZoom();
  const [room, setRoom] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = well.current; if (!el) return;
    const read = () => { const s = getComputedStyle(el); setRoom(el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) - 12); };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [well]);
  return [well, room > 0 ? Math.min(zoom, Math.floor((room / W) * 100) / 100) : zoom] as const;
}
function Well({ well, zoom, children }: { well: React.RefObject<HTMLDivElement | null>; zoom: number; children: React.ReactNode }) {
  return <div ref={well} className="ed-specimen ed-lc-well"><div style={{ zoom }}>{children}</div></div>;
}

/** Where a part of the real card sits, in the card's own units (its text, not its full-width line). */
type Box = { x: number; y: number; w: number; h: number };
function useBox(root: React.RefObject<HTMLDivElement | null>, selector: string, deps: unknown[]) {
  const [box, setBox] = React.useState<Box | null>(null);
  React.useLayoutEffect(() => {
    const el = root.current; if (!el) return;
    const read = () => {
      const part = el.querySelector<HTMLElement>(selector); if (!part) return;
      const r = el.getBoundingClientRect(), k = r.width / W || 1;
      const range = document.createRange(); range.selectNodeContents(part);
      const t = range.getBoundingClientRect(), p = part.getBoundingClientRect();
      const left = Math.max(t.left, p.left), right = Math.min(t.right, p.right);
      setBox({ x: (left - r.left) / k, y: (p.top - r.top) / k, w: (right - left) / k, h: p.height / k });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return box;
}

/** Bezel: the frame's right side is the handle; drag it in for a thicker frame. */
function Bezel({ m, set, look }: Props) {
  const [well, zoom] = useCardZoom();
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const el = React.useRef<HTMLSpanElement>(null);
  const change = (v: number, caught = true) => { const n = half(clamp(v, 2, 16)); set({ pad: caught ? near(n, LINK_TOKENS.pad, 0.6) : n }); };
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'sides', title: 'Frame width', value: live ? `${m.pad}pt` : undefined, how: 'drag in for a thicker frame, out for a thinner one' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Frame width', value: `${m.pad}pt`, keys: [{ k: '←→', say: 'thicker' }, { k: '⇧', say: '×4' }] }),
    start: () => m.pad, move: (p0, dx) => { setLive(true); change(p0 - dx); }, end: () => setLive(false),
    step: (d) => change(m.pad - d * 0.5), axis: 'x', over: setPeek, grab: () => blip(el.current),
  });
  useOnLand(live && m.pad === LINK_TOKENS.pad ? 'pad' : undefined, () => blip(el.current));
  const reach = Math.max(m.pad, 8);
  return (
    <>
      <p>The card is a small piece of dark glass: a frame with a screen set into it, like a little window that leads out of your page. Drag the frame's right side in to make it thicker.</p>
      <Well well={well} zoom={zoom}>
        <div className="ed-lc" data-hint-anchor data-lit={live || peek ? '' : undefined}>
          <Card m={m} look={look} />
          <div className="ed-lc-over">
            <span ref={el} className="ed-lc-frame" style={{ left: W - m.pad - (reach - m.pad) / 2, top: m.pad, width: reach, height: SCREEN_H }} role="slider" tabIndex={0} aria-label="Frame width" aria-valuenow={m.pad} aria-valuemin={2} aria-valuemax={16} {...handle}>
              <i style={{ left: (reach - m.pad) / 2, width: m.pad }} />
            </span>
          </div>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Frame width" value={`${m.pad}`} snap={token(m.pad, LINK_TOKENS.pad)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => change(m.pad + d * 0.5, false)} />
      </div>
    </>
  );
}

/** Screen: the glow's source is the handle; drag it sideways and it steps to the next site's colour. */
function Screen({ m, set, look }: Props) {
  const { colorway } = useColorway();
  const [well, zoom] = useCardZoom();
  const [held, setHeld] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const [lean, setLean] = React.useState<{ host: string; k: number } | null>(null);
  const el = React.useRef<HTMLSpanElement>(null);
  const host = hostOf(m.href);
  const index = Math.max(0, HOSTS.indexOf(host));
  const choose = (d: number) => { const next = HOSTS[clamp(index + Math.sign(d), 0, HOSTS.length - 1)]; if (next !== host) set({ href: hrefFor(next) }); };
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'steps', title: 'Site', value: held ? lean ? `→ ${lean.host}` : host : undefined, how: 'drag sideways to try another site' }),
    keyHint: (): Hint => ({ gesture: 'steps', title: 'Site', value: host, keys: [{ k: '←→', say: 'step' }] }),
    start: () => { setHeld(true); return { index, at: 0 }; },
    move: (s, dx) => {
      const delta = dx - s.at, d = Math.sign(delta), next = HOSTS[s.index + d];
      if (next && Math.abs(delta) >= STEP_AT) { set({ href: hrefFor(next) }); s.index += d; s.at = dx; setLean(null); }
      else setLean(next && Math.abs(delta) > 2 ? { host: next, k: Math.min(1, Math.abs(delta) / STEP_AT) } : null);
    },
    end: () => { setHeld(false); setLean(null); }, step: choose, axis: 'x', over: setPeek, grab: () => blip(el.current),
  });
  useOnLand(host, () => blip(el.current));
  const toggle = (v: boolean) => set({ glare: v });
  const x = m.pad + (W - m.pad * 2) * 0.85;
  return (
    <>
      <p>The screen glows from its top right corner, in a colour worked out from the site's name, so the same site always looks the same. Drag the glow sideways to try another site.</p>
      <Well well={well} zoom={zoom}>
        <div className="ed-lc" data-hint-anchor data-lit={held || peek ? '' : undefined}>
          <Card m={m} look={look} />
          <div className="ed-lc-over">
            <span ref={el} className="ed-lc-glow" style={{ left: x - 5, top: m.pad - 5, ['--lean' as string]: lean?.k ?? 0, ['--lean-tint' as string]: lean ? tintFor(lean.host, colorway) : 'transparent' }} data-lean={lean ? '' : undefined} role="slider" tabIndex={0} aria-label="Site" aria-valuetext={host} aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={HOSTS.length} {...handle} />
          </div>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Site" value={host} unit="" snap={{ at: index, name: host }} peek={setPeek} pick={() => summon(el.current)} scrub={choose} />
        <Readout label="Hue" value={`${hueFor(host, colorway)}`} unit="°" snap={host === HOSTS[0] ? { at: hueFor(host, colorway), name: 'recipe tint' } : undefined} />
      </div>
      <div className="ed-layers">
        <Row.Root variant="list" className="ed-layer" data-off={m.glare ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(!m.glare); }}>
          <Row.Text>Glare</Row.Text>
          <Row.Trail><Switch size="small" aria-label="Glare" checked={m.glare} onCheckedChange={toggle} /></Row.Trail>
        </Row.Root>
      </div>
    </>
  );
}

/** Type: the site's name and the path are the handles: sideways for spacing, up or down for size. */
function Type({ m, set, look }: Props) {
  const [well, zoom] = useCardZoom();
  const root = React.useRef<HTMLDivElement>(null);
  const deps = [m.hostSize, m.hostTrack, m.pathSize, m.pathTrack, m.pad, m.href, zoom];
  const hostBox = useBox(root, '.mu-linkcard-host', deps);
  const pathBox = useBox(root, '.mu-linkcard-path', deps);
  const els = React.useRef<Partial<Record<'host' | 'path', HTMLSpanElement | null>>>({});
  const [live, setLive] = React.useState<null | { part: 'host' | 'path'; axis: 'size' | 'track' }>(null);
  const [peek, setPeek] = React.useState<'host' | 'path' | null>(null);
  const [over, setOver] = React.useState<'host' | 'path' | null>(null);
  const size = (part: 'host' | 'path', v: number, caught = true) => {
    const [lo, hi, at] = part === 'host' ? [10, 22, LINK_TOKENS.hostSize] : [7, 13, LINK_TOKENS.pathSize];
    const n = half(clamp(v, lo, hi));
    set(part === 'host' ? { hostSize: caught ? near(n, at, 0.3) : n } : { pathSize: caught ? near(n, at, 0.3) : n });
  };
  const track = (part: 'host' | 'path', v: number, caught = true) => {
    const at = part === 'host' ? LINK_TOKENS.hostTrack : LINK_TOKENS.pathTrack;
    const n = thou(clamp(v, -0.06, 0.2));
    set(part === 'host' ? { hostTrack: caught ? near(n, at, 0.004) : n } : { pathTrack: caught ? near(n, at, 0.004) : n });
  };
  const words = { host: "Site's name", path: 'Path' } as const;
  const useTypeHandle = (part: 'host' | 'path') => {
    const s = part === 'host' ? m.hostSize : m.pathSize, t = part === 'host' ? m.hostTrack : m.pathTrack;
    return useHandle({
      zoom,
      hint: (): Hint => live?.part === part
        ? { gesture: 'type', title: live.axis === 'size' ? `${words[part]} size` : `${words[part]} spacing`, value: live.axis === 'size' ? `${s}pt` : `${t.toFixed(3)}em` }
        : { gesture: 'type', title: words[part], how: 'drag sideways for spacing, up or down for size' },
      keyHint: (): Hint => ({ gesture: 'type', title: words[part], value: `${s}pt · ${t.toFixed(3)}em`, keys: [{ k: '←→', say: 'spacing' }, { k: '↑↓', say: 'size' }] }),
      start: () => ({ axis: '' as '' | 'x' | 'y', s, t }),
      move: (st, dx, dy) => {
        if (!st.axis && Math.abs(dx) + Math.abs(dy) > 1.2) st.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        if (st.axis === 'x') { setLive({ part, axis: 'track' }); track(part, st.t + dx / 400); }
        if (st.axis === 'y') { setLive({ part, axis: 'size' }); size(part, st.s - dy / 3); }
      },
      end: () => setLive(null),
      step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? size(part, s + d * 0.5) : track(part, t + d * 0.005)), axis: 'both',
      over: (on) => setOver((o) => (on ? part : o === part ? null : o)),
    });
  };
  const hostHandle = useTypeHandle('host');
  const pathHandle = useTypeHandle('path');
  const landed = live?.part === 'host' ? (live.axis === 'size' ? m.hostSize === LINK_TOKENS.hostSize : m.hostTrack === LINK_TOKENS.hostTrack)
    : live?.part === 'path' ? (live.axis === 'size' ? m.pathSize === LINK_TOKENS.pathSize : m.pathTrack === LINK_TOKENS.pathTrack) : false;
  useOnLand(live && landed ? `${live.part}-${live.axis}` : undefined, () => blip(live ? els.current[live.part] : null));
  const lit = (part: 'host' | 'path') => over === part || live?.part === part || peek === part ? '' : undefined;
  const at = (b: Box | null) => (b ? { left: b.x - 1, top: b.y, width: b.w + 2, height: b.h } : { display: 'none' });
  return (
    <>
      <p>The site's name is big and bright, so you know where the link goes; the path under it is small and dim. Drag either one sideways to change the space between letters, or up and down to change its size.</p>
      <Well well={well} zoom={zoom}>
        <div ref={root} className="ed-lc" data-hint-anchor>
          <Card m={m} look={look} />
          <div className="ed-lc-over">
            <span ref={(e) => { els.current.host = e; }} className="ed-lc-type" data-show={lit('host')} style={at(hostBox)} role="slider" tabIndex={0} aria-label="Site's name size and spacing" aria-valuetext={`${m.hostSize} points, spacing ${m.hostTrack} em`} aria-valuenow={m.hostSize} aria-valuemin={10} aria-valuemax={22} {...hostHandle} />
            <span ref={(e) => { els.current.path = e; }} className="ed-lc-type" data-show={lit('path')} style={at(pathBox)} role="slider" tabIndex={0} aria-label="Path size and spacing" aria-valuetext={`${m.pathSize} points, spacing ${m.pathTrack} em`} aria-valuenow={m.pathSize} aria-valuemin={7} aria-valuemax={13} {...pathHandle} />
          </div>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Name size" value={`${m.hostSize}`} snap={token(m.hostSize, LINK_TOKENS.hostSize)} peek={(on) => setPeek(on ? 'host' : null)} pick={() => summon(els.current.host ?? null)} scrub={(d) => size('host', m.hostSize + d * 0.5, false)} />
        <Readout label="Name spacing" value={m.hostTrack.toFixed(3)} unit="em" snap={token(m.hostTrack, LINK_TOKENS.hostTrack)} peek={(on) => setPeek(on ? 'host' : null)} pick={() => summon(els.current.host ?? null)} scrub={(d) => track('host', m.hostTrack + d * 0.005, false)} />
        <Readout label="Path size" value={`${m.pathSize}`} snap={token(m.pathSize, LINK_TOKENS.pathSize)} peek={(on) => setPeek(on ? 'path' : null)} pick={() => summon(els.current.path ?? null)} scrub={(d) => size('path', m.pathSize + d * 0.5, false)} />
        <Readout label="Path spacing" value={m.pathTrack.toFixed(3)} unit="em" snap={token(m.pathTrack, LINK_TOKENS.pathTrack)} peek={(on) => setPeek(on ? 'path' : null)} pick={() => summon(els.current.path ?? null)} scrub={(d) => track('path', m.pathTrack + d * 0.005, false)} />
      </div>
    </>
  );
}

/** Open: only OPEN is a button; the LINK tag is the handle for how far both chips sit from their corners. */
function Open({ m, set, look, opened, setOpened }: Props) {
  const [well, zoom] = useCardZoom();
  const root = React.useRef<HTMLDivElement>(null);
  const tag = useBox(root, '.mu-linkcard-tag', [m.inset, m.pad, zoom]);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const el = React.useRef<HTMLSpanElement>(null);
  const change = (v: number, caught = true) => { const n = half(clamp(v, 0, 24)); set({ inset: caught ? near(n, LINK_TOKENS.inset, 0.6) : n }); };
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Space from the corner', value: live ? `${m.inset}pt` : undefined, how: 'drag the tag away from its corner, or back' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Space from the corner', value: `${m.inset}pt`, keys: [{ k: '←→', say: 'farther' }] }),
    start: () => m.inset, move: (i0, dx, dy) => { setLive(true); change(i0 + (dx + dy) / 2); }, end: () => setLive(false),
    step: (d) => change(m.inset + d * 0.5), axis: 'both', over: setPeek, grab: () => blip(el.current),
  });
  useOnLand(live && m.inset === LINK_TOKENS.inset ? 'inset' : undefined, () => blip(el.current));
  const lit = live || peek;
  return (
    <>
      <p>Clicking the card does nothing; only OPEN opens the link, in a new tab, so you can move or select the card without leaving your page. Drag the LINK tag toward or away from its corner to set how far both chips sit from the corners.</p>
      <Well well={well} zoom={zoom}>
        <div ref={root} className="ed-lc" data-hint-anchor data-lit={lit ? '' : undefined}
          onClickCapture={(e) => { if ((e.target as HTMLElement).closest('.mu-linkcard-open')) { e.preventDefault(); setOpened(hostOf(m.href)); } }}>
          <Card m={m} look={look} />
          <div className="ed-lc-over">
            {tag && lit && (
              <svg className="ed-lc-inset" width={W} height={SCREEN_H + m.pad * 2} aria-hidden>
                <path d={`M${m.pad} ${tag.y + tag.h / 2}H${tag.x}M${tag.x + tag.w / 2} ${m.pad}V${tag.y}`} />
              </svg>
            )}
            <span ref={el} className="ed-lc-chip" style={tag ? { left: tag.x - 1, top: tag.y - 1, width: tag.w + 2, height: tag.h + 2 } : { display: 'none' }} role="slider" tabIndex={0} aria-label="Space from the corner" aria-valuenow={m.inset} aria-valuemin={0} aria-valuemax={24} {...handle} />
          </div>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Space from the corner" value={`${m.inset}`} snap={token(m.inset, LINK_TOKENS.inset)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => change(m.inset + d * 0.5, false)} />
      </div>
      <p className="readout-t ed-lc-opened" aria-live="polite">{opened ? `would open ${opened} in a new tab` : 'click OPEN on the card'}</p>
    </>
  );
}

/** Shape: the screen's top-left corner is the handle; the frame's corners can follow it. */
function Shape({ m, set, look }: Props) {
  const [well, zoom] = useCardZoom();
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const el = React.useRef<HTMLSpanElement>(null);
  const arc = React.useRef<SVGPathElement | null>(null);
  const change = (v: number, caught = true) => { const n = half(clamp(v, 0, 30)); set({ screenR: caught ? near(n, LINK_TOKENS.screenR, 0.6) : n }); };
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Screen corners', value: live ? `${m.screenR}pt` : undefined, how: 'drag in to round, out to square' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Screen corners', value: `${m.screenR}pt`, keys: [{ k: '←→', say: 'rounder' }] }),
    start: () => m.screenR, move: (r0, dx, dy) => { setLive(true); change(r0 + (dx + dy) / 2); }, end: () => setLive(false),
    step: (d) => change(m.screenR + d * 0.5), axis: 'both', over: setPeek, grab: () => blip(arc.current),
  });
  useOnLand(live && m.screenR === LINK_TOKENS.screenR ? 'r' : undefined, () => blip(arc.current));
  const frameR = frameRadius(m);
  const follow = (v: boolean) => set({ follow: v });
  return (
    <>
      <p>The frame's corners are the screen's corners plus the frame's width, so the frame is equally thick all the way round. Drag the screen's top-left corner to round it.</p>
      <Well well={well} zoom={zoom}>
        <div className="ed-lc" data-hint-anchor>
          <Card m={m} look={look} />
          <div className="ed-lc-over">
            <div className="ed-lc-screenbox" style={{ left: m.pad, top: m.pad, width: W - m.pad * 2, height: SCREEN_H }}>
              <span ref={el} className="ed-corner" style={{ width: Math.max(m.screenR, 6) + 3, height: Math.max(m.screenR, 6) + 3 }} role="slider" tabIndex={0} aria-label="Screen corners" aria-valuenow={m.screenR} aria-valuemin={0} aria-valuemax={30} {...handle}>
                <CornerArc r={m.screenR} on={live || peek} arcRef={(e) => { arc.current = e; }} />
              </span>
            </div>
          </div>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Screen corners" value={`${m.screenR}`} snap={token(m.screenR, LINK_TOKENS.screenR)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => change(m.screenR + d * 0.5, false)} />
        <Readout label="Frame corners" value={`${frameR}`} snap={token(frameR, LINK_TOKENS.frameR)} />
      </div>
      <div className="ed-layers">
        <Row.Root variant="list" className="ed-layer" data-off={m.follow ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) follow(!m.follow); }}>
          <Row.Text>Frame corners follow the screen</Row.Text>
          <Row.Trail><Switch size="small" aria-label="Frame corners follow the screen" checked={m.follow} onCheckedChange={follow} /></Row.Trail>
        </Row.Root>
      </div>
    </>
  );
}

/** Layers: a row with a switch per layer; hovering one points at its slice on the bench. */
function Layers({ m, set, look, focus }: Props) {
  const [well, zoom] = useCardZoom();
  const groups = [
    { title: 'The frame', layers: BEZEL, on: m.bezel, toggle: (i: number, v: boolean) => set({ bezel: m.bezel.map((x, j) => (j === i ? v : x)) }) },
    { title: 'The screen', layers: SCREEN, on: m.screen, toggle: (i: number, v: boolean) => set({ screen: m.screen.map((x, j) => (j === i ? v : x)) }) },
  ];
  return (
    <>
      <p>The frame has seven layers and the screen has three. Turn one off to see what it adds.</p>
      <Well well={well} zoom={zoom}><Card m={m} look={look} /></Well>
      {groups.map((g) => (
        <div key={g.title} style={{ display: 'contents' }}>
          <b className="eng ed-lc-group">{g.title}</b>
          <div className="ed-layers">
            {g.layers.map((l, i) => (
              <Row.Root key={l.name} variant="list" className="ed-layer" data-off={g.on[i] ? undefined : ''}
                onPointerEnter={() => focus(l.name)} onPointerLeave={() => focus(null)}
                onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) g.toggle(i, !g.on[i]); }}>
                <Row.Text>{l.name}</Row.Text>
                <Row.Trail><Switch size="small" aria-label={l.name} checked={g.on[i]} onCheckedChange={(v) => g.toggle(i, v)} onFocus={() => focus(l.name)} onBlur={() => focus(null)} /></Row.Trail>
              </Row.Root>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function LinkCardSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'surface': return <Bezel {...props} />;
    case 'light': return <Screen {...props} />;
    case 'type': return <Type {...props} />;
    case 'press': return <Open {...props} />;
    case 'shape': return <Shape {...props} />;
    case 'layers': return <Layers {...props} />;
  }
}
