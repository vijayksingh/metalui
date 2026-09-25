import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Slab, Switch } from '@unlocalhosted/metalui';
import { GADGETS, type Cut, type GadgetMaterial } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import slabSource from '../../../../../packages/metalui/src/components/slab/slab.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/slab.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/slab/slab.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalSlab.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs, TokenTable } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const MATERIALS = GADGETS.parts.slab.materials as readonly GadgetMaterial[];
const CUTS: [string, Cut[]][] = [
  ['slots', [128, 180, 232].map((x) => ({ kind: 'slot', at: [x, 200], size: [18, 212] }) as Cut)],
  ['holes', [{ kind: 'hole', at: [140, 150], size: [40, 40] }, { kind: 'hole', at: [260, 150], size: [40, 40] }, { kind: 'hole', at: [200, 262], size: [26, 26] }]],
  ['tray', [{ kind: 'tray', at: [200, 218], size: [268, 164] }]],
  ['well', [{ kind: 'well', at: [200, 200], size: [220, 220] }]],
];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A slab that answers a press: it gives by its material's travel and sounds as its material. */
function StrikeSlab({ material, cuts, size, sound, contrast }: { material: GadgetMaterial; cuts: Cut[]; size: number; sound: ReturnType<typeof createSound>; contrast: boolean }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const strike = () => {
    sound.strike(material, { weight: 0.3, rendered: size });
    const travel = (GADGETS.strike.travel as Record<string, number>)[material] ?? 0.5;
    ref.current?.animate([{ transform: 'none' }, { transform: `translateY(${travel}px)` }, { transform: 'none' }], { duration: reduced() ? 120 : 260, easing: 'cubic-bezier(.3,1.4,.4,1)' });
  };
  return (
    <button ref={ref} type="button" onPointerDown={strike} aria-label={`Strike the ${material} slab`} data-slab={material}
      className="cursor-pointer rounded-card border-0 bg-transparent p-0 focus-visible:focus-ring" data-mu-contrast={contrast ? 'more' : undefined}>
      <Slab material={material} cuts={cuts} size={size} />
    </button>
  );
}

export default function SlabPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const d = useDialKit('Slab', { material: { type: 'select', options: [...MATERIALS], default: 'stone' }, cuts: { type: 'select', options: CUTS.map(([k]) => k), default: 'slots' }, contrast: false });
  const tierCuts = CUTS.find(([k]) => k === d.cuts)![1];
  return (
    <>
      <PageHeader
        title="Slab"
        lede="The thick panel a gadget is cut from. It is one of the materials, lit by the one light, with rolled edges and cuts made into it: slots for faders, holes for jacks and lamps, trays for keys, shallow wells. A cut's floor is the slab's own material in shadow, darker the deeper it goes; its top wall is dark and its lower lip catches the light."
      />
      <Section title="Materials and cuts" lede="Six materials a slab may be cut from, each with every kind of cut. Press one: it gives by its material's travel and sounds as its material.">
        <Bench caption={`gadgets.parts.slab · floors: pigment − ${GADGETS.hole.floor.drop} − ${GADGETS.hole.floor.depthDrop} × depth ÷ 24 · depths ${Object.entries(GADGETS.hole.depths).map(([k, v]) => `${k} ${v}`).join(', ')}`}>
          <div className="flex w-full flex-col gap-16">
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
            </label>
            <div className="grid grid-cols-[auto_repeat(4,minmax(0,1fr))] items-center gap-12" data-testid="slab-sheet">
              <span />
              {CUTS.map(([k]) => <span key={k} className="type-label engraved text-center">{k}</span>)}
              {MATERIALS.flatMap((m) => [
                <span key={`${m}-name`} className="type-label engraved">{m}</span>,
                ...CUTS.map(([k, cuts]) => <div key={`${m}-${k}`} className="flex justify-center"><StrikeSlab material={m} cuts={cuts} size={112} sound={sound} contrast={d.contrast} /></div>),
              ])}
            </div>
          </div>
        </Bench>
        <SwiftCapture name="slab" maxWidth={560} />
      </Section>
      <Section title="Detail by size" lede="Full lighting from 96 px: grain, flecks, both shadows, the walls and lips. Lite from 48 px: a softer bevel and one shadow. Flat below: no filters at all, so an app icon never pays for them.">
        <Bench caption={`${d.material} · ${d.cuts}${d.contrast ? ' · increased contrast' : ''}`}>
          <div className="flex flex-wrap items-end gap-20" data-testid="slab-tiers" data-mu-contrast={d.contrast ? 'more' : undefined}>
            {[320, 160, 64, 32].map((s) => (
              <figure key={s} className="m-0 flex flex-col items-center gap-6">
                <Slab material={d.material as GadgetMaterial} cuts={tierCuts} size={s} />
                <figcaption className="type-readout text-ink3">{s} px</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
      </Section>
      <Section title="Cuts">
        <TokenTable
          head={['Cut', 'Shape', 'Default depth']}
          mono={[0]}
          rows={Object.entries(GADGETS.hole.depths).map(([k, v]) => [k, { slot: 'a capsule along its long side', hole: 'a circle', tray: `a rounded rectangle, radius ${GADGETS.hole.trayRadius}`, well: 'a softer rounded rectangle' }[k] ?? '', `${v} units`])}
        />
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'S1', title: 'A floor is the same material', body: 'You see through a cut into the slab itself. Its floor is the slab\'s pigment in shadow, never a generic grey.' },
            { id: 'S2', title: 'One light for every cut', body: 'The top wall is in shadow and the lower lip is lit, for every cut, because the light always comes from the upper left.' },
            { id: 'S3', title: 'A slab is never pressed alone', body: 'It is a part. It gives and sounds only as part of a gadget\'s act, or here, so you can hear its material.' },
            { id: 'S4', title: 'Fewer filters when small', body: 'Below 96 px the grain and flecks go; below 48 px every filter goes. The shape and its cuts still read.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: slabSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
