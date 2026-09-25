import * as React from 'react';
import { Jack, Slab, Switch, type JackProps } from '@unlocalhosted/metalui';
import { drawJack, tierFor } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import jackSource from '../../../../../packages/metalui/src/components/jack/jack.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/jack.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/jack/jack.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalJack.swift?raw';
import { useColorway } from '../../app/colorway';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const LITS: JackProps['lit'][] = [null, 'live', 'link', 'waiting', 'failed'];

/** Two jacks set into a stone slab: the slab's holes are the sockets, the jacks' nuts sit on it. */
function Panel({ sound, lit }: { sound: ReturnType<typeof createSound>; lit: JackProps['lit'] }) {
  const { colorway } = useColorway();
  const host = colorway === 'graphite' ? 'graphite' : 'bone';
  const uid = React.useId().replace(/:/g, '');
  const a = drawJack(`pj-${uid}-a`, { at: [128, 190], lit: null }, { tier: tierFor(240), host });
  const b = drawJack(`pj-${uid}-b`, { at: [272, 190], lit }, { tier: tierFor(240), host });
  return (
    <button type="button" aria-label="Strike the jacks" onPointerDown={() => sound.strike('metal', { size: 68, weight: 0.4, reach: 'world' })}
      className="cursor-pointer rounded-card border-0 bg-transparent p-0 focus-visible:focus-ring" data-testid="jack-panel">
      <Slab material="stone" size={240} cuts={[{ kind: 'hole', at: [128, 190], size: [30, 30] }, { kind: 'hole', at: [272, 190], size: [30, 30] }]}>
        <defs dangerouslySetInnerHTML={{ __html: a.defs + b.defs }} />
        <g dangerouslySetInnerHTML={{ __html: a.socket + b.socket + a.nut + b.nut }} />
      </Slab>
    </button>
  );
}

export default function JackPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [lit, setLit] = React.useState<JackProps['lit']>('link');
  return (
    <>
      <PageHeader
        title="Jack"
        lede="A knurled satin-steel nut around a socket, where a plug seats. The socket is a cut: dark at the bottom, its top wall in shadow. Lit, a lamp glows down there in a signal colour, so a connection can show its state from inside."
      />
      <Section title="Unlit and lit" lede="Five states, from a dark socket to one lit green, blue, amber or red. The colour glows at the bottom of the socket, never on the nut.">
        <Bench caption="gadgets.jack · nut satin steel · 12 knurls · socket 0.44 of the nut">
          <div className="flex flex-wrap items-end gap-24" data-testid="jack-states">
            {LITS.map((l) => (
              <figure key={l ?? 'dark'} className="m-0 flex flex-col items-center gap-6">
                <Jack lit={l} size={112} />
                <figcaption className="type-label engraved">{l ?? 'dark'}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="jack" maxWidth={620} />
      </Section>
      <Section title="In a slab" lede="Jacks sit in holes cut into a slab, the way the patch bay holds them. Press the panel to hear the metal.">
        <Bench caption={`two jacks in stone · right socket ${lit ?? 'dark'}`}>
          <div className="flex flex-wrap items-center gap-24">
            <Panel sound={sound} lit={lit} />
            <div className="flex flex-col gap-12">
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
              </label>
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Lit" checked={!!lit} onCheckedChange={(n) => setLit(n ? 'link' : null)} />Right socket lit
              </label>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="Detail by size">
        <Bench caption="96 px and up: lit metal and knurls · 48 px: softer · below: flat">
          <div className="flex flex-wrap items-end gap-20" data-testid="jack-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Jack lit="live" size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'J1', title: 'The jack stays', body: 'A jack never moves or turns. The plug in it lifts and seats; the jack is the fixed point.' },
            { id: 'J2', title: 'Light from inside', body: 'A lit socket glows at its bottom in a signal colour. The nut stays steel.' },
            { id: 'J3', title: 'Only where something plugs in', body: 'A jack means a connection. A ring with nothing to connect is not one.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: jackSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
