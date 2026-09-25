import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Led, StatusBadge, type LedGesture, type LedKind } from '@unlocalhosted/metalui';
import ledSource from '../../../../../packages/metalui/src/components/led/led.tsx?raw';
import agentGuide from '../../../../../packages/metalui/src/components/led/led.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalStatus.swift?raw';
import { tokens } from '../../lib/tokens';
import { Bench, PageHeader, Rules, Section, SourceTabs, TokenTable } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const KINDS: LedKind[] = ['live', 'waiting', 'failed', 'link', 'off'];
const GESTURES: LedGesture[] = ['steady', 'flicker', 'breathe', 'blink2', 'rise'];
const G = tokens.status.gestures as unknown as Record<string, { ms: number; loop?: boolean; keys: number[][] }>;

/** A lamp that plays its gesture again each time `beat` changes. */
function Lamp({ kind, gesture, beat, size }: { kind: LedKind; gesture: LedGesture; beat: number; size?: 'default' | 'small' }) {
  return <Led key={beat} kind={kind} gesture={gesture} size={size} />;
}

/** The lamp in its places: each state names itself in words, and the lamp says how it is going. */
const MOMENTS: { label: string; kind: LedKind; gesture: LedGesture }[] = [
  { label: 'SYNCING', kind: 'waiting', gesture: 'breathe' },
  { label: 'SYNCED', kind: 'live', gesture: 'flicker' },
  { label: 'SYNC FAILED', kind: 'failed', gesture: 'blink2' },
  { label: 'STARTING', kind: 'live', gesture: 'rise' },
];

export default function LedPage() {
  const [beat, setBeat] = React.useState(0);
  const d = useDialKit(
    'LED',
    {
      kind: { type: 'select', options: KINDS, default: 'live' },
      gesture: { type: 'select', options: GESTURES, default: 'flicker' },
      small: false,
      play: { type: 'action', label: 'Play again' },
    },
    { onAction: (a) => a === 'play' && setBeat((b) => b + 1) },
  );
  return (
    <>
      <PageHeader
        title="LED"
        lede="A tiny lamp lit from the top left that says one state by colour, and by how it behaves over time. Five kinds say what: green live, amber waiting, red failed, blue a link, off idle. Five gestures say how: steady, a flicker of activity, a slow breath while something is in progress, two flashes for a failure, a slow rise as something comes on. Never colour alone: the lamp sits beside words."
      />

      <Section title="Kinds and gestures" lede="Every kind can make every gesture. A gesture dims and brightens the lamp's glow and never fades it away, so a lamp that is flickering still reads as its colour. Press Play to run them again.">
        <Bench caption={`status.gestures · ${GESTURES.filter((g) => G[g].ms).map((g) => `${g} ${G[g].ms} ms${G[g].loop ? ' loop' : ''}`).join(' · ')}`}>
          <div className="flex w-full flex-col items-center gap-20" data-testid="led-gestures">
            <table className="border-separate border-spacing-x-24 border-spacing-y-12">
              <thead>
                <tr><th />{GESTURES.map((g) => <th key={g} className="type-label engraved font-normal">{g}</th>)}</tr>
              </thead>
              <tbody>
                {KINDS.map((k) => (
                  <tr key={k}>
                    <th className="type-label engraved text-left font-normal">{k}</th>
                    {GESTURES.map((g) => <td key={g} className="text-center" data-cell={`${k}-${g}`}><Lamp kind={k} gesture={g} beat={beat} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <Button onClick={() => setBeat((b) => b + 1)} data-testid="led-play">Play</Button>
          </div>
        </Bench>
        <SwiftCapture name="led-gestures" maxWidth={560} />
      </Section>

      <Section title="In their places" lede="The same lamp on a status badge. The words say the state; the gesture says how it is going.">
        <Bench caption="badges with gestures">
          <div className="flex flex-wrap justify-center gap-12" data-testid="led-moments">
            {MOMENTS.map((m) => (
              <span key={m.label} className="inline-flex items-center gap-8">
                <Lamp kind={m.kind} gesture={m.gesture} beat={beat} />
                <span className="type-label engraved">{m.label}</span>
              </span>
            ))}
            <StatusBadge led="live">SYNC LIVE</StatusBadge>
          </div>
        </Bench>
      </Section>

      <Section title="Workbench" lede="Pick a kind and a gesture in the LED panel; Play again replays it.">
        <Bench caption={`${d.kind} · ${d.gesture}${d.small ? ' · small' : ''}`}>
          <div className="flex items-center gap-16" data-testid="led-workbench">
            <Lamp kind={d.kind as LedKind} gesture={d.gesture as LedGesture} beat={beat} size={d.small ? 'small' : 'default'} />
            <span className="type-ui text-ink2">{d.gesture === 'breathe' ? 'Breathing until the state changes.' : d.gesture === 'steady' ? 'Holding.' : 'Plays once, then holds lit.'}</span>
          </div>
        </Bench>
      </Section>

      <Section title="Tokens">
        <TokenTable
          head={['Gesture', 'Length', 'Levels (time → level)']}
          rows={GESTURES.map((g) => [g, G[g].ms ? `${G[g].ms} ms${G[g].loop ? ', loops' : ''}` : 'holds', G[g].keys.map(([t, l]) => `${Math.round(t * 100)}%→${l}`).join(' ')])}
        />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'L1', title: 'Words first', body: 'A lamp never says a state alone. Its colour and gesture add to words that already say it.' },
            { id: 'L2', title: 'Dim, never fade', body: 'A gesture dims the glow and brightens it again; the lamp never disappears, so its colour always reads.' },
            { id: 'L3', title: 'One failure blink', body: 'blink2 plays once when something fails, then holds lit red. A lamp that keeps blinking is an alarm, and this is not one.' },
            { id: 'L4', title: 'Breathing means in progress', body: 'Only something still happening breathes. When it finishes, the lamp changes kind or gesture and the breathing stops.' },
            { id: 'L5', title: 'Still under reduced motion', body: 'Every gesture holds its last level. The kind still says the state.' },
          ]}
        />
      </Section>

      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: ledSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
