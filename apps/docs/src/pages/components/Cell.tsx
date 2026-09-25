import { Cell, type CellProps } from '@unlocalhosted/metalui';
import { GADGETS } from '@unlocalhosted/metalui/gadgets';
import { useDialKit } from 'dialkit';
import cellSource from '../../../../../packages/metalui/src/components/cell/cell.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/cell.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/cell/cell.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalCell.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const LOOKS: { label: string; props: CellProps }[] = [
  { label: 'dark', props: { lit: 0 } },
  { label: '6.5 · filling', props: { lit: 6.5 } },
  { label: 'full', props: { lit: 16 } },
  { label: '3 × 2 · 4 lit', props: { cols: 3, rows: 2, lit: 4 } },
];

export default function CellPage() {
  const dials = useDialKit('Cell', { lit: [6.5, 0, 16, 0.1], cols: [4, 1, 8, 1], rows: [4, 1, 8, 1], gap: [GADGETS.cell.alone[1], GADGETS.parts.cell.params.gap[1], GADGETS.parts.cell.params.gap[2], 1] });
  const n = dials.cols * dials.rows;
  return (
    <>
      <PageHeader
        title="Cell"
        lede="Raised blocks of translucent resin, lit from behind. Dark, a cell is the resin's own colour; lit, the light comes through it, hottest at its core and thinner at its rim, and spills onto the slab around it. They light from the bottom row up, so a grid reads as something filling."
      />
      <Section title="Looks" lede="lit is how many cells are lit, a real number: the cell filling now glows part way.">
        <Bench caption={`gadgets.cell · 44 square · radius ${GADGETS.cell.radius} · resin lets ${GADGETS.materials.resin.translucency * 100}% through at the rim`}>
          <div className="flex flex-wrap items-end gap-24" data-testid="cell-looks">
            {LOOKS.map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6">
                <Cell size={180} {...l.props} />
                <figcaption className="type-label engraved">{l.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="cell" maxWidth={760} />
      </Section>
      <Section title="Tune" lede="The dials set the grid and how much of it is lit.">
        <Bench caption={`${dials.cols} × ${dials.rows} · ${Math.min(dials.lit, n).toFixed(1)} of ${n} lit`}>
          <div data-testid="cell-tune"><Cell size={280} cols={dials.cols} rows={dials.rows} gap={dials.gap} lit={Math.min(dials.lit, n)} /></div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'E1', title: 'How full, not how many', body: 'A cell grid shows something filling. A count a person reads is a Drum.' },
            { id: 'E2', title: 'Kept things only', body: 'Cells stand for what a person keeps: a memory, a library, a cache. A passing level is a Needle.' },
            { id: 'E3', title: 'Light comes from behind', body: 'A lit cell glows through the resin; it never gets a new pigment. Its colour is always its own resin, lifted.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: cellSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
