import * as React from 'react';
import { Key, Switch, type KeyProps } from '@unlocalhosted/metalui';
import { GADGETS, MECHANISM_TIMELINES } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import keySource from '../../../../../packages/metalui/src/components/key/key.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/key.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/key/key.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalKey.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const LOOKS: { label: string; props: KeyProps }[] = [
  { label: '⌘ · clay', props: { glyph: '⌘' } },
  { label: 'K · accent', props: { glyph: 'K', accent: true } },
  { label: '⇧ · ceramic', props: { glyph: '⇧', material: 'ceramic' } },
  { label: '↩ · clay', props: { glyph: '↩' } },
];
// The press mechanism's own cues: a knock as the key bottoms out, a quieter, higher click at its top stop.
const STRIKES = MECHANISM_TIMELINES.press.cues.filter((c) => c.kind === 'strike') as unknown as { level: number; pitch: number }[];

/** A key to press and hold: it drops into its skirt and knocks; let go, it clicks back up. */
function Press({ sound }: { sound: ReturnType<typeof createSound> }) {
  const [pressed, setPressed] = React.useState(false);
  const size = GADGETS.parts.key.size[0];
  const down = () => { if (!pressed) { setPressed(true); sound.strike('clay', { size, level: STRIKES[0].level, pitch: STRIKES[0].pitch }); } };
  const up = () => { if (pressed) { setPressed(false); sound.strike('clay', { size, level: STRIKES[1].level, pitch: STRIKES[1].pitch, delay: 0.06 }); } };
  return (
    <button type="button" aria-label="Press the key" aria-pressed={pressed} data-testid="key-press"
      onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); down(); } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') up(); }}
      className="cursor-pointer touch-none rounded-card border-0 bg-transparent p-0 focus-visible:focus-ring">
      <Key glyph="K" accent pressed={pressed} size={200} />
    </button>
  );
}

export default function KeyPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  return (
    <>
      <PageHeader
        title="Key"
        lede="A big key standing on its skirt: the Keycap as a gadget draws it. A lit face on a darker skirt, one glyph engraved into it, and its own shadow. Pressed, the face drops into the skirt. Not the inline Keycap, which shows a shortcut and is never pressed."
      />
      <Section title="Keys" lede="Pale clay, white ceramic, or the accent for the key you would press. One glyph each, cut into the face with a lit lower edge.">
        <Bench caption="gadgets.key · 112 × 112 · face 0.8 · glyph 0.46 of the face">
          <div className="flex flex-wrap items-end gap-24" data-testid="key-looks">
            {LOOKS.map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6">
                <Key {...l.props} size={128} />
                <figcaption className="type-label engraved">{l.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="key" maxWidth={720} />
      </Section>
      <Section title="Press it" lede="Hold the key down: the face drops 6 units into its skirt and spreads a little under your finger, and knocks in its material as it bottoms out. Let go and it springs back and clicks against its top stop, quieter and higher. With a keyboard, hold Space.">
        <Bench caption={`press ${GADGETS.key.press[0]} · scale ${GADGETS.key.press[1]} × ${GADGETS.key.press[2]} · release spring · down ${STRIKES[0].level}, up ${STRIKES[1].level} at pitch ${STRIKES[1].pitch}`}>
          <div className="flex flex-wrap items-center gap-24">
            <Press sound={sound} />
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
            </label>
          </div>
        </Bench>
      </Section>
      <Section title="Detail by size">
        <Bench caption="96 px and up: lit, engraved · 48 px: softer · below: flat">
          <div className="flex flex-wrap items-end gap-20" data-testid="key-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Key glyph="⌘" size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'Y1', title: 'In a gadget, not in the interface', body: 'A Key belongs to a gadget. To show a shortcut in the interface, use the inline Keycap.' },
            { id: 'Y2', title: 'One glyph', body: 'A key carries one glyph: a modifier or a letter. A chord is several keys.' },
            { id: 'Y3', title: 'The skirt stays', body: 'Only the face moves; it drops into the skirt and comes back to exactly where it was.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: keySource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
