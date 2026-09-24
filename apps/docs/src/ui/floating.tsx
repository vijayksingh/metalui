import * as React from 'react';
import { Button, Checkbox, Field, Kbd, LinkCard, Mark, Segmented, Slider, StatusBadge, SuggestionChip, Swatch, Toolbar, ToolButton, ToolbarSeparator } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import type { XrayKind } from './xray';
import { ToastStill } from './xray/ToastXray';
import { MenuStill } from './xray/MenuXray';

export type { XrayKind };

/* ─────────────────────────────────────────────────────────
 * THE FLOATING TABLE
 *
 *   space   the landing: full screen, objects hang at different depths in one
 *           perspective, drift slowly, and the camera leans toward the pointer
 *   table   the overview: the same objects laid flat in the docs' stage
 *
 *   Each object carries its own view-transition name, so "Read the docs" flies every
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
    id: 'lines', table: ['5%', '9%'], space: ['8%', '20%', -260, 14], dur: '26s', drift: ['30px', '18px'], live: true,
    // a checkbox opens its x-ray
    node: ({ openXray }) => (
      <div className="hero-frags" style={{ gap: 12, maxWidth: 270 }} onClick={(e) => { if ((e.target as HTMLElement).closest('.mu-dimple')) openXray('checkbox'); }}>
        <Line task="open">call printer about paper stock <Mark kind="date" resolved="Fri 25 Sep · 16:00">tomorrow 4pm</Mark></Line>
        <Line task="done">pick the grotesk <Mark kind="tag">#type</Mark></Line>
        <Line><Mark kind="measurement">slept 6h</Mark> · <Mark kind="measurement">mood 3</Mark></Line>
      </div>
    ),
  },
  { id: 'link', table: ['48%', '12%'], space: ['56%', '14%', -420, -12], dur: '30s', drift: ['-30px', '26px'], node: () => <LinkCard href="https://lanterns.photo/night-market" /> },
  { id: 'swatch', table: ['84%', '34%'], space: ['82%', '34%', -140, -18], dur: '24s', drift: ['-18px', '30px'], live: true, node: ({ openXray }) => <Swatch hex="#FF6B3D" label="Colour" onClick={() => openXray('swatch')} /> },
  {
    id: 'button', table: ['36%', '52%'], space: ['42%', '48%', 80, -6], dur: '20s', drift: ['28px', '-14px'], live: true,
    node: ({ openXray }) => <div style={{ zoom: 1.6 }}><Button cap="primary" onClick={() => openXray('button')}>New Canvas</Button></div>,
  },
  {
    id: 'chip', table: ['10%', '62%'], space: ['14%', '62%', -60, 10], dur: '28s', drift: ['22px', '-22px'], live: true,
    // the words open the x-ray; ✓ and × still answer
    node: ({ chip, setChip, openXray }) => chip ? <span onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) openXray('chip'); }}><SuggestionChip label="Track as mood?" confidence={0.8} onAccept={() => setChip(false)} onDismiss={() => setChip(false)} /></span> : null,
  },
  {
    id: 'seg', table: ['66%', '58%'], space: ['70%', '60%', -200, -14], dur: '23s', drift: ['-26px', '-20px'], live: true,
    // a click picks the option and opens the x-ray, like the button
    node: ({ openXray }) => (
      <div style={{ zoom: 1.3 }} onClick={() => openXray('segmented')}>
        <Segmented aria-label="View" defaultValue="week" options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
      </div>
    ),
  },
  { id: 'key', table: ['84%', '72%'], space: ['86%', '66%', 40, -20], dur: '19s', drift: ['-14px', '-26px'], live: true, node: ({ openXray }) => <div style={{ zoom: 1.4 }} onClick={() => openXray('kbd')}><Kbd>⌘K</Kbd></div> },
  { id: 'slider', table: ['54%', '84%'], space: ['30%', '30%', -340, 8], dur: '27s', drift: ['24px', '16px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('slider')}><FloatSlider /></div> },
  {
    id: 'field', table: ['40%', '70%'], space: ['60%', '80%', -180, -10], dur: '29s', drift: ['-20px', '12px'], live: true,
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
  { id: 'status', table: ['62%', '40%'], space: ['40%', '8%', -220, -6], dur: '25s', drift: ['18px', '14px'], live: true, node: ({ openXray }) => <span onClick={() => openXray('status')}><StatusBadge led="live">Sync live</StatusBadge></span> },
  {
    // a still of the tooltip, drawn with its own recipe classes (the real one lives in a portal)
    id: 'tooltip', table: ['21%', '73%'], space: ['7%', '65%', -60, 8], dur: '32s', drift: ['40px', '-10px'], live: true,
    node: ({ openXray }) => (
      <span onClick={() => openXray('tooltip')} className="mu-tooltip inline-block py-tooltip-pad-y px-tooltip-pad-x rounded-tooltip-radius type-tooltip text-tooltip-ink recipe-tooltip whitespace-nowrap">
        Select<span className="mu-tooltip-key text-tooltip-key-ink"> · V</span>
      </span>
    ),
  },
  { id: 'toast', table: ['30%', '93%'], space: ['36%', '86%', -260, 4], dur: '31s', drift: ['16px', '-8px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('toast')}><ToastStill /></div> },
  { id: 'menu', table: ['2%', '30%'], space: ['74%', '4%', -380, -16], dur: '34s', drift: ['12px', '20px'], live: true, node: ({ openXray }) => <div onClick={() => openXray('menu')}><MenuStill /></div> },
  {
    id: 'toolbar', table: ['20%', '82%'], space: ['6%', '72%', -120, 8], dur: '32s', drift: ['40px', '-10px'], live: true,
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

export function FloatingTable({ mode, onXray }: { mode: 'space' | 'table'; onXray: (which: XrayKind) => void }) {
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
          } as React.CSSProperties;
          return (
            <div key={it.id} className={['drift-item', mode === 'space' ? 'in-space' : '', it.live ? 'is-live' : ''].join(' ')} style={style}>
              {it.node({ openXray: onXray, chip, setChip })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
