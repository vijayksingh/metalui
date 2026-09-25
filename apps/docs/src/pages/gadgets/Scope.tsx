import * as React from 'react';
import { Segmented, Switch } from '@unlocalhosted/metalui';
import { Gadget, MECHANISM_TIMELINES, renderGadgetSvg, type GadgetSpec } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import scope from '../../../../../packages/metalui/src/gadgets/fixtures/scope.gadget.json';
import agentGuide from '../../../../../packages/metalui/src/gadgets/scope/scope.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Gadgets/MetalGadget.swift?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const SPEC = scope as unknown as GadgetSpec;
const STATES = Object.keys(SPEC.states);
const SWEEP = MECHANISM_TIMELINES.sweep;

export default function ScopePage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [state, setState] = React.useState('searching');
  const still = React.useMemo(() => renderGadgetSvg(SPEC, { state: 'found', size: 96 }), []);
  return (
    <>
      <PageHeader
        title="Scope"
        lede="A gadget for search: an ice-glass radar face sunk in a stone bezel. While it searches, a beam sweeps the glass and blips light as it crosses them. It is only a spec: the renderer draws it, and the sweep mechanism runs it."
      />
      <Section title="Search" lede="Searching sweeps the beam again and again; each blip lights as the beam reaches it and fades, with a soft glass tick. Found keeps them lit; nothing leaves the glass dark. Turn sound on to hear the ticks.">
        <Bench caption={`scope · find, world · stone bezel, ice glass · sweep ${SWEEP.duration} ms, looping while searching · ${state}`}>
          <div className="flex w-full flex-wrap items-center gap-24">
            <Gadget spec={SPEC} state={state} sound={sound} size={280} data-testid="scope" />
            <div className="flex flex-col gap-16">
              <Segmented aria-label="State" value={state} onValueChange={setState} options={STATES.map((s) => ({ value: s, label: s }))} />
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
              </label>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="Every state" lede="Rest, searching, found and nothing, on the web and by MetalGadget in SwiftUI from the same JSON.">
        <Bench caption="rest · searching · found · nothing">
          <div className="flex flex-wrap items-end gap-20" data-testid="scope-states">
            {STATES.map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} state={s} size={128} /><figcaption className="type-label engraved">{s}</figcaption></figure>)}
          </div>
        </Bench>
        <SwiftCapture name="gadget-scope" maxWidth={760} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="160 · 96 · 64 · 32 px">
          <div className="flex flex-wrap items-end gap-20" data-testid="scope-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} state="found" size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Without a browser">
        <Bench caption="renderGadgetSvg(spec, { state: 'found', size: 96 })">
          <div data-testid="scope-static" dangerouslySetInnerHTML={{ __html: still }} />
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'S1', title: 'Looking, not progress', body: 'The sweep says the search is running, never how far along it is.' },
            { id: 'S2', title: 'A blip when the beam reaches it', body: 'Each blip lights at its own moment: when the beam crosses its angle. None lights before.' },
            { id: 'S3', title: 'Seen through glass', body: 'An inset gadget is its glass. Its colour, and the set rules, follow the glass.' },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="scope.gadget.json" lang="json" />
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
