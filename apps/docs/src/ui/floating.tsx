import * as React from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router';
import { Button, Checkbox, Field, Kbd, LinkCard, Mark, Switcher, Slider, StatusBadge, SuggestionChip, Swatch, Toolbar, ToolButton, ToolbarSeparator, WeatherTile } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { BUTTON_LABEL, type XrayKind, type XrayPose, type XrayReseed, type XraySeed, type XraySeeds } from './xray';
import { INITIAL as SWITCHER, OPTIONS as SWITCHER_OPTIONS, useSwitcherLook, type SwitcherConfig } from './xray/SwitcherXray';
import { ToastStill } from './xray/ToastXray';
import { MenuStill } from './xray/MenuXray';
import { DialogStill } from './xray/DialogXray';
import { PaletteStill } from './xray/PaletteXray';
import { FolderStill } from './xray/FolderXray';
import { Wordmark } from './Wordmark';

export type { XrayKind };

/* ─────────────────────────────────────────────────────────
 * THE FLOATING TABLE
 *
 *   space   the landing: full screen, objects hang at different depths in one
 *           perspective, drift slowly, and the camera leans toward the pointer
 *   table   the overview: the same objects laid flat in the docs' stage
 *
 *   Each object carries its own view-transition name, so "Browse Components" flies every
 *   one of them from where it hangs in space to its place on the table.
 * ───────────────────────────────────────────────────────── */

function Line({ children, task }: { children: React.ReactNode; task?: 'open' | 'done' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, font: '500 15px/22px var(--sans)', letterSpacing: '-.015em' }}>
      {task && <Checkbox defaultChecked={task === 'done'} aria-label="Task" />}
      <span style={task === 'done' ? { color: 'var(--ink3)', textDecoration: 'line-through' } : undefined}>{children}</span>
    </div>
  );
}

function FloatSlider() {
  const [v, setV] = React.useState(62);
  return (
    <div style={{ width: 200, height: 40 }}>
      <Slider.Root value={v} min={0} max={100} step={1} onValueChange={setV}>
        <Slider.Track />
        <Slider.Marks at={[0.2, 0.45, 0.8]} />
        <Slider.Knob aria-label="Amount" />
      </Slider.Root>
    </div>
  );
}

/** The switcher on the table: the real control set to its config, which its x-ray takes over and hands back. */
function TableSwitcher({ config = SWITCHER, onConfig, open }: { config?: SwitcherConfig; onConfig: (c: SwitcherConfig) => void; open: () => void }) {
  const { style } = useSwitcherLook(config);
  return (
    <div onClick={open}>
      <span className="xr-seg-vars" style={style}><Switcher aria-label="View" size={config.size} value={config.value} onValueChange={(value) => onConfig({ ...config, value })} options={SWITCHER_OPTIONS} /></span>
    </div>
  );
}

/** The space's perspective and its origin (kds.css .space: 1600px at 50% 40%). */
const PERSPECTIVE = 1600;

interface Ctx {
  openXray: (which: XrayKind) => void;
  chip: boolean; setChip: (v: boolean) => void;
  /** Each object's config, shared with its x-ray (see xray/index.tsx, "the handover"). */
  seeds: Partial<XraySeeds>; onSeed: XrayReseed;
}
interface Item {
  id: string;
  /** Position on the flat table (percent of the stage). */
  table: [string, string];
  /** Where its centre appears in space (percent of the viewport), depth in px (negative is farther), and turn. */
  space: [string, string, number, number];
  dur: string;
  drift: [string, string];
  live?: boolean;
  /** Drawn larger (or smaller) than life. The x-ray lays its face out at this zoom, so the object lands on itself. */
  zoom?: number;
  node: (ctx: Ctx) => React.ReactNode;
}

