import * as React from 'react';
import { Button, Switch } from '@unlocalhosted/metalui';
import { Gadget, cellCentres, cellOrder, renderGadgetSvg, type GadgetSpec } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import cellGrid from '../../../../../packages/metalui/src/gadgets/fixtures/cell-grid.gadget.json';
import glowSource from '../../../../../packages/metalui/gadgets/src/mechanisms/glow.mjs?raw';
import agentGuide from '../../../../../packages/metalui/src/gadgets/cell-grid/cell-grid.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Gadgets/MetalGadget.swift?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const SPEC = cellGrid as unknown as GadgetSpec;
const CELLS = SPEC.parts.find((p) => p.part === 'cell')!;
const COLS = Number(CELLS.params?.cols), ROWS = Number(CELLS.params?.rows), N = COLS * ROWS;
const CENTRES = cellCentres({ at: CELLS.at, cols: COLS, rows: ROWS, gap: Number(CELLS.params?.gap), size: CELLS.size![0] });
const ORDER = cellOrder(COLS, ROWS);
// ms: how long a first run holds before the grid falls back to what it keeps.
const FIRST_RUN = 2400;

/** Point at a cell and the grid fills up to it, in its own order: the bottom row first. */
function PointedGrid({ sound, state, onValue }: { sound: ReturnType<typeof createSound>; state?: string; onValue: (v: number) => void }) {
  const [value, setValue] = React.useState(0.4);
  const latest = React.useRef(0.4);                    // quick key presses step from the latest value
  const ref = React.useRef<HTMLDivElement>(null);
  const set = (v: number) => { const c = Math.min(1, Math.max(0, v)); latest.current = c; setValue(c); onValue(c); };
  const fromPointer = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect(), k = r.width / 400, x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k;
    // The nearest cell: the grid fills through it.
    let best = 0;
    CENTRES.forEach((c, i) => { if (Math.hypot(c[0] - x, c[1] - y) < Math.hypot(CENTRES[best][0] - x, CENTRES[best][1] - y)) best = i; });
    set((ORDER[best] + 1) / N);
  };
  const dragging = React.useRef(false);
  return (
    <div ref={ref} role="slider" tabIndex={0} aria-label="Cells kept" aria-valuemin={0} aria-valuemax={N} aria-valuenow={Math.round(value * N)}
      data-testid="grid-point" className="cursor-pointer touch-none select-none rounded-card outline-none focus-visible:focus-ring"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; fromPointer(e); }}
      onPointerMove={(e) => { if (dragging.current) fromPointer(e); }}
      onPointerUp={() => { dragging.current = false; }}
      onKeyDown={(e) => {
        const step: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: COLS, PageDown: -COLS, Home: -N, End: N };
        if (e.key in step) { e.preventDefault(); set((Math.round(latest.current * N) + step[e.key]) / N); }
      }}>
      <Gadget spec={SPEC} value={value} state={state} sound={sound} size={280} data-testid="grid" />
    </div>
  );
}

export default function CellGridPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [value, setValue] = React.useState(0.4);
  const [firstRun, setFirstRun] = React.useState(false);
  React.useEffect(() => {
    if (!firstRun) return;
    const t = window.setTimeout(() => setFirstRun(false), FIRST_RUN);
    return () => window.clearTimeout(t);
  }, [firstRun]);
  const still = React.useMemo(() => renderGadgetSvg(SPEC, { size: 96, value: 0.75 }), []);
  return (
    <>
      <PageHeader
        title="Cell grid"
        lede="A gadget for something kept that fills: sixteen resin cells in a tray sunk into a lilac resin slab, lit from behind, with a lamp. A share lights the cells in turn from the bottom row up, the one filling now part way, and the light behind them brightens with them. On a first run the whole grid rises. It is only a spec: the renderer draws it, and the glow mechanism lights it."
      />
      <Section title="Fill it" lede="Press or drag on a cell: the grid fills up to it, in its order, and settles. Light is silent. With a keyboard, the arrow keys add or take away a cell. First run lights the whole grid, the lamp breathes and the beeper says ready; then it falls back to what it keeps.">
        <Bench caption={`cell-grid · keep, own · resin · glow · ${Math.round(value * N)} of ${N} cells`}>
          <div className="flex w-full flex-wrap items-center gap-24">
            <PointedGrid sound={sound} state={firstRun ? 'first-run' : undefined} onValue={setValue} />
            <div className="flex flex-col items-start gap-16">
              <Button onClick={() => setFirstRun(true)} disabled={firstRun}>First run</Button>
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
              </label>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="States" lede="The share decides: none lit is rest, some filling, all full. A first run is the host's to set. On the web and by MetalGadget in SwiftUI from the same JSON.">
        <Bench caption="0 · 0.4 · 0.75 · 1 · first run">
          <div className="flex flex-wrap items-end gap-20" data-testid="grid-states">
            {[{ v: 0, label: 'rest' }, { v: 0.4, label: 'filling' }, { v: 0.75, label: 'filling' }, { v: 1, label: 'full' }, { v: 0, label: 'first run', state: 'first-run' }].map((l, i) => (
              <figure key={i} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} value={l.v} state={l.state} size={128} /><figcaption className="type-label engraved">{l.label}</figcaption></figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="gadget-cell-grid" maxWidth={760} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="160 · 96 · 64 · 32 px">
          <div className="flex flex-wrap items-end gap-20" data-testid="grid-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} value={0.4} size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Without a browser">
        <Bench caption="renderGadgetSvg(spec, { size: 96, value: 0.75 })">
          <div data-testid="grid-static" dangerouslySetInnerHTML={{ __html: still }} />
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'G1', title: 'The share decides', body: 'The host sets how full it is; rest, filling and full follow. Only a first run is set as a state.' },
            { id: 'G2', title: 'Light is silent', body: 'Cells make no sound as they light. A first run says ready, once.' },
            { id: 'G3', title: 'In order', body: 'Cells light from the bottom row up, left to right; never one out of turn.' },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="cell-grid.gadget.json" lang="json" />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'glow', label: 'Glow', code: glowSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
        ]} />
      </Section>
    </>
  );
}
