import * as React from 'react';
import { Cap, Switch, type CapProps } from '@unlocalhosted/metalui';
import { GADGETS } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import capSource from '../../../../../packages/metalui/src/components/cap/cap.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/cap.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/cap/cap.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalCap.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const LOOKS: { label: string; props: CapProps }[] = [
  { label: 'clay · 3 ribs', props: { material: 'clay' } },
  { label: 'ceramic · 3 ribs', props: { material: 'ceramic' } },
  { label: 'accent · 3 ribs', props: { accent: true } },
  { label: 'clay · 5 ribs', props: { ribs: 5 } },
  { label: 'knob', props: { shape: 'knob', material: 'ceramic' } },
  { label: 'knob · accent', props: { shape: 'knob', accent: true } },
];
const PRESS_LEVEL = GADGETS.parts.cap.strike[1] as number;

/** A cap to press and hold: it sinks on the release spring and knocks in its material. */
function Press({ sound }: { sound: ReturnType<typeof createSound> }) {
  const [pressed, setPressed] = React.useState(false);
  const down = () => { if (!pressed) { setPressed(true); sound.strike('clay', { size: GADGETS.parts.cap.size[0], weight: 0.3, reach: 'own', level: PRESS_LEVEL }); } };
  const up = () => setPressed(false);
  return (
    <button type="button" aria-label="Press the cap" aria-pressed={pressed} data-testid="cap-press"
      onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); down(); } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') up(); }}
      className="cursor-pointer touch-none rounded-card border-0 bg-transparent p-0 focus-visible:focus-ring">
      <Cap accent pressed={pressed} size={200} />
    </button>
  );
}

export default function CapPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  return (
    <>
      <PageHeader
        title="Cap"
        lede="The fader or knob cap a person moves. A face on its darker side wall, grip ribs across a fader or a pointer groove on a knob, and its own shadow. Pressed, it sinks toward the body and its shadow draws in."
      />
      <Section title="Faders and knobs" lede="Pale clay, white ceramic, or the accent for the one you would touch. Two to five ribs on a fader; a knob is round, the fader's height across.">
        <Bench caption="gadgets.cap · fader 60 × 44 r 13 · side 4 · ribs pitch 8">
          <div className="flex flex-wrap items-end gap-24" data-testid="cap-looks">
            {LOOKS.map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6">
                <Cap {...l.props} size={120} />
                <figcaption className="type-label engraved">{l.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="cap" maxWidth={720} />
      </Section>
      <Section title="Press it" lede="Hold the cap down. The face sinks 2.5 units, the side wall shows less of itself and the shadow draws in, on the release spring, with a soft knock in its material. Let go and it comes back. With a keyboard, hold Space.">
        <Bench caption={`press ${GADGETS.cap.press} units · shadow to ${GADGETS.cap.pressShadow} of its offset · ${GADGETS.cap.pressSpring} spring`}>
          <div className="flex flex-wrap items-center gap-24">
            <Press sound={sound} />
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
            </label>
          </div>
        </Bench>
      </Section>
      <Section title="Detail by size">
        <Bench caption="96 px and up: lit face and ribs · 48 px: softer · below: flat, no ribs">
          <div className="flex flex-wrap items-end gap-20" data-testid="cap-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Cap accent size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'K1', title: 'One accent', body: 'Only the cap you would touch wears the accent. A bank of orange faders has no fader to touch.' },
            { id: 'K2', title: 'A cap moves along or around', body: 'A fader cap slides along its slot; a knob turns in place. Neither is a button.' },
            { id: 'K3', title: 'Ribs run across the travel', body: 'A fader\'s ribs lie across the way it slides, where a thumb pushes.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: capSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
