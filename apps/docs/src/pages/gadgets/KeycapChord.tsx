import * as React from 'react';
import { Button, Segmented, Switch } from '@unlocalhosted/metalui';
import { Gadget, MECHANISM_TIMELINES, renderGadgetSvg, type GadgetSpec } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import keycapChord from '../../../../../packages/metalui/src/gadgets/fixtures/keycap-chord.gadget.json';
import agentGuide from '../../../../../packages/metalui/src/gadgets/keycap-chord/keycap-chord.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Gadgets/MetalGadget.swift?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const SPEC = keycapChord as unknown as GadgetSpec;
const STATES = Object.keys(SPEC.states);
const PRESS = MECHANISM_TIMELINES.press;

export default function KeycapChordPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [state, setState] = React.useState('ready');
  const [act, setAct] = React.useState(0);
  const still = React.useMemo(() => renderGadgetSvg(SPEC, { state: 'ready', size: 96 }), []);
  return (
    <>
      <PageHeader
        title="Keycap chord"
        lede="A gadget for shortcuts: ⌘ and K standing in a tray sunk into a ceramic slab, the key you would press in orange, and a lamp. Its act is a chord, the keys dropping one after another and springing back. It is only a spec; the renderer draws it and the press mechanism plays it."
      />
      <Section title="Play the chord" lede="Press the chord. ⌘ drops into its skirt, K 60 ms after; each knocks as it bottoms out and clicks higher as it springs back to its top stop, and the lamp flickers with the first. Turn sound on to hear the ceramic tink and the clay knock.">
        <Bench caption={`keycap-chord · command, own · ceramic · press ${PRESS.duration} ms a key, ${PRESS.stagger} ms apart`}>
          <div className="flex w-full flex-wrap items-center gap-24">
            <Gadget spec={SPEC} state={state} act={act} sound={sound} size={280} data-testid="chord" />
            <div className="flex flex-col gap-16">
              <Button onClick={() => setAct((n) => n + 1)} data-testid="chord-act">Press the chord</Button>
              <Segmented aria-label="State" value={state} onValueChange={setState} options={STATES.map((s) => ({ value: s, label: s }))} />
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
              </label>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="Every state" lede="Rest, ready and chord, on the web and by MetalGadget in SwiftUI from the same JSON.">
        <Bench caption="rest · ready · chord">
          <div className="flex flex-wrap items-end gap-20" data-testid="chord-states">
            {STATES.map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} state={s} size={128} /><figcaption className="type-label engraved">{s}</figcaption></figure>)}
          </div>
        </Bench>
        <SwiftCapture name="gadget-keycap-chord" maxWidth={720} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="160 · 96 · 64 · 32 px">
          <div className="flex flex-wrap items-end gap-20" data-testid="chord-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} state="ready" size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Without a browser">
        <Bench caption="renderGadgetSvg(spec, { state: 'ready', size: 96 })">
          <div data-testid="chord-static" dangerouslySetInnerHTML={{ __html: still }} />
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'H1', title: 'An emblem, not a keyboard', body: 'The chord stands for shortcuts. To show a shortcut, use the inline Keycap beside its command.' },
            { id: 'H2', title: 'The modifier first', body: 'A chord plays in the order it is typed: the modifier, then the key.' },
            { id: 'H3', title: 'One key to press', body: 'Only the key you would press wears the accent.' },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="keycap-chord.gadget.json" lang="json" />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'agent', label: 'Agent guide', code: agentGuide },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
        ]} />
      </Section>
    </>
  );
}
