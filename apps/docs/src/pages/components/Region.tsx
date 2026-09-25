import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Dimple, Region, RegionRow } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/blocks/region/region.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/blocks/region/region.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalRegionView.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

type Rid = 'todo' | 'done';
const RULES: Record<Rid, { rule: string; drop: string }> = {
  todo: { rule: 'makes tasks', drop: 'drop to make tasks' },
  done: { rule: 'marks tasks done', drop: 'drop to mark tasks done' },
};

/* Two regions and one block. Drag the block over a region: it lights and says what the drop will do.
 * Drop it: the block lands inside on the object spring, the count rises. Double-click a name to rename it. */
function Board({ dim, past }: { dim: boolean; past: boolean }) {
  const [names, setNames] = React.useState<Record<Rid, string>>({ todo: 'To do', done: 'Done' });
  const [renaming, setRenaming] = React.useState<Rid | null>(null);
  const [inRegion, setInRegion] = React.useState<Rid | null>(null);
  const [over, setOver] = React.useState<Rid | null>(null);
  const [drag, setDrag] = React.useState<{ x: number; y: number } | null>(null);
  const board = React.useRef<HTMLDivElement>(null);
  const refs = { todo: React.useRef<HTMLDivElement>(null), done: React.useRef<HTMLDivElement>(null) };
  const hit = (x: number, y: number): Rid | null =>
    (Object.keys(refs) as Rid[]).find((k) => { const r = refs[k].current!.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; }) ?? null;
  const home = { x: 24, y: 300 };
  const slot = (r: Rid) => { const b = board.current!.getBoundingClientRect(), g = refs[r].current!.getBoundingClientRect(); return { x: g.left - b.left + 22, y: g.top - b.top + 56 }; };
  const pos = drag ?? (inRegion ? slot(inRegion) : home);

  return (
    <div ref={board} className="relative h-[360px] w-full max-w-[720px]" data-testid="region-board">
      <div className="absolute left-0 top-0 flex gap-24">
        {(['todo', 'done'] as Rid[]).map((r) => (
          <Region
            key={r}
            ref={refs[r]}
            data-region={r}
            name={names[r]}
            rule={RULES[r].rule}
            dropRule={RULES[r].drop}
            count={inRegion === r ? 1 : 0}
            over={over === r}
            dim={dim && r === 'todo'}
            past={past && r === 'done'}
            renaming={renaming === r}
            onDoubleClick={() => setRenaming(r)}
            onRename={(n) => { setNames((s) => ({ ...s, [r]: n })); setRenaming(null); }}
            onRenameCancel={() => setRenaming(null)}
            width={300}
            height={250}
          />
        ))}
      </div>
      <div
        data-testid="drag-block"
        role="button"
        tabIndex={0}
        aria-label="Send the poster, drag into a region"
        className="type-content absolute cursor-grab select-none rounded-plate px-14 py-8 text-ink material-raised"
        style={{
          left: 0, top: 0,
          transform: `translate(${pos.x}px, ${pos.y}px)${drag ? ' translateY(-3px) scale(1.01)' : ''}`,
          // Carried under the pointer; lands inside a region on the object spring (a stop), home on settle.
          transition: drag ? 'none' : inRegion ? 'transform var(--mu-spring-object-d) var(--mu-spring-object)' : 'transform var(--mu-spring-settle-d) var(--mu-spring-settle)',
          zIndex: 2,
        }}
        onPointerDown={(e) => {
          const b = board.current!.getBoundingClientRect(), start = { x: e.clientX, y: e.clientY }, from = pos;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          const move = (ev: PointerEvent) => { setDrag({ x: from.x + ev.clientX - start.x, y: from.y + ev.clientY - start.y }); setOver(hit(ev.clientX, ev.clientY)); };
          const up = (ev: PointerEvent) => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setInRegion(hit(ev.clientX, ev.clientY)); setOver(null); setDrag(null); void b; };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        }}
      >
        send the poster
      </div>
    </div>
  );
}

export default function RegionPage() {
  const d = useDialKit('Region', { dim: false, past: false });
  const [ticked, setTicked] = React.useState(false);
  return (
    <>
      <PageHeader
        title="Region"
        lede="A drawn rectangle with a name that carries a rule. Done ticks what lands, To do makes tasks, a date dates, any other name tags. Arrangement is structure, and it is reversible: drag a block out and the rule comes off. A pinned lens is a region too: a frosted plate that lists its matches."
      />

      <Section title="Drop a block" lede="Drag the block over a region: it lights and its rule says what the drop will do. Drop it and it lands inside on the object spring. Double-click a name to rename it. Dials: dim (an in-place lens with no match inside) and past (the region did not exist yet).">
        <Bench caption={`${d.dim ? 'To do dimmed' : ''}${d.past ? ' · Done in the past' : ''}`.trim() || 'rest'} className="wide min-h-[400px] items-start justify-start">
          <Board dim={d.dim} past={d.past} />
        </Bench>
      </Section>

      <Section title="States and a lens">
        <Bench tone="page" caption="rest · over · dim · a pinned lens with rows">
          <div className="flex flex-wrap gap-24">
            <Region name="friday" rule="dates them friday" count={2} width={220} height={150} />
            <Region name="Done" rule="marks tasks done" dropRule="drop to mark tasks done" over width={220} height={150} />
            <Region name="#poster" rule="tags them #poster" dim width={220} height={150} />
            <Region name="" width={220} height={150} />
            <Region name="open tasks" rule="lens · live" lens width={300} height={200}>
              <RegionRow lead={<Dimple checked={ticked} onCheckedChange={setTicked} aria-label="Send the poster" />} meta="FRI" checked={ticked}>Send the poster</RegionRow>
              <RegionRow lead={<Dimple aria-label="Call the printer" />} meta="TUE">Call the printer</RegionRow>
              <RegionRow lead={<Dimple aria-label="Book the room" />}>Book the room</RegionRow>
            </Region>
          </div>
        </Bench>
        <SwiftCapture name="region" />
      </Section>

      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: reactSource },
          { id: 'css', label: 'CSS', code: cssSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'R1', title: 'Placement is meaning, and reversible', body: 'A drop applies the rule with a toast that names it and offers Undo; dragging out takes it off.', origin: 'reference brief' },
            { id: 'R2', title: 'The over state says what the drop will do', body: 'The rule is rewritten as its drop: drop to mark tasks done. Colour is never alone.', origin: 'reference design' },
            { id: 'R3', title: 'A drop is a landing', body: 'The block settles inside the edges on the object spring, a stop; it never lands on a neighbour.', origin: 'DS-20, T5b' },
            { id: 'R4', title: 'Radius by size', body: '30 when the short side is at least 240, else 24: always on the ladder.', origin: 'DS-14' },
          ]}
        />
      </Section>
    </>
  );
}
