import * as React from 'react';
import { Backlight, Bezel, Slider } from '@unlocalhosted/metalui';
import { GADGETS, resolveFeel } from '@unlocalhosted/metalui/gadgets';
import backlightSource from '../../../../../packages/metalui/src/components/backlight/backlight.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/backlight.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/backlight/backlight.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalBacklight.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const search = resolveFeel({ job: 'find', feel: { v: 0.7, a: 0.8, w: 0.1 } });
const BLIPS: [number, number][] = [[148, 150], [262, 228], [182, 272]];

export default function BacklightPage() {
  const [alpha, setAlpha] = React.useState<number>(GADGETS.backlight.alpha);
  const [heading, setHeading] = React.useState(40);
  return (
    <>
      <PageHeader
        title="Backlight"
        lede="Light behind glass, in its own colour, fading to nothing at its edge: a soft glow, a radar beam with a bright leading edge that fades behind it, or a blip. It sits inside a bezel's glass, under the glass's rings and glare."
      />
      <Section title="Glow, beam and blip" lede="A glow in a signal colour, a beam in the glass's own colour lifted, and blips. Turn the beam and dim the light below.">
        <Bench caption={`gadgets.backlight · beam ${GADGETS.backlight.spread}° in ${GADGETS.backlight.slices} slices · alpha ${alpha.toFixed(2)} · heading ${heading}°`}>
          <div className="flex w-full flex-col gap-16">
            <div className="flex flex-wrap items-end gap-24" data-testid="backlight-looks">
              <figure className="m-0 flex flex-col items-center gap-6">
                <Bezel material="stone" color={search.body} glass={search.face} size={180}><Backlight shape="glow" color={{ signal: 'live' }} alpha={alpha} /></Bezel>
                <figcaption className="type-label engraved">glow · live</figcaption>
              </figure>
              <figure className="m-0 flex flex-col items-center gap-6">
                <Bezel material="stone" color={search.body} glass={search.face} size={180}><Backlight shape="beam" color={{ glass: search.face }} alpha={alpha} heading={heading} /></Bezel>
                <figcaption className="type-label engraved">beam · glass</figcaption>
              </figure>
              <figure className="m-0 flex flex-col items-center gap-6">
                <Bezel material="stone" color={search.body} glass={search.face} size={180}>
                  {BLIPS.map((at, i) => <Backlight key={i} shape="dot" at={at} color={{ glass: search.face }} alpha={alpha} />)}
                </Bezel>
                <figcaption className="type-label engraved">blips · glass</figcaption>
              </figure>
              <figure className="m-0 flex flex-col items-center gap-6">
                <Bezel material="metal" size={180}><Backlight shape="glow" color={{ accent: true }} alpha={alpha} /></Bezel>
                <figcaption className="type-label engraved">glow · accent</figcaption>
              </figure>
            </div>
            <div className="grid max-w-[420px] grid-cols-[80px_1fr] items-center gap-12">
              <span className="type-ui text-ink2">Alpha</span>
              <Slider.Root value={alpha} min={0} max={1} step={0.01} onValueChange={(v) => setAlpha(v as number)}><Slider.Track /><Slider.Knob aria-label="Alpha" /></Slider.Root>
              <span className="type-ui text-ink2">Heading</span>
              <Slider.Root value={heading} min={0} max={359} step={1} onValueChange={(v) => setHeading(v as number)}><Slider.Track /><Slider.Knob aria-label="Heading" /></Slider.Root>
            </div>
          </div>
        </Bench>
        <SwiftCapture name="backlight" maxWidth={760} />
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'L1', title: 'Only behind glass', body: 'A backlight shows through glass or resin, never on an opaque part. A status light is an LED.' },
            { id: 'L2', title: 'No hard edge', body: 'Light fades to nothing at its edge; a backlight never has an outline.' },
            { id: 'L3', title: 'Under the surface', body: 'The glass\'s rings and glare lie over the light, so it reads as inside.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: backlightSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
