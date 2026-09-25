import * as React from 'react';
import { Button, Segmented, Slider, Switch } from '@unlocalhosted/metalui';
import { Gadget, renderGadgetSvg, type GadgetSpec } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import faderBank from '../../../../../packages/metalui/src/gadgets/fixtures/fader-bank.gadget.json';
import driveSource from '../../../../../packages/metalui/src/gadgets/drive.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/gadgets/fader-bank/fader-bank.agent.md?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import swiftSource from '../../../../../swift/Sources/MetalUI/Gadgets/MetalGadget.swift?raw';

const SPEC = faderBank as unknown as GadgetSpec;
const STATES = Object.keys(SPEC.states);

export default function FaderBankPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [state, setState] = React.useState('on');
  const [mix, setMix] = React.useState(0.5);
  const still = React.useMemo(() => renderGadgetSvg(SPEC, { state: 'on', size: 96 }), []);
  return (
    <>
      <PageHeader
        title="Fader bank"
        lede="A gadget for settings: three fader caps in slots cut into a pale warm-grey clay slab, the one you would touch in orange, and a lamp. One value moves the whole bank. Like the patch bay, it is only a spec; the renderer draws it and the slide drive moves it."
      />
      <Section title="Move the mix" lede="Drag the mix. Each cap keeps its own place and the bank moves together; push it far and the caps meet the tops of their slots and knock, one after another. Turn sound on to hear them scrape and tick.">
        <Bench caption={`fader-bank · tune, own · feel .6 .5 0 → clay · mix ${mix.toFixed(2)} · ${state}`}>
          <div className="flex w-full flex-wrap items-center gap-24">
            <Gadget spec={SPEC} state={state} value={mix} sound={sound} size={280} data-testid="bank" />
            <div className="flex min-w-[240px] flex-col gap-16">
              <div className="flex items-center gap-12">
                <span className="type-ui text-ink2 w-40">Mix</span>
                <Slider.Root value={mix} min={0} max={1} step={0.01} largeStep={0.125} onValueChange={(v) => setMix(v as number)} className="flex-1">
                  <Slider.Track />
                  <Slider.Knob aria-label="Mix" />
                </Slider.Root>
              </div>
              <div className="flex flex-wrap gap-8">
                <Button onClick={() => setMix(1)}>All the way up</Button>
                <Button onClick={() => setMix(0)}>All the way down</Button>
                <Button onClick={() => setMix(0.5)}>Back to rest</Button>
              </div>
              <Segmented aria-label="State" value={state} onValueChange={setState} options={STATES.map((s) => ({ value: s, label: s }))} />
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
              </label>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="Every state" lede="Rest, on and changed, on the web and by MetalGadget in SwiftUI from the same JSON. The last SwiftUI one is at mix 1: the caps against the tops of their slots.">
        <Bench caption="rest · on · changed">
          <div className="flex flex-wrap items-end gap-20" data-testid="bank-states">
            {STATES.map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} state={s} size={128} /><figcaption className="type-label engraved">{s}</figcaption></figure>)}
          </div>
        </Bench>
        <SwiftCapture name="gadget-fader-bank" maxWidth={720} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="160 · 96 · 64 · 32 px">
          <div className="flex flex-wrap items-end gap-20" data-testid="bank-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} state="on" size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Without a browser">
        <Bench caption="renderGadgetSvg(spec, { state: 'on', size: 96 }): the caps drawn at their rest places">
          <div data-testid="bank-static" dangerouslySetInnerHTML={{ __html: still }} />
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'F1', title: 'A picture of settings', body: 'The fader bank stands for settings; it never changes one. To change a setting, use a Slider.' },
            { id: 'F2', title: 'Each cap keeps its place', body: 'One value moves the bank together, so the caps never line up by accident: their differences are the settings.' },
            { id: 'F3', title: 'News once', body: 'Only the changed state beeps, once, when a change is saved.' },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="fader-bank.gadget.json" lang="json" />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'drive', label: 'Drive', code: driveSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
