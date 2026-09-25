import * as React from 'react';
import { Button, Switch } from '@unlocalhosted/metalui';
import { GADGETS, Gadget, renderGadgetSvg, type GadgetSpec } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import drawer from '../../../../../packages/metalui/src/gadgets/fixtures/drawer.gadget.json';
import slideOutSource from '../../../../../packages/metalui/gadgets/src/mechanisms/slide-out.mjs?raw';
import agentGuide from '../../../../../packages/metalui/src/gadgets/drawer/drawer.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Gadgets/MetalGadget.swift?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const SPEC = drawer as unknown as GadgetSpec;
const CARDS = GADGETS.tray.cards;

export default function DrawerPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [cards, setCards] = React.useState(4);
  const [open, setOpen] = React.useState(false);
  const [act, setAct] = React.useState(0);
  const fill = cards / CARDS, full = fill >= GADGETS.tray.full;
  const still = React.useMemo(() => renderGadgetSvg(SPEC, { size: 96, value: 1 }), []);
  return (
    <>
      <PageHeader
        title="Drawer"
        lede="A gadget for what is kept: a pale steel filing drawer under a steel top, with a metal pull and a lamp. File a card and the drawer slides out on its runners, stops against them, and springs home; fill it and it will not close. It is only a spec: the renderer draws it, and the slide-out mechanism moves it."
      />
      <Section title="File it" lede="File a card: the drawer runs out toward you, knocks against its runners, holds a moment and springs home. Press the drawer to peek in. Filled to nine cards of ten, it stays out, too full to close, and the lamp goes amber. Turn sound on to hear the runners.">
        <Bench caption={`drawer · keep, own · metal · slide-out · ${cards} of ${CARDS} cards · ${open ? 'open' : full ? 'full' : 'rest'}`}>
          <div className="flex w-full flex-wrap items-center gap-24">
            <button type="button" aria-label="Peek in the drawer" data-testid="drawer-peek" disabled={full || open}
              className="cursor-pointer rounded-card border-0 bg-transparent p-0 outline-none focus-visible:focus-ring disabled:cursor-default" onClick={() => setAct((a) => a + 1)}>
              <Gadget spec={SPEC} value={fill} state={open ? 'open' : undefined} act={act} sound={sound} size={280} data-testid="drawer" />
            </button>
            <div className="flex flex-col items-start gap-16">
              <Button onClick={() => { setCards((c) => Math.min(CARDS, c + 1)); if (!full && !open) setAct((a) => a + 1); }} disabled={cards >= CARDS}>File a card</Button>
              <Button onClick={() => setCards(0)} disabled={cards === 0}>Clear it out</Button>
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Held open" checked={open} onCheckedChange={setOpen} />Held open
              </label>
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
              </label>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="States" lede="Shut at rest; out on its runners when held open; stuck out when full. On the web and by MetalGadget in SwiftUI from the same JSON.">
        <Bench caption="rest · open · full">
          <div className="flex flex-wrap items-end gap-20" data-testid="drawer-states">
            {[{ label: 'rest', v: 0.4 }, { label: 'open', v: 0.4, state: 'open' }, { label: 'full', v: 1 }].map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} value={l.v} state={l.state} size={128} /><figcaption className="type-label engraved">{l.label}</figcaption></figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="gadget-drawer" maxWidth={760} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="160 · 96 · 64 · 32 px">
          <div className="flex flex-wrap items-end gap-20" data-testid="drawer-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} value={1} size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Without a browser">
        <Bench caption="renderGadgetSvg(spec, { size: 96, value: 1 })">
          <div data-testid="drawer-static" dangerouslySetInnerHTML={{ __html: still }} />
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'G1', title: 'Full is physical', body: 'A full drawer does not close. That, and an amber lamp, is how it says full.' },
            { id: 'G2', title: 'Runners, not bells', body: 'It sounds like its runners: a slide, a stop, a knock home. No beep.' },
            { id: 'G3', title: 'The share decides', body: 'The host says how full it is; full follows. Holding it open is the host’s.' },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="drawer.gadget.json" lang="json" />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'slide-out', label: 'Slide-out', code: slideOutSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
        ]} />
      </Section>
    </>
  );
}
