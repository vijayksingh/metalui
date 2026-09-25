import * as React from 'react';
import { Switch } from '@unlocalhosted/metalui';
import { Gadget, driveRange, renderGadgetSvg, type GadgetSpec } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import needleGauge from '../../../../../packages/metalui/src/gadgets/fixtures/needle-gauge.gadget.json';
import swingSource from '../../../../../packages/metalui/gadgets/src/mechanisms/swing.mjs?raw';
import agentGuide from '../../../../../packages/metalui/src/gadgets/needle-gauge/needle-gauge.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Gadgets/MetalGadget.swift?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const SPEC = needleGauge as unknown as GadgetSpec;
const RANGE = driveRange(SPEC);
const PIVOT = SPEC.parts.find((p) => p.part === 'needle')!.at;
const ARC = Number(SPEC.parts.find((p) => p.part === 'needle')!.params?.arc ?? 120);

/** Point at the glass and the needle swings there: the angle from its pivot is the value. */
function PointedGauge({ sound, onValue }: { sound: ReturnType<typeof createSound>; onValue: (v: number) => void }) {
  const [value, setValue] = React.useState(24);
  const latest = React.useRef(24);                     // quick key presses step from the latest value
  const ref = React.useRef<HTMLDivElement>(null);
  const set = (v: number) => { const c = Math.min(RANGE.max, Math.max(RANGE.min, v)); latest.current = c; setValue(c); onValue(c); };
  const fromPointer = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect(), k = r.width / 400;
    const deg = (Math.atan2(e.clientX - r.left - PIVOT[0] * k, PIVOT[1] * k - (e.clientY - r.top)) * 180) / Math.PI;
    set(RANGE.min + (deg / ARC + 0.5) * (RANGE.max - RANGE.min));
  };
  const dragging = React.useRef(false);
  return (
    <div ref={ref} role="slider" tabIndex={0} aria-label="Minutes read today" aria-valuemin={RANGE.min} aria-valuemax={RANGE.max} aria-valuenow={Math.round(value)}
      data-testid="gauge-point" className="cursor-pointer touch-none select-none rounded-card outline-none focus-visible:focus-ring"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; fromPointer(e); }}
      onPointerMove={(e) => { if (dragging.current) fromPointer(e); }}
      onPointerUp={() => { dragging.current = false; }}
      onKeyDown={(e) => {
        const step: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10, Home: -RANGE.max, End: RANGE.max };
        if (e.key in step) { e.preventDefault(); set(Math.round(latest.current) + step[e.key]); }
      }}>
      <Gadget spec={SPEC} value={value} sound={sound} size={280} data-testid="gauge" />
    </div>
  );
}

export default function NeedleGaugePage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [value, setValue] = React.useState(24);
  const still = React.useMemo(() => renderGadgetSvg(SPEC, { size: 96, value: 34 }), []);
  return (
    <>
      <PageHeader
        title="Needle gauge"
        lede="A gadget for a level: a needle over a scale printed in peach glass, in a copper bezel, with a lamp and a beeper on the frame. A value swings the needle; past the threshold the gauge is over and says so. It is only a spec: the renderer draws it, and the swing mechanism moves it."
      />
      <Section title="Point at it" lede="Press or drag on the glass: the needle swings to where you point, overshoots a little and settles. Flick it to either end and it bounces off the peg. Past the amber zone the lamp goes amber and the beeper says so, once. With a keyboard, the arrow keys move it a minute.">
        <Bench caption={`needle-gauge · signal, own · metal · swing · ${Math.round(value)} of ${RANGE.max} ${RANGE.unit}`}>
          <div className="flex w-full flex-wrap items-center gap-24">
            <PointedGauge sound={sound} onValue={setValue} />
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
            </label>
          </div>
        </Bench>
      </Section>
      <Section title="Levels" lede="Under the zone it rests; past it, it is over. On the web and by MetalGadget in SwiftUI from the same JSON.">
        <Bench caption="8 · 24 · 34 · 40 minutes">
          <div className="flex flex-wrap items-end gap-20" data-testid="gauge-levels">
            {[8, 24, 34, 40].map((v) => <figure key={v} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} value={v} size={128} /><figcaption className="type-label engraved">{v} min</figcaption></figure>)}
          </div>
        </Bench>
        <SwiftCapture name="gadget-needle-gauge" maxWidth={760} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="160 · 96 · 64 · 32 px">
          <div className="flex flex-wrap items-end gap-20" data-testid="gauge-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} value={24} size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Without a browser">
        <Bench caption="renderGadgetSvg(spec, { size: 96, value: 34 })">
          <div data-testid="gauge-static" dangerouslySetInnerHTML={{ __html: still }} />
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'G1', title: 'The value decides', body: 'Past the threshold the gauge is over; the host sets the value, never the state.' },
            { id: 'G2', title: 'News once', body: 'Crossing into the zone beeps once. Staying there is quiet.' },
            { id: 'G3', title: 'Silent needle', body: 'The needle makes no sound as it swings.' },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="needle-gauge.gadget.json" lang="json" />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'swing', label: 'Swing', code: swingSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
        ]} />
      </Section>
    </>
  );
}
