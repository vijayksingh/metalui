import * as React from 'react';
import { useDialKit } from 'dialkit';
import { SelectionFrame, SlidingIndicator, type SelectionEdge, type SelectionHandle } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/selection-frame/selection-frame.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/selection-frame/selection-frame.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalSelectionFrame.swift?raw';
import { Bench, Code, PageHeader, Rules, Section, TokenTable } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const TABS = [
  { id: 'react', label: 'React', code: reactSource },
  { id: 'css', label: 'CSS', code: cssSource },
  { id: 'swift', label: 'SwiftUI', code: swiftSource },
  { id: 'agent', label: 'Agent guide', code: agentGuide },
] as const;

/** Which band edge the pointer is in: within `band` of an edge, outside or inside (the demo's hit band). */
function edgeAt(e: React.PointerEvent<HTMLElement>, band: number): SelectionEdge | null {
  const r = e.currentTarget.getBoundingClientRect();
  const d = { n: e.clientY - r.top, s: r.bottom - e.clientY, w: e.clientX - r.left, e: r.right - e.clientX };
  const [k, v] = Object.entries(d).sort((a, b) => a[1] - b[1])[0] as [SelectionEdge, number];
  return v <= band ? k : null;
}

/** The band corner under the pointer: within the band of two edges at once. */
function cornerAt(e: React.PointerEvent<HTMLElement>, band: number): 'nw' | 'ne' | 'se' | 'sw' | null {
  const r = e.currentTarget.getBoundingClientRect();
  const v = e.clientY - r.top <= band ? 'n' : r.bottom - e.clientY <= band ? 's' : null;
  const h = e.clientX - r.left <= band ? 'w' : r.right - e.clientX <= band ? 'e' : null;
  return v && h ? (`${v}${h}` as 'nw' | 'ne' | 'se' | 'sw') : null;
}

/* A text block as the canvas draws it: words only at rest, the frosted plate on hover and while writing.
 * Click selects; a second click writes; ⎋ finishes and selects quietly; e/w and corner dots set the width. */
function TextBlock({ radius, handles, entrance }: { radius: number; handles: 'object' | 'text' | 'none'; entrance: boolean }) {
  const [sel, setSel] = React.useState<'none' | 'click' | 'quiet'>('none');
  const [editing, setEditing] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [edge, setEdge] = React.useState<SelectionEdge | null>(null);
  const [corner, setCorner] = React.useState<'nw' | 'ne' | 'se' | 'sw' | null>(null);
  const [width, setWidth] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const host = React.useRef<HTMLDivElement>(null);
  const body = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!editing) return;
    body.current?.focus();
  }, [editing]);

  const onHandle = (h: SelectionHandle, e: React.PointerEvent<HTMLSpanElement>) => {
    if (h === 'n' || h === 's') return; // grips: the host would move the block
    e.preventDefault();
    const start = e.clientX, w0 = host.current!.offsetWidth;
    const dir = h.includes('w') ? -1 : 1;
    const move = (ev: PointerEvent) => setWidth(Math.max(80, Math.min(480, w0 + dir * (ev.clientX - start))));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="flex flex-col items-center gap-48">
      <div
        ref={host}
        data-testid="text-block"
        role="option"
        aria-selected={sel !== 'none'}
        tabIndex={0}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => { setHover(false); setEdge(null); setCorner(null); }}
        onPointerMove={(e) => { const c = cornerAt(e, 10); setCorner(c); setEdge(sel === 'none' && !c ? edgeAt(e, 6) : null); }}
        onClick={() => { if (sel === 'click' && !editing) setEditing(true); else if (!editing) setSel('click'); }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setEditing(false); setSel(editing ? 'quiet' : 'none'); host.current?.focus(); }
          if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !editing && sel !== 'none') setCopied((c) => (c ? `${c} ` : 'PNG'));
        }}
        className="relative rounded-plate px-14 py-10 text-left outline-none"
        style={{ width: width ?? 'max-content', maxWidth: 480, borderRadius: radius }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] transition-[opacity,transform] duration-[var(--mu-spring-settle-d)] ease-[var(--mu-spring-settle)]"
          style={{
            opacity: hover || editing ? 1 : 0,
            transform: hover || editing ? 'translateY(-1px)' : 'translateY(2px) scale(.985)',
            background: 'linear-gradient(180deg, var(--mu-s-hi), var(--mu-s) 55%, var(--mu-s-lo))',
            boxShadow: 'var(--mu-raise-sm)',
          }}
        />
        <div
          ref={body}
          data-testid="text-body"
          contentEditable={editing ? 'plaintext-only' : false}
          suppressContentEditableWarning
          className="type-content whitespace-pre-wrap text-ink caret-[var(--mu-green-deep)] outline-none"
        >
          brekkie with Sam before the offsite
        </div>
        <SelectionFrame
          state={sel !== 'none' ? 'selected' : hover ? 'hover' : 'rest'}
          variant={sel === 'quiet' ? 'lite' : 'ring'}
          mode={editing ? 'writing' : 'idle'}
          radius={radius}
          handles={handles}
          edge={edge}
          corner={corner}
          copied={copied?.trim() ?? null}
          entrance={entrance}
          onHandlePointerDown={onHandle}
        />
      </div>
      <span className="type-meta text-ink2">Click to select · click again to write · ⎋ to finish quietly · ⌘C copies · drag a side dot to set the width</span>
    </div>
  );
}

