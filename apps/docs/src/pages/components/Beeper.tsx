import * as React from 'react';
import { Beeper, Button, Switch, type BeeperProps } from '@unlocalhosted/metalui';
import { GADGETS, beeperEnvelope } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import beeperSource from '../../../../../packages/metalui/src/components/beeper/beeper.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/beeper.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/beeper/beeper.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalBeeper.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

type Earcon = NonNullable<BeeperProps['earcon']>;
const EARCONS: Earcon[] = ['done', 'failed', 'waiting', 'ready'];
const LOOKS: { label: string; slots: number; material: 'metal' | 'clay' }[] = [
  { label: 'steel · 3', slots: 3, material: 'metal' },
  { label: 'steel · 5', slots: 5, material: 'metal' },
  { label: 'steel · 7', slots: 7, material: 'metal' },
  { label: 'clay · 5', slots: 5, material: 'clay' },
];

/** An earcon's flex, drawn as the envelope both platforms sample: what the disc does, note by note. */
function Envelope({ earcon }: { earcon: Earcon }) {
  const env = beeperEnvelope(earcon), end = env[env.length - 1].at, W = 132, H = 28;
  const d = env.map((e, i) => `${i ? 'L' : 'M'}${((e.at / 400) * W).toFixed(1)},${(H - e.v * (H - 4)).toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label={`${earcon}: ${Math.round(end)} ms`} className="overflow-visible">
      <path d={`${d} L${((end / 400) * W).toFixed(1)},${H}`} fill="none" stroke="currentColor" strokeWidth="1.25" className="text-ink3" />
    </svg>
  );
}

export default function BeeperPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [plays, setPlays] = React.useState<Record<string, number>>({});
  const play = (e: Earcon) => { sound.beep(e); setPlays((p) => ({ ...p, [e]: (p[e] ?? 0) + 1 })); };
  return (
    <>
      <PageHeader
        title="Beeper"
        lede="A grille plate over a brass piezo disc, and the only thing in a gadget that makes a tone. It never glows. While a note plays, the disc flexes and catches the light through the slots, and the plate lifts a hair, in time with the notes you hear."
      />
      <Section title="Four messages" lede="The beeper says only four things, and only when a state changes. Press one: the disc answers note by note, from the same list the sound engine plays. Muted, you can still see it.">
        <Bench caption={`sound.beeper.earcons · rise ${GADGETS.beeper.riseMs} ms · fall ${GADGETS.beeper.fallMs} ms · lift ${GADGETS.beeper.lift} of the width`}>
          <div className="flex w-full flex-col gap-20">
            <div className="flex flex-wrap items-end gap-24" data-testid="beeper-earcons">
              {EARCONS.map((e) => (
                <figure key={e} className="m-0 flex flex-col items-center gap-8" data-testid={`beeper-${e}`} data-plays={plays[e] ?? 0}>
                  <Beeper earcon={e} beat={plays[e] ?? 0} size={128} />
                  <Envelope earcon={e} />
                  <Button onClick={() => play(e)} aria-label={`Play ${e}`}>{e}</Button>
                </figure>
              ))}
            </div>
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
            </label>
          </div>
        </Bench>
      </Section>
      <Section title="Slots and plate" lede="Three to seven slots, in satin steel or clay. The brass behind is always the same disc.">
        <Bench caption="parts.beeper · 44 × 24 · slots 3..7 · metal or clay">
          <div className="flex flex-wrap items-end gap-24" data-testid="beeper-looks">
            {LOOKS.map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6">
                <Beeper slots={l.slots} material={l.material} size={128} />
                <figcaption className="type-label engraved">{l.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="beeper" maxWidth={620} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="96 px and up: lit plate, shaded slots · 48 px: softer · below: flat">
          <div className="flex flex-wrap items-end gap-20" data-testid="beeper-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Beeper size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'B1', title: 'News, not acts', body: 'Only a change of state plays the beeper: synced, failed, waiting, ready. An act is heard through its material.' },
            { id: 'B2', title: 'It never glows', body: 'The disc catches the light as it flexes; it gives none. Lamps are LEDs.' },
            { id: 'B3', title: 'Seen and heard together', body: 'The flex follows the notes themselves, so a muted beep is still seen, at the same moments.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: beeperSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
