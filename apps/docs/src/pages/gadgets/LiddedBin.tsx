import * as React from 'react';
import { Button, Switch } from '@unlocalhosted/metalui';
import { Gadget, renderGadgetSvg, type GadgetSpec } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import liddedBin from '../../../../../packages/metalui/src/gadgets/fixtures/lidded-bin.gadget.json';
import flipSource from '../../../../../packages/metalui/gadgets/src/mechanisms/flip.mjs?raw';
import agentGuide from '../../../../../packages/metalui/src/gadgets/lidded-bin/lidded-bin.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Gadgets/MetalGadget.swift?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const SPEC = liddedBin as unknown as GadgetSpec;
// ms: how long the bin shows it was emptied before it rests again.
const EMPTIED = 1800;

export default function LiddedBinPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [armed, setArmed] = React.useState(false);
  const [emptied, setEmptied] = React.useState(false);
  React.useEffect(() => {
    if (!emptied) return;
    const t = window.setTimeout(() => setEmptied(false), EMPTIED);
    return () => window.clearTimeout(t);
  }, [emptied]);
  const still = React.useMemo(() => renderGadgetSvg(SPEC, { size: 96, value: 1 }), []);
  return (
    <>
      <PageHeader
        title="Lidded bin"
        lede="A gadget for throwing away: a heavy lid in near-black rubber over a bin's mouth, on a near-black rubber slab, and a lamp. Armed, the lid rises ajar and shows its red underside, and the lamp goes red; emptied, the lid swings open and slams shut with a thud. Danger reads from weight, darkness, the lamp and the lid, never from a red body. It is only a spec: the renderer draws it, and the flip mechanism swings the lid."
      />
      <Section title="Arm it, empty it" lede="Arm it and the lid lifts ajar on the hinge spring, creaking, with the red showing under it. Empty it and the lid swings open and falls shut with a rubber thud and a low thump. Turn sound on to hear it.">
        <Bench caption={`lidded-bin · destroy, own · feel .3 .4 .9 → rubber · flip · ${emptied ? 'emptied' : armed ? 'armed' : 'rest'}`}>
          <div className="flex w-full flex-wrap items-center gap-24">
            <Gadget spec={SPEC} value={armed ? 1 : 0} state={emptied ? 'emptied' : undefined} sound={sound} size={280} data-testid="bin" />
            <div className="flex flex-col items-start gap-16">
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Armed" checked={armed} onCheckedChange={setArmed} />Armed
              </label>
              <Button onClick={() => { setEmptied(true); setArmed(false); }} disabled={emptied}>Empty</Button>
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
              </label>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="States" lede="Closed at rest; ajar and red when armed; closed again, with a green blink, once emptied. On the web and by MetalGadget in SwiftUI from the same JSON.">
        <Bench caption="rest · armed · emptied">
          <div className="flex flex-wrap items-end gap-20" data-testid="bin-states">
            {[{ label: 'rest', v: 0 }, { label: 'armed', v: 1 }, { label: 'emptied', v: 0, state: 'emptied' }].map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} value={l.v} state={l.state} size={128} /><figcaption className="type-label engraved">{l.label}</figcaption></figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="gadget-lidded-bin" maxWidth={760} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="160 · 96 · 64 · 32 px">
          <div className="flex flex-wrap items-end gap-20" data-testid="bin-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} value={1} size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Without a browser">
        <Bench caption="renderGadgetSvg(spec, { size: 96, value: 1 })">
          <div data-testid="bin-static" dangerouslySetInnerHTML={{ __html: still }} />
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'G1', title: 'Red under the lid', body: 'Danger is the red underside and the red lamp. The body stays near-black rubber.' },
            { id: 'G2', title: 'Armed is silent', body: 'Arming creaks the lid open a little; it never beeps. Emptying thuds, then says done.' },
            { id: 'G3', title: 'The host decides', body: 'The host arms it (a switch) and empties it (a pulse). The bin never asks.' },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="lidded-bin.gadget.json" lang="json" />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'flip', label: 'Flip', code: flipSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
        ]} />
      </Section>
    </>
  );
}
