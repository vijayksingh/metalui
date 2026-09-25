import * as React from 'react';
import { Plug, Slab, Switch, type PlugProps } from '@unlocalhosted/metalui';
import { GADGETS, createPlayer, drawJack, drawPlug, tierFor, type Player } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import plugSource from '../../../../../packages/metalui/src/components/plug/plug.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/plug.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/plug/plug.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalPlug.swift?raw';
import { useColorway } from '../../app/colorway';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const STUBS: NonNullable<PlugProps['stub']>[] = ['none', 'up', 'left', 'right'];
const JACK: [number, number] = [200, 200];

/** A plug seated in a jack on a clay slab: the first time the seat mechanism runs on the real Parts. */
function Seated({ sound, reduced }: { sound: ReturnType<typeof createSound>; reduced: boolean }) {
  const { colorway } = useColorway();
  const host = colorway === 'graphite' ? 'graphite' : 'bone';
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(240);
  const root = React.useRef<SVGGElement>(null);
  const player = React.useRef<Player | null>(null);
  const [lit, setLit] = React.useState(false);
  const [w, wC, wH] = GADGETS.accent.warm;
  const jack = drawJack(`sj-${uid}`, { at: JACK, lit: lit ? 'live' : null }, { tier, host });
  const plug = React.useMemo(() => drawPlug(`sp-${uid}`, { at: JACK, color: { L: w, C: wC, H: wH }, stub: 'up' }, { tier, host }), [uid, tier, host, w, wC, wH]);

  React.useEffect(() => {
    const el = root.current;
    const p = createPlayer('seat', { plug: el?.querySelector('[data-part="plug"]'), 'plug.shadow': el?.querySelector('[data-part="plug.shadow"]') }, {
      origins: { plug: JACK },
      reduced,
      onStrike: (cue, delay) => sound.strike('clay', { size: 54, weight: 0.4, reach: 'world', level: cue.level, pitch: cue.pitch, delay }),
      onLamp: () => setLit(true),
      onBeep: () => sound.beep('done'),
    });
    player.current = p;
    return () => p.destroy();
  }, [sound, plug, reduced]);

  const act = () => { if (player.current && !player.current.playing) { setLit(false); player.current.act(); } };
  return (
    <button type="button" onClick={act} aria-label="Seat the plug" data-testid="plug-seat" data-lit={lit || undefined}
      className="cursor-pointer rounded-card border-0 bg-transparent p-0 focus-visible:focus-ring">
      <Slab material="clay" size={240} cuts={[{ kind: 'hole', at: JACK, size: [30, 30] }]}>
        <defs dangerouslySetInnerHTML={{ __html: jack.defs + plug.defs }} />
        <g dangerouslySetInnerHTML={{ __html: jack.socket + jack.nut }} />
        {/* The plug's nodes are the player's; its markup must not change when the jack lights. */}
        <g ref={root} dangerouslySetInnerHTML={{ __html: plug.shadow + plug.body }} />
      </Slab>
    </button>
  );
}

export default function PlugPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const reduced = React.useSyncExternalStore(
    (cb) => { const q = matchMedia('(prefers-reduced-motion: reduce)'); q.addEventListener('change', cb); return () => q.removeEventListener('change', cb); },
    () => matchMedia('(prefers-reduced-motion: reduce)').matches, () => false,
  );
  return (
    <>
      <PageHeader
        title="Plug"
        lede="A knurled cap that seats in a jack. A round face on its darker skirt, six grip knurls, a centre boss, and maybe a short rubber cable leaving it. Its shadow is a layer of its own, so when the plug lifts the shadow opens beneath it."
      />
      <Section title="Plain and accent" lede="The plug you would touch wears the accent. Others are pale clay in the material's own colour. A stub shows which way the cable leaves.">
        <Bench caption="gadgets.plug · 6 knurls · boss 0.4 · skirt 0.12 darker · stub dark rubber">
          <div className="flex flex-wrap items-end gap-24" data-testid="plug-states">
            {STUBS.map((s, i) => (
              <figure key={s} className="m-0 flex flex-col items-center gap-6">
                <Plug accent={i % 2 === 1} stub={s} size={112} />
                <figcaption className="type-label engraved">{i % 2 === 1 ? 'accent' : 'clay'} · {s}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="plug" maxWidth={620} />
      </Section>
      <Section title="Seated" lede="Press the plug. It lifts out of its jack, hangs a moment, and clicks home. The click lands the moment the spring does, the socket lamp answers, and the beeper says done. With reduced motion, it is the click and the lamp alone.">
        <Bench caption={`seat mechanism · ${GADGETS.plug.alone} units · clay slab${reduced ? ' · reduced motion' : ''}`}>
          <div className="flex flex-wrap items-center gap-24">
            <Seated sound={sound} reduced={reduced} />
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
            </label>
          </div>
        </Bench>
      </Section>
      <Section title="Detail by size">
        <Bench caption="96 px and up: lit and knurled · 48 px: softer · below: flat">
          <div className="flex flex-wrap items-end gap-20" data-testid="plug-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Plug accent size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'P1', title: 'One accent', body: 'Only the plug you would touch wears the accent. A rig with every plug orange has no plug to touch.' },
            { id: 'P2', title: 'It moves, the jack stays', body: 'The plug lifts, turns and seats; its shadow moves with it. The jack under it never moves.' },
            { id: 'P3', title: 'The cable leaves where it goes', body: 'A stub points toward where its cable runs. With no cable, no stub.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: plugSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