export default function SelectionFramePage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]['id']>('react');
  const d = useDialKit('Selection frame', {
    block: {
      radius: [18, 0, 30, 6],
      handles: { type: 'select', options: ['text', 'object', 'none'], default: 'text' },
      entrance: true,
    },
    specimen: {
      width: [320, 120, 420, 2],
      height: [214, 60, 300, 2],
      count: [1, 1, 12, 1],
    },
  });
  const code = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <PageHeader
        title="Selection frame"
        lede="the object sheet: the one selection for every kind of object. A 1.25 green ring with a flat collar sits six points outside the object, eight handles sit on the ring, and a graphite readout under it reads the object's measured frame. At rest a borderless object shows nothing; on hover, only faint corner dots and the edge light where the pointer enters its band."
      />

      <Section title="Playground" lede="A text block as the canvas draws it. The ring, handles and readout re-measure in the same frame as each keystroke and never replay their entrance. Dials: the block's radius, its handles, and the entrance.">
        <Bench caption={`radius ${d.block.radius} · ring ${d.block.radius + 6} · handles ${d.block.handles}`} className="min-h-[260px]">
          <TextBlock radius={d.block.radius} handles={d.block.handles as 'text'} entrance={d.block.entrance} />
        </Bench>
      </Section>

      <Section title="States" lede="Every state as a still. A multi-selection is a lite ring on each member and one readout with the count.">
        <Bench tone="page" caption="rest · hover (edge light on the right) · selected · writing · lite · multi">
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-32 gap-y-72 pb-40">
            {([
              ['rest', { state: 'rest' }],
              ['hover', { state: 'hover', edge: 'e' }],
              ['selected', { state: 'selected' }],
              ['writing', { state: 'selected', mode: 'writing', handles: 'text' }],
              ['lite', { state: 'selected', variant: 'lite', readout: false }],
              ['multi', { state: 'selected', variant: 'lite', count: d.specimen.count > 1 ? d.specimen.count : 3 }],
            ] as [string, React.ComponentProps<typeof SelectionFrame>][]).map(([label, p]) => (
              <figure key={label} className="flex flex-col items-center gap-12">
                <div data-state-demo={label} className="material-raised relative h-[88px] w-[150px] rounded-plate">
                  <SelectionFrame radius={18} entrance={false} {...p} />
                </div>
                <figcaption className="type-label engraved pt-40">{label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <Bench caption={`an object · ${d.specimen.width} × ${d.specimen.height} at the sheet's size`} className="min-h-[340px]">
          <div className="relative rounded-card material-raised" style={{ width: d.specimen.width, height: d.specimen.height }}>
            <SelectionFrame state="selected" radius={24} count={d.specimen.count} entrance={false} />
          </div>
        </Bench>
      </Section>

      <Section title="SwiftUI" lede="The same frame from .metalSelectionFrame(_:), rendered by ImageRenderer from MetalPresence: selected, writing (text handles, readout at .78), lite, and multi.">
        <SwiftCapture name="selection-frame" />
      </Section>

      <Section title="Source" lede="The same Selection frame three ways, plus the guide your coding agent reads.">
        <div className="flex flex-col gap-12">
          <div role="tablist" aria-label="Source" data-md="skip" className="material-well relative inline-flex w-fit rounded-pill p-2">
            <SlidingIndicator className="material-thumb rounded-pill" />
            {TABS.map((t) => (
              <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={['type-ui relative z-10 h-28 cursor-pointer rounded-pill px-13 transition-colors duration-150', tab === t.id ? 'text-ink' : 'text-ink2 hover:text-ink'].join(' ')}>
                {t.label}
              </button>
            ))}
          </div>
          <Code label={code.label} code={code.code} />
        </div>
      </Section>

      <Section title="API">
        <TokenTable
          head={['Prop', 'Type', 'Notes']}
          rows={[
            ['state', "'rest' | 'hover' | 'selected'", 'Rest shows nothing; hover the corner dots; selected the ring, handles and readout.'],
            ['variant', "'ring' | 'lite'", 'Lite: a multi-selection member, or a selection made by finishing.'],
            ['mode', "'idle' | 'writing' | 'moving'", 'Writing dims the readout to .78.'],
            ['radius', 'number', 'The object’s radius; the ring’s is this plus 6.'],
            ['handles', "'object' | 'text' | 'none'", 'Text: n and s are grips that move the block.'],
            ['count', 'number', 'Multi-selection: the readout reads N · W × H.'],
            ['copied', 'string | null', 'COPIED · PNG W × H for 900 ms.'],
            ['edge', "'n' | 'e' | 's' | 'w' | null", 'The band edge under the pointer: its edge light.'],
            ['onHandlePointerDown', '(handle, event) => void', 'The host resizes or moves; the frame follows the box.'],
          ]}
        />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'S1', title: 'One selection for every kind', body: 'Text, image, card, region, file: the same ring at the same offset. For a borderless object the ring and dots are the boundary.', origin: 'reference brief' },
            { id: 'S2', title: 'The readout reads the measured frame', body: 'Fractional layout size, rounded for display, re-read in the same frame as the layout. Never a constant.', origin: 'reference design' },
            { id: 'S3', title: 'Finishing is quiet', body: 'A selection made by ⎋ or ⌘↩ is a lite ring and its readout; it never raises the tool strip over the neighbours.', origin: 'DS-31' },
            { id: 'S4', title: 'The ring enters once', body: 'From 1.02 on the part spring when it becomes selected; typing, resizing and moving never replay it.', origin: 'reference design' },
            { id: 'S5', title: 'Hover never changes layout', body: 'Only the corner dots and the edge light: overlays, not borders.', origin: 'reference brief' },
          ]}
        />
      </Section>
    </>
  );
}
