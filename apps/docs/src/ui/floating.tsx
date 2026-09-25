import * as React from 'react';
import { flushSync } from 'react-dom';
import { Button, Checkbox, Field, Kbd, LinkCard, Mark, Switcher, Slider, StatusBadge, SuggestionChip, Swatch, Toolbar, ToolButton, ToolbarSeparator } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import type { XrayKind } from './xray';
import { ToastStill } from './xray/ToastXray';
import { MenuStill } from './xray/MenuXray';
import { DialogStill } from './xray/DialogXray';
import { PaletteStill } from './xray/PaletteXray';

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

interface Item {
  id: string;
  /** Position on the flat table (percent of the stage). */
  table: [string, string];
  /** Position in space (percent of the viewport), depth in px (negative is farther), and turn. */
  space: [string, string, number, number];
  dur: string;
  drift: [string, string];
  live?: boolean;
  node: (ctx: { openXray: (which: XrayKind) => void; chip: boolean; setChip: (v: boolean) => void }) => React.ReactNode;
}

const ITEMS: Item[] = [
  {
    id: 'lines', table: ['2%', '3%'], space: ['8%', '20%', -260, 14], dur: '26s', drift: ['30px', '18px'], live: true,
    // a checkbox opens its x-ray
    node: ({ openXray }) => (
      <div className="hero-frags" style={{ gap: 12, maxWidth: 270 }} onClick={(e) => { if ((e.target as HTMLElement).closest('.mu-dimple')) openXray('checkbox'); }}>
        <Line task="open">call printer about paper stock <Mark kind="date" resolved="Fri 25 Sep · 16:00">tomorrow 4pm</Mark></Line>
        <Line task="done">pick the grotesk <Mark kind="tag">#type</Mark></Line>
        <Line><Mark kind="measurement">slept 6h</Mark> · <Mark kind="measurement">mood 3</Mark></Line>
      </div>
    ),
  },
  { id: 'link', table: ['46%', '3.5%'], space: ['56%', '14%', -420, -12], dur: '30s', drift: ['-30px', '26px'], live: true, node: ({ openXray }) => <div onClickCapture={(e) => { e.preventDefault(); openXray('link'); }}><LinkCard href="https://lanterns.photo/night-market" /></div> },
  { id: 'swatch', table: ['84.5%', '4%'], space: ['82%', '34%', -140, -18], dur: '24s', drift: ['-18px', '30px'], live: true, node: ({ openXray }) => <Swatch hex="#FF6B3D" label="Colour" onClick={() => openXray('swatch')} /> },
  {
    // hung back in the scene like its neighbours: at the front and centre, the camera's lean barely moved it
    id: 'button', table: ['36%', '24%'], space: ['42%', '48%', -180, -10], dur: '21s', drift: ['38px', '-22px'], live: true,
    node: ({ openXray }) => <div style={{ zoom: 1.6 }}><Button cap="primary" onClick={() => openXray('button')}>New Canvas</Button></div>,
  },
  {
    id: 'chip', table: ['2%', '62%'], space: ['14%', '62%', -60, 10], dur: '28s', drift: ['22px', '-22px'], live: true,
    // the words open the x-ray; ✓ and × still answer
    node: ({ chip, setChip, openXray }) => chip ? <span onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) openXray('chip'); }}><SuggestionChip label="Track as mood?" confidence={0.8} onAccept={() => setChip(false)} onDismiss={() => setChip(false)} /></span> : null,
  },
  {
    id: 'seg', table: ['5%', '51%'], space: ['70%', '60%', -200, -14], dur: '23s', drift: ['-26px', '-20px'], live: true,
    // a click picks the option and opens the x-ray, like the button
    node: ({ openXray }) => (
      <div style={{ zoom: 1.3 }} onClick={() => openXray('switcher')}>
        <Switcher aria-label="View" defaultValue="week" options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
      </div>
    ),
  },
  { id: 'key', table: ['82%', '52%'], space: ['86%', '66%', 40, -20], dur: '19s', drift: ['-14px', '-26px'], live: true, node: ({ openXray }) => <div style={{ zoom: 1.4 }} onClick={() => openXray('kbd')}><Kbd>⌘K</Kbd></div> },
  { id: 'slider', table: ['37%', '73%'], space: ['30%', '30%', -340, 8], dur: '27s', drift: ['24px', '16px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('slider')}><FloatSlider /></div> },
  {
    id: 'field', table: ['38%', '50%'], space: ['60%', '80%', -180, -10], dur: '29s', drift: ['-20px', '12px'], live: true,
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
  { id: 'status', table: ['68%', '22%'], space: ['40%', '8%', -220, -6], dur: '25s', drift: ['18px', '14px'], live: true, node: ({ openXray }) => <span onClick={() => openXray('status')}><StatusBadge led="live">Sync live</StatusBadge></span> },
  {
    // a still of the tooltip, drawn with its own recipe classes (the real one lives in a portal)
    id: 'tooltip', table: ['36%', '62%'], space: ['7%', '65%', -60, 8], dur: '32s', drift: ['40px', '-10px'], live: true,
    node: ({ openXray }) => (
      <span onClick={() => openXray('tooltip')} className="mu-tooltip inline-block py-tooltip-pad-y px-tooltip-pad-x rounded-tooltip-radius type-tooltip text-tooltip-ink recipe-tooltip whitespace-nowrap">
        Select<span className="mu-tooltip-key text-tooltip-key-ink"> · V</span>
      </span>
    ),
  },
  { id: 'toast', table: ['20%', '85%'], space: ['58%', '30%', -300, -8], dur: '31s', drift: ['16px', '-8px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('toast')}><ToastStill /></div> },
  { id: 'menu', table: ['2%', '22%'], space: ['74%', '4%', -380, -16], dur: '34s', drift: ['12px', '20px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('menu')}><MenuStill /></div> },
  { id: 'dialog', table: ['66%', '28.5%'], space: ['20%', '40%', -480, 12], dur: '36s', drift: ['-14px', '18px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('dialog')}><DialogStill /></div> },
  { id: 'palette', table: ['69%', '71%'], space: ['80%', '78%', -520, -16], dur: '38s', drift: ['-10px', '-14px'], live: true, node: ({ openXray }) => <div style={{ zoom: 0.7 }} onClick={() => openXray('palette')}><PaletteStill /></div> },
  {
    id: 'toolbar', table: ['2%', '71%'], space: ['6%', '72%', -120, 8], dur: '32s', drift: ['40px', '-10px'], live: true,
    // a tool cap opens the icon button's x-ray; the strip opens the toolbar's
    node: ({ openXray }) => (
      <div onClick={(e) => { openXray((e.target as HTMLElement).closest('.mu-tool') ? 'icon-button' : 'toolbar'); }}>
      <Toolbar variant="graphite" aria-label="Tools">
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

/** An open x-ray, and the object it was opened from. */
export interface XrayOpen { kind: XrayKind; from: string }

/* The x-ray flight. A copy of the object (the flyer) leaves the table and lands on its model
 * in the x-ray card:
 *   1 lift    it rises a little off the table
 *   2 fly     it flies to the model's place, growing to the model's size and tilting to the
 *             x-ray's angle as it goes, so its face lands on the model's face
 *   3 land    it hands over to the model through the end of its flight
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

/** Builds the flight between an object on the table and its x-ray, parked at the start. */
function buildFlight(item: HTMLElement, overlay: HTMLElement): Omit<Flight, 'from' | 'dir'> {
  const model = overlay.querySelector<HTMLElement>('.xr-scene') ?? overlay.querySelector<HTMLElement>('.xr-bench') ?? overlay;
  const flyer = document.createElement('div');
  flyer.className = 'xr-flyer';
  flyer.setAttribute('aria-hidden', 'true');
  item.childNodes.forEach((n) => flyer.appendChild(n.cloneNode(true)));
  const ow = item.offsetWidth, oh = item.offsetHeight;
  flyer.style.width = `${ow}px`;
  flyer.style.height = `${oh}px`;
  document.body.appendChild(flyer);
  // home: where the object hangs now; land: the model's flat face, which the object fills
  const h = item.getBoundingClientRect(), m = model.getBoundingClientRect();
  const hs = h.width / ow, ls = Math.min(m.width / ow, m.height / oh);
  const at = (cx: number, cy: number, k: number, turn: string) => `translate(${cx - ow / 2}px, ${cy - oh / 2}px) scale(${k}) ${turn}`;
  const hx = h.left + h.width / 2, hy = h.top + h.height / 2;
  const home = at(hx, hy, hs, FLAT), lifted = at(hx, hy - 14, hs * 1.08, FLAT), land = at(m.left + m.width / 2, m.top + m.height / 2, ls, ISO);
  const opts = { duration: OPEN_MS, fill: 'both' as const };
  const anims = [
    flyer.animate([{ transform: home, easing: LIFT_EASE }, { transform: lifted, offset: 0.2, easing: FLY_EASE }, { transform: land, offset: 0.85 }, { transform: land }], opts),
    flyer.animate([{ opacity: 1 }, { opacity: 1, offset: 0.68 }, { opacity: 0, offset: 0.92 }, { opacity: 0 }], opts),
    overlay.animate([{ opacity: 0, easing: 'ease-out' }, { opacity: 1, offset: 0.4 }, { opacity: 1 }], opts),
    ...(model.classList.contains('xr-scene') ? [model.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1, offset: 0.9 }, { opacity: 1 }], opts)] : []),
  ];
  return { anims, flyer };
}

export function useXrayFlight() {
  const [open, setOpen] = React.useState<XrayOpen | null>(null);
  /** The object that is away from the table: in the air, or in its x-ray. */
  const [away, setAway] = React.useState<string | undefined>();
  const flight = React.useRef<Flight | null>(null);
  const openRef = React.useRef(open);
  openRef.current = open;

  const land = React.useCallback((f: Flight) => {
    if (flight.current !== f) return;
    flight.current = null;
    delete document.documentElement.dataset.flight;
    f.flyer.remove();
    if (f.dir === 'open') f.anims.slice(2).forEach((a) => a.cancel());
    else flushSync(() => { setOpen(null); setAway(undefined); });
  }, []);

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
    const reduced = root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = next?.from ?? openRef.current?.from;
    const item = from ? document.querySelector<HTMLElement>(`[data-float="${from}"]`) : null;
    if (reduced || !from || !item) { setOpen(next); setAway(next?.from); return; }
    root.dataset.flight = next ? 'open' : 'close';
    if (next) flushSync(() => { setOpen(next); setAway(next.from); });
    const overlay = document.querySelector<HTMLElement>('.xr-overlay');
    if (!overlay) { delete root.dataset.flight; setOpen(next); setAway(next?.from); return; }
    const built = buildFlight(item, overlay);
    const nf: Flight = { from, dir: next ? 'open' : 'close', ...built };
    flight.current = nf;
    if (!next) nf.anims.forEach((a) => { a.currentTime = OPEN_MS; a.playbackRate = -OPEN_MS / CLOSE_MS; });
    nf.anims[0].onfinish = () => land(nf);
    // the flyer is the object: click it mid-air to send it back
    nf.flyer.addEventListener('click', () => flyRef.current(nf.dir === 'open' ? null : { kind: openRef.current!.kind, from: nf.from }));
  }, [land]);
  const flyRef = React.useRef(fly);
  flyRef.current = fly;

  const close = React.useCallback(() => fly(null), [fly]);
  // leaving the page mid-air: take the flyer with it
  React.useEffect(() => () => { flight.current?.flyer.remove(); delete document.documentElement.dataset.flight; }, []);
  return { open, away, fly, close };
}

export function FloatingTable({ mode, lifted, onXray }: { mode: 'space' | 'table'; lifted?: string; onXray: (open: XrayOpen) => void }) {
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
    <div ref={root} className={mode === 'space' ? 'space' : 'drift'} aria-label="Components on the table">
      <div className={mode === 'space' ? 'space-camera' : undefined} style={mode === 'space' ? undefined : { position: 'absolute', inset: 0 }}>
        {ITEMS.map((it) => {
          const [tx, ty] = it.table;
          const [sx, sy, z, turn] = it.space;
          const pos = mode === 'space'
            ? { left: sx, top: sy, ['--z' as string]: `${z}px`, ['--turn' as string]: `${turn}deg`, ['--blur' as string]: `${Math.max(0, -z - 150) / 120}px` }
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
              {it.node({ openXray: (kind) => onXray({ kind, from: it.id }), chip, setChip })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
