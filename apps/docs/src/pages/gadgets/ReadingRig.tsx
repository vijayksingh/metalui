import * as React from 'react';
import { Switch } from '@unlocalhosted/metalui';
import { GADGETS, Rig, layoutRig, type GadgetSpec, type RigHop, type RigSpec } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import reading from '../../../../../packages/metalui/src/gadgets/fixtures/reading.rig.json';
import needleGauge from '../../../../../packages/metalui/src/gadgets/fixtures/needle-gauge.gadget.json';
import counterDrum from '../../../../../packages/metalui/src/gadgets/fixtures/counter-drum.gadget.json';
import engineSource from '../../../../../packages/metalui/src/gadgets/rig-engine.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/gadgets/reading-rig/reading-rig.agent.md?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';

const SPEC = reading as unknown as RigSpec;
const CATALOG = { 'needle-gauge': needleGauge, 'counter-drum': counterDrum } as unknown as Record<string, GadgetSpec>;
const LAYOUT = layoutRig(SPEC, CATALOG);
const TODAY = LAYOUT.modules.find((m) => m.inst === 'today')!;
const NEEDLE = TODAY.spec.parts.find((p) => p.part === 'needle')!;
const ARC = Number(NEEDLE.params?.arc ?? 120), RANGE = { min: 0, max: 40 };
const WIDTH = 640;

export default function ReadingRigPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [minutes, setMinutes] = React.useState(24);
  const latest = React.useRef(24);
  const [log, setLog] = React.useState<RigHop[]>([]);
  const set = (v: number) => { const c = Math.round(Math.min(RANGE.max, Math.max(RANGE.min, v))); latest.current = c; setMinutes(c); };
  const values = React.useMemo(() => ({ today: { value: minutes } }), [minutes]);
  // Point at today's glass: the angle from its needle's pivot is the value.
  const k = WIDTH / LAYOUT.width, px = (TODAY.at[0] + NEEDLE.at[0]) * k, py = (TODAY.at[1] + NEEDLE.at[1]) * k;
  const fromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const deg = (Math.atan2(e.clientX - r.left - px, py - (e.clientY - r.top)) * 180) / Math.PI;
    set(RANGE.min + (deg / ARC + 0.5) * (RANGE.max - RANGE.min));
  };
  const dragging = React.useRef(false);
  return (
    <>
      <PageHeader
        title="Reading rig"
        lede="Two gadgets wired by a patch cable: today's needle gauge drives the streak counter. When today's minutes cross the line, a pulse runs along the cord and the streak rolls a day. The rig is only a spec naming two catalog gadgets and one cable; the renderer lays it out, and the rig engine carries the value."
      />
      <Section title="Cross the line" lede="Point at today's glass to set the minutes. Past 30 the gauge goes amber and a bead of light runs along the cord; when it reaches the streak, its drums roll a day. Staying past the line sends nothing more; drop back under and cross again for another day. With a keyboard, the arrow keys move the minutes.">
        <Bench caption={`reading · keep, own · ${minutes} of 40 min today · streak ${12 + log.length} days`}>
          <div className="flex w-full flex-col gap-16">
            <div role="slider" tabIndex={0} aria-label="Minutes read today" aria-valuemin={RANGE.min} aria-valuemax={RANGE.max} aria-valuenow={minutes}
              data-testid="rig-point" className="relative w-fit cursor-pointer touch-none select-none rounded-card outline-none focus-visible:focus-ring"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; fromPointer(e); }}
              onPointerMove={(e) => { if (dragging.current) fromPointer(e); }}
              onPointerUp={() => { dragging.current = false; }}
              onKeyDown={(e) => { const step: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }; if (e.key in step) { e.preventDefault(); set(latest.current + step[e.key]); } }}>
              <Rig spec={SPEC} catalog={CATALOG} values={values} sound={sound} width={WIDTH} data-testid="rig" onPropagate={(h) => setLog((l) => [...l, h])} />
            </div>
            <div className="flex flex-wrap items-center gap-16">
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
              </label>
              <output data-testid="rig-log" className="type-readout text-ink3" aria-live="polite">
                {log.length ? `${log[log.length - 1].from} → ${log[log.length - 1].to}: ${JSON.stringify(log[log.length - 1].value)}` : 'Nothing has travelled yet.'}
              </output>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'W1', title: 'Wired means driven', body: 'A cable means one gadget drives another. What is connected to what is always drawn.' },
            { id: 'W2', title: 'One way', body: 'Values flow from out ports to in ports; a rig never loops back on itself.' },
            { id: 'W3', title: 'See it arrive', body: `A value runs along its cord in ${GADGETS.rig.travel} ms, and the far gadget answers when it arrives.` },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="reading.rig.json" lang="json" />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'engine', label: 'Rig engine', code: engineSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
