import * as React from 'react';
import { Button, Segmented, Switch } from '@unlocalhosted/metalui';
import { Gadget, renderGadgetSvg, type GadgetSpec } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import counterDrum from '../../../../../packages/metalui/src/gadgets/fixtures/counter-drum.gadget.json';
import rollSource from '../../../../../packages/metalui/gadgets/src/mechanisms/roll.mjs?raw';
import agentGuide from '../../../../../packages/metalui/src/gadgets/counter-drum/counter-drum.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Gadgets/MetalGadget.swift?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const SPEC = counterDrum as unknown as GadgetSpec;
const STATES = Object.keys(SPEC.states);

export default function CounterDrumPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [state, setState] = React.useState('counting');
  const [count, setCount] = React.useState(12);
  const still = React.useMemo(() => renderGadgetSvg(SPEC, { state: 'counting', size: 96, value: 12 }), []);
  const step = (n: number) => setCount((c) => Math.max(0, Math.min(999, c + n)));
  return (
    <>
      <PageHeader
        title="Counter drum"
        lede="A gadget for a streak: three numbered drums in a window sunk into a clay slab, the units in orange. The count turns them like an odometer, the lowest first. It is only a spec: the renderer draws it, and the roll mechanism turns it."
      />
      <Section title="Count" lede="Add a day and the units drum turns; add one at 19 and it runs on from 9 into 0 while the tens drum follows it 60 ms later. Each drum ticks past its digits and settles with a small knock. Turn sound on to hear them.">
        <Bench caption={`counter-drum · keep, own · clay · roll · ${count} days`}>
          <div className="flex w-full flex-wrap items-center gap-24">
            <Gadget spec={SPEC} state={state} value={count} sound={sound} size={280} data-testid="counter" />
            <div className="flex flex-col gap-12">
              <div className="flex flex-wrap gap-8">
                <Button onClick={() => step(1)} data-testid="count-up">Add a day</Button>
                <Button onClick={() => step(-1)}>Take one back</Button>
                <Button onClick={() => setCount(99)}>99</Button>
                <Button onClick={() => setCount(0)}>Start again</Button>
              </div>
              <Segmented aria-label="State" value={state} onValueChange={setState} options={STATES.map((s) => ({ value: s, label: s }))} />
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
              </label>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="Every state" lede="Rest, counting and rolled-over, on the web and by MetalGadget in SwiftUI from the same JSON.">
        <Bench caption="rest · counting · rolled-over">
          <div className="flex flex-wrap items-end gap-20" data-testid="counter-states">
            {STATES.map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} state={s} value={12} size={128} /><figcaption className="type-label engraved">{s}</figcaption></figure>)}
          </div>
        </Bench>
        <SwiftCapture name="gadget-counter-drum" maxWidth={760} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="160 · 96 · 64 · 32 px">
          <div className="flex flex-wrap items-end gap-20" data-testid="counter-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} state="counting" value={128} size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Without a browser">
        <Bench caption="renderGadgetSvg(spec, { state: 'counting', size: 96, value: 12 })">
          <div data-testid="counter-static" dangerouslySetInnerHTML={{ __html: still }} />
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'N1', title: 'Like an odometer', body: 'Only a drum whose digit changes turns, the lowest first; a higher one follows only when it carries.' },
            { id: 'N2', title: 'Forward through 9', body: 'Counting up, a drum runs on from 9 into 0. It never turns back through 8.' },
            { id: 'N3', title: 'It says its count', body: 'Its description carries the value: "Streak: 12 days".' },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="counter-drum.gadget.json" lang="json" />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'roll', label: 'Roll', code: rollSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
        ]} />
      </Section>
    </>
  );
}