const ITEMS: Item[] = [
  {
    id: 'lines', table: ['4%', '3.7%'], space: ['11%', '14%', -260, 14], dur: '26s', drift: ['30px', '18px'], live: true,
    // a checkbox opens its x-ray
    node: ({ openXray }) => (
      <div className="hero-frags" style={{ gap: 12, maxWidth: 270 }} onClick={(e) => { if ((e.target as HTMLElement).closest('.mu-dimple')) openXray('checkbox'); }}>
        <Line task="open">call printer about paper stock <Mark kind="date" resolved="Fri 25 Sep · 16:00">tomorrow 4pm</Mark></Line>
        <Line task="done">pick the grotesk <Mark kind="tag">#type</Mark></Line>
        <Line><Mark kind="measurement">slept 6h</Mark> · <Mark kind="measurement">mood 3</Mark></Line>
      </div>
    ),
  },
  { id: 'link', table: ['66.5%', '4.1%'], space: ['50%', '14%', -420, -12], dur: '30s', drift: ['-30px', '26px'], live: true, node: ({ openXray }) => <div onClickCapture={(e) => { e.preventDefault(); openXray('link'); }}><LinkCard href="https://lanterns.photo/night-market" /></div> },
  { id: 'swatch', table: ['87%', '21.6%'], space: ['70%', '33%', -140, -18], dur: '24s', drift: ['-18px', '30px'], live: true, node: ({ openXray }) => <Swatch hex="#FF6B3D" label="Colour" onClick={() => openXray('swatch')} /> },
  {
    // the brand, front and centre among the things it makes; hung back in the scene like its neighbours.
    id: 'wordmark', table: ['48.8%', '22.9%'], space: ['50%', '53%', -180, -10], dur: '21s', drift: ['38px', '-22px'], live: true,
    node: ({ openXray }) => <Button cap="link" aria-label="MetalUI: open the x-ray" aria-haspopup="dialog" style={{ borderRadius: '999px', cursor: 'zoom-in' }} onClick={() => openXray('wordmark')}><Wordmark size={21} /></Button>,
  },
  {
    // the button, beside the brand: click it and it flies onto its x-ray, the reference one
    id: 'button', table: ['44%', '32%'], space: ['60%', '42%', -160, -8], dur: '22s', drift: ['30px', '-18px'], live: true, zoom: 1.4,
    node: ({ openXray }) => <Button cap="primary" onClick={() => openXray('button')}>{BUTTON_LABEL}</Button>,
  },
  {
    id: 'chip', table: ['4%', '72%'], space: ['11%', '55%', -60, 10], dur: '28s', drift: ['22px', '-22px'], live: true,
    // the words open the x-ray; ✓ and × still answer
    node: ({ chip, setChip, openXray }) => chip ? <span onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) openXray('chip'); }}><SuggestionChip label="Track as mood?" confidence={0.8} onAccept={() => setChip(false)} onDismiss={() => setChip(false)} /></span> : null,
  },
  {
    id: 'seg', table: ['58.4%', '57.6%'], space: ['70%', '51%', -200, -14], dur: '23s', drift: ['-26px', '-20px'], live: true, zoom: 1.3,
    // a click picks the option and opens the x-ray, like the button; the pick lands before the x-ray opens
    node: ({ openXray, seeds, onSeed }) => <TableSwitcher config={seeds.switcher} onConfig={(c) => onSeed('switcher', c)} open={() => openXray('switcher')} />,
  },
  { id: 'key', table: ['92.3%', '58.2%'], space: ['88%', '54%', 40, -20], dur: '19s', drift: ['-14px', '-26px'], live: true, zoom: 1.4, node: ({ openXray }) => <div onClick={() => openXray('kbd')}><Kbd>⌘K</Kbd></div> },
  { id: 'slider', table: ['4%', '57.9%'], space: ['31%', '32%', -340, 8], dur: '27s', drift: ['24px', '16px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('slider')}><FloatSlider /></div> },
  {
    id: 'field', table: ['35.1%', '88.2%'], space: ['31%', '72%', -180, -10], dur: '29s', drift: ['-20px', '12px'], live: true,
    node: ({ openXray }) => (
      <div style={{ width: 230 }} onClick={() => openXray('field')}>
        <Field style={{ width: '100%' }}>
          <Field.Icon><Icon name="search" size={15} /></Field.Icon>
          <Field.Input placeholder="Lens or action" aria-label="Lens or action" readOnly />
          <Field.Trail><Kbd>⌘K</Kbd></Field.Trail>
        </Field>
      </div>
    ),
  },
  { id: 'status', table: ['45.6%', '7.9%'], space: ['31%', '11%', -220, -6], dur: '25s', drift: ['18px', '14px'], live: true, node: ({ openXray }) => <span onClick={() => openXray('status')}><StatusBadge led="live">Sync live</StatusBadge></span> },
  {
    // a still of the tooltip, drawn with its own recipe classes (the real one lives in a portal)
    id: 'tooltip', table: ['38%', '58.5%'], space: ['70%', '13%', -60, 8], dur: '32s', drift: ['40px', '-10px'], live: true,
    node: ({ openXray }) => (
      <span onClick={() => openXray('tooltip')} className="mu-tooltip inline-block py-tooltip-pad-y px-tooltip-pad-x rounded-tooltip-radius type-tooltip text-tooltip-ink recipe-tooltip whitespace-nowrap">
        Select<span className="mu-tooltip-key text-tooltip-key-ink"> · V</span>
      </span>
    ),
  },
  { id: 'toast', table: ['29.6%', '43%'], space: ['50%', '32%', -300, -8], dur: '31s', drift: ['16px', '-8px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('toast')}><ToastStill /></div> },
  { id: 'menu', table: ['4%', '18.6%'], space: ['89%', '15%', -380, -16], dur: '34s', drift: ['12px', '20px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('menu')}><MenuStill /></div> },
  { id: 'dialog', table: ['71.2%', '84.4%'], space: ['89%', '71%', -480, 12], dur: '36s', drift: ['-14px', '18px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('dialog')}><DialogStill /></div> },
  { id: 'palette', table: ['71.2%', '39.2%'], space: ['69%', '71%', -520, -16], dur: '38s', drift: ['-10px', '-14px'], live: true, zoom: 0.7, node: ({ openXray }) => <div onClick={() => openXray('palette')}><PaletteStill /></div> },
  {
    // a widget with no x-ray yet: it opens its own page
    id: 'weather', table: ['4%', '36%'], space: ['10%', '35%', -260, 12], dur: '33s', drift: ['20px', '14px'],
    node: () => (
      <Link to="/components/weather" aria-label="Weather" style={{ display: 'block' }}>
        <WeatherTile sky="partly" hour={10.5} temp={21} name="Partly" meta="Rain 10%" aria-label="Partly cloudy, 21° at 10:30" />
      </Link>
    ),
  },
  { id: 'folder', table: ['39.3%', '65.7%'], space: ['31%', '53%', -200, 8], dur: '37s', drift: ['14px', '-12px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('folder')}><FolderStill /></div> },
  {
    id: 'toolbar', table: ['4%', '88%'], space: ['12%', '72%', -120, 8], dur: '32s', drift: ['40px', '-10px'], live: true,
    // a tool cap opens the icon button's x-ray; the strip opens the toolbar's
    node: ({ openXray }) => (
      <div onClick={(e) => { openXray((e.target as HTMLElement).closest('.mu-tool') ? 'icon-button' : 'toolbar'); }}>
      <Toolbar aria-label="Tools">
        <ToolButton label="Select" icon={<Icon name="select" size={16} />} pressed />
        <ToolButton label="Note" icon={<Icon name="note" size={16} />} />
        <ToolButton label="Draw" icon={<Icon name="draw" size={16} />} />
        <ToolbarSeparator />
        <ToolButton label="Tidy" icon={<Icon name="tidy" size={16} />} />
      </Toolbar>
      </div>
    ),
  },
];

/** An open x-ray, the object it was opened from, the config it took from it, and its pose. */
export type XrayOpen = { [K in XrayKind]: { kind: K; from: string; seed?: XraySeed<K>; pose?: XrayPose; zoom?: number } }[XrayKind];

/* The x-ray flight. A copy of the object (the flyer) leaves the table and lands on its model
 * in the x-ray card:
 *   1 lift    it rises a little off the table
 *   2 fly     it flies to the model's place, growing to the model's size and tilting to the
 *             x-ray's angle as it goes, so its face lands on the model's face
 *   3 land    it lands exactly on the model's top face (its height included), and only
 *             then hands over: the model comes up under it, then the flyer goes
 *   4 open    a model that can lie flat (.xr-scene[data-settle]) lands as the object itself,
 *             every part on one plane, and opens up only once the flyer has gone; before
 *             the flight home it closes up again, so what lifts off is what landed
 * Meanwhile the card composes around it (kds.css, .xr-overlay.is-flown).
 *
 * It is one timeline on live elements: open plays it forward, close plays it backward, and
 * either can be turned around mid-air (Esc, a click outside the card, or a click on the
 * flyer), carrying on from exactly where it is. */
const OPEN_MS = 1100;
const CLOSE_MS = 900;
/** The x-ray's angle (.xr-iso): a flat face turned and laid back. */
const ISO = 'rotateX(58deg) rotateZ(-38deg)';
const FLAT = 'rotateX(0deg) rotateZ(0deg)';
// the lift eases off the table; the flight starts slow and lands softly
const LIFT_EASE = 'cubic-bezier(.3, 0, .2, 1)';
const FLY_EASE = 'cubic-bezier(.55, 0, .2, 1)';

interface Flight { from: string; dir: 'open' | 'close'; anims: Animation[]; flyer: HTMLElement }

/** Parts of an x-ray scene that are not the object's body: the floor, labels, light, shadows. */
const NOT_BODY = '.xr-floor, .xr-anchor, .xr-sun, .xr-shadow, .xr-tag, .xr-measure, .xr-dims, .xr-floortext, .xr-leaders';

/** Where the object lands: the model's top face, as an offset from the scene's centre in the
 *  iso plane, its height above the floor and its size, all in screen px. The face is the
 *  model's largest body part, and the highest of those. Read with the iso laid flat (x, y,
 *  size), then stood on edge (rotateX(-90deg) turns height into screen y). */
interface Face { x: number; y: number; z: number; w: number; h: number }
function modelFace(scene: HTMLElement): Face | null {
  const iso = scene.querySelector<HTMLElement>('.xr-iso');
  if (!iso) return null;
  const parts = [...iso.querySelectorAll<HTMLElement>('*')].filter((el) => !el.closest(NOT_BODY));
  const { transform, animation } = iso.style;
  const read = (pose: string) => {
    iso.style.animation = 'none';
    iso.style.transform = pose;
    const s = scene.getBoundingClientRect();
    return { cx: s.left + s.width / 2, cy: s.top + s.height / 2, rects: parts.map((el) => el.getBoundingClientRect()) };
  };
  const flat = read('none'), edge = read('rotateX(-90deg)');
  iso.style.transform = transform;
  iso.style.animation = animation;
  let face: Face | null = null;
  for (const [i, r] of flat.rects.entries()) {
    const area = r.width * r.height, z = edge.rects[i].top + edge.rects[i].height / 2 - edge.cy;
    const best = face ? face.w * face.h : 0;
    if (area > best * 1.02 || (face && area > best * 0.98 && z > face.z)) {
      face = { x: r.left + r.width / 2 - flat.cx, y: r.top + r.height / 2 - flat.cy, z, w: r.width, h: r.height };
    }
  }
  return face;
}

/** Builds the flight between an object on the table and its x-ray, parked at the start. */
function buildFlight(item: HTMLElement, overlay: HTMLElement): Omit<Flight, 'from' | 'dir'> {
  const model = overlay.querySelector<HTMLElement>('.xr-scene') ?? overlay.querySelector<HTMLElement>('.xr-bench') ?? overlay;
  const flyer = document.createElement('div');
  flyer.className = 'xr-flyer';
  flyer.setAttribute('aria-hidden', 'true');
  item.childNodes.forEach((n) => flyer.appendChild(n.cloneNode(true)));
  document.body.appendChild(flyer);
  // its size to the fraction (offsetWidth rounds, and a zoomed object is not a whole number of px wide),
  // then pinned, so every pose scales the same box
  const fr = flyer.getBoundingClientRect(), ow = fr.width, oh = fr.height;
  flyer.style.width = `${ow}px`;
  flyer.style.height = `${oh}px`;
  // the copy is a still: a sliding thumb sits under the option that is chosen now, not where the
  // live one was when the same click chose it (the live thumb only moves after the click)
  flyer.querySelectorAll<HTMLElement>('.mu-indicator').forEach((thumb) => {
    const group = thumb.parentElement!, on = group.querySelector<HTMLElement>('[aria-checked="true"],[aria-selected="true"],[aria-current="page"]');
    if (!on) return;
    let x = 0, y = 0, node: HTMLElement | null = on;
    while (node && node !== group) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent as HTMLElement | null; }
    thumb.removeAttribute('data-animate');
    Object.assign(thumb.style, { width: `${on.offsetWidth}px`, height: `${on.offsetHeight}px`, transform: `translate(${x}px, ${y}px)` });
  });
  // home: where the object hangs now; land: the model's top face, which the object covers exactly.
  // Every pose has the same functions, so the flight interpolates them one by one.
  const h = item.getBoundingClientRect(), m = model.getBoundingClientRect();
  const face = model.classList.contains('xr-scene') ? modelFace(model) : null;
  const ls = Math.min(m.width / ow, m.height / oh);
  const at = (cx: number, cy: number, k: number, turn: string, lift = '0px, 0px, 0px', fit = '1, 1') =>
    `translate(${cx - ow / 2}px, ${cy - oh / 2}px) scale(${k}) ${turn} translate3d(${lift}) scale(${fit})`;
  const hs = h.width / ow, hx = h.left + h.width / 2, hy = h.top + h.height / 2, mx = m.left + m.width / 2, my = m.top + m.height / 2;
  const home = at(hx, hy, hs, FLAT), lifted = at(hx, hy - 14, hs * 1.08, FLAT);
  const land = face
    ? at(mx, my, 1, ISO, `${face.x}px, ${face.y}px, ${face.z}px`, `${face.w / ow}, ${face.h / oh}`)
    : at(mx, my, ls, ISO);
  const opts = { duration: OPEN_MS, fill: 'both' as const };
  const anims = [
    flyer.animate([{ transform: home, easing: LIFT_EASE }, { transform: lifted, offset: 0.2, easing: FLY_EASE }, { transform: land, offset: 0.85 }, { transform: land }], opts),
    // the hand-over waits for the landing: the model comes up under the flyer, then the flyer goes
    flyer.animate([{ opacity: 1 }, { opacity: 1, offset: 0.88 }, { opacity: 0, offset: 0.96 }, { opacity: 0 }], opts),
    overlay.animate([{ opacity: 0, easing: 'ease-out' }, { opacity: 1, offset: 0.4 }, { opacity: 1 }], opts),
    ...(model.classList.contains('xr-scene') ? [model.animate([{ opacity: 0 }, { opacity: 0, offset: 0.78 }, { opacity: 1, offset: 0.88 }, { opacity: 1 }], opts)] : []),
  ];
  return { anims, flyer };
}

export function useXrayFlight() {
  const [open, setOpen] = React.useState<XrayOpen | null>(null);
  /** The object that is away from the table: in the air, or in its x-ray. */
  const [away, setAway] = React.useState<string | undefined>();
  /** The table objects' configs: what each is set to now, whether on the table or in its x-ray. */
  const [seeds, setSeeds] = React.useState<Partial<XraySeeds>>({});
  const flight = React.useRef<Flight | null>(null);
  const settling = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = React.useRef(open);
  openRef.current = open;
  // written through a ref too, so the open that follows a pick in the same click takes the pick
  const seedsRef = React.useRef(seeds);
  const reseed = React.useCallback<XrayReseed>((kind, seed) => {
    seedsRef.current = { ...seedsRef.current, [kind]: seed };
    setSeeds(seedsRef.current);
  }, []);

  const land = React.useCallback((f: Flight) => {
    if (flight.current !== f) return;
    flight.current = null;
    delete document.documentElement.dataset.flight;
    f.flyer.remove();
    if (f.dir === 'open') { f.anims.slice(2).forEach((a) => a.cancel()); setOpen((o) => o && { ...o, pose: 'open' }); }
    else flushSync(() => { setOpen(null); setAway(undefined); });
  }, []);

  const start = React.useCallback((next: XrayOpen | null) => {
    const root = document.documentElement;
    const reduced = root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = next?.from ?? openRef.current?.from;
    const item = from ? document.querySelector<HTMLElement>(`[data-float="${from}"]`) : null;
    const seeded = next && ({ ...next, seed: (seedsRef.current as Partial<Record<XrayKind, unknown>>)[next.kind] } as XrayOpen);
    if (reduced || !from || !item) { setOpen(seeded && { ...seeded, pose: 'open' }); setAway(next?.from); return; }
    root.dataset.flight = next ? 'open' : 'close';
    if (seeded) flushSync(() => { setOpen({ ...seeded, pose: 'flat' }); setAway(seeded.from); });
    const overlay = document.querySelector<HTMLElement>('.xr-overlay');
    if (!overlay) { delete root.dataset.flight; setOpen(seeded); setAway(next?.from); return; }
    const built = buildFlight(item, overlay);
    const nf: Flight = { from, dir: next ? 'open' : 'close', ...built };
    flight.current = nf;
    if (!next) nf.anims.forEach((a) => { a.currentTime = OPEN_MS; a.playbackRate = -OPEN_MS / CLOSE_MS; });
    nf.anims[0].onfinish = () => land(nf);
    // the flyer is the object: click it mid-air to send it back
    nf.flyer.addEventListener('click', () => flyRef.current(nf.dir === 'open' ? null : { kind: openRef.current!.kind, from: nf.from } as XrayOpen));
  }, [land]);

  const fly = React.useCallback((next: XrayOpen | null) => {
    const root = document.documentElement;
    const f = flight.current;
    // mid-air: turn around, from exactly where it is
    if (f) {
      const dir = next ? 'open' : 'close';
      if (dir === f.dir || (next && next.from !== f.from)) return;
      f.dir = dir;
      root.dataset.flight = dir;
      f.anims.forEach((a) => { a.playbackRate = dir === 'open' ? 1 : -OPEN_MS / CLOSE_MS; });
      return;
    }
    if (settling.current) return;
    // going home from an opened-up model: it closes up first, then the object lifts off it
    const scene = !next && openRef.current?.pose === 'open' ? document.querySelector<HTMLElement>('.xr-overlay .xr-scene[data-settle]') : null;
    const reduced = root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (scene && !reduced) {
      root.dataset.flight = 'close';
      setOpen((o) => o && { ...o, pose: 'flat' });
      settling.current = setTimeout(() => { settling.current = null; start(null); }, Number(scene.dataset.settle));
      return;
    }
    start(next);
  }, [start]);
  const flyRef = React.useRef(fly);
  flyRef.current = fly;

  const close = React.useCallback(() => fly(null), [fly]);
  // leaving the page mid-air: take the flyer with it
  React.useEffect(() => () => { flight.current?.flyer.remove(); if (settling.current) clearTimeout(settling.current); delete document.documentElement.dataset.flight; }, []);
  return { open, away, seeds, reseed, fly, close };
}

export function FloatingTable({ mode, lifted, seeds, onSeed, onXray }: { mode: 'space' | 'table'; lifted?: string; seeds: Partial<XraySeeds>; onSeed: XrayReseed; onXray: (open: XrayOpen) => void }) {
  const [chip, setChip] = React.useState(true);
  const root = React.useRef<HTMLDivElement>(null);

  // the camera leans toward the pointer, in space only
  React.useEffect(() => {
    if (mode !== 'space') return;
    const el = root.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      el.style.setProperty('--lean-x', `${(-y * 6).toFixed(2)}deg`);
      el.style.setProperty('--lean-y', `${(x * 8).toFixed(2)}deg`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [mode]);

  return (
    <div ref={root} className={mode === 'space' ? 'space' : 'drift'} role="region" aria-label="Components on the table">
      <div className={mode === 'space' ? 'space-camera' : undefined} style={mode === 'space' ? undefined : { position: 'absolute', inset: 0 }}>
        {ITEMS.map((it) => {
          const [tx, ty] = it.table;
          const [sx, sy, z, turn] = it.space;
          const pos = mode === 'space'
            ? {
                // placed out from the perspective origin by as much as depth draws it back in, so its centre
                // appears where the item says at any window size
                left: `calc(50% + (${sx} - 50%) * ${(PERSPECTIVE - z) / PERSPECTIVE})`,
                top: `calc(40% + (${sy} - 40%) * ${(PERSPECTIVE - z) / PERSPECTIVE})`,
                translate: '-50% -50%',
                ['--z' as string]: `${z}px`, ['--turn' as string]: `${turn}deg`, ['--blur' as string]: `${Math.max(0, -z - 150) / 120}px`,
              }
            : { left: tx, top: ty };
          const style = {
            ...pos,
            ['--dur' as string]: it.dur,
            ['--dx' as string]: it.drift[0],
            ['--dy' as string]: it.drift[1],
            ['--delay' as string]: `-${parseFloat(it.dur) / 3}s`,
            viewTransitionName: `float-${it.id}`,
            // while it is in the air or in its x-ray, the object is away from the table
            visibility: it.id === lifted ? 'hidden' : undefined,
          } as React.CSSProperties;
          return (
            <div key={it.id} data-float={it.id} className={['drift-item', mode === 'space' ? 'in-space' : '', it.live ? 'is-live' : ''].join(' ')} style={style}>
              <div style={it.zoom ? { zoom: it.zoom } : undefined}>{it.node({ openXray: (kind) => onXray({ kind, from: it.id, zoom: it.zoom } as XrayOpen), chip, setChip, seeds, onSeed })}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
