import * as React from 'react';
import { Folder, Segmented, Surface, type FolderHue, type FolderPeek } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/folder/folder.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/folder/folder.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* Drag the card onto the folder: it opens as you hover, swings shut as it lands, and the card
 * joins the front. Pick a colour; tab to it to see the keyboard fan. */

const START: FolderPeek[] = [
  { thumb: 'linear-gradient(135deg,#F2A56B,#E0673C 60%,#9E3B25)' },
  { thumb: 'radial-gradient(60% 60% at 30% 30%,#7FA8FF,#2B3F8F)', link: true },
  { thumb: 'linear-gradient(160deg,#3D4B45,#1E2623),radial-gradient(40% 40% at 70% 30%,#9FE3BF,transparent)' },
];
const NEXT = ['linear-gradient(135deg,#F7D774,#D99A1E)', 'linear-gradient(135deg,#C9B6F2,#6E54C9)', 'linear-gradient(135deg,#9AD8C0,#2E8C6A)'];

function Play() {
  const [hue, setHue] = React.useState<FolderHue>('neutral');
  const [peeks, setPeeks] = React.useState(START);
  const [count, setCount] = React.useState(3);
  const [landed, setLanded] = React.useState(0);
  const [over, setOver] = React.useState(false);
  const [card, setCard] = React.useState<{ x: number; y: number } | null>(null);
  const home = { x: 40, y: 150 };
  const box = React.useRef<HTMLDivElement>(null);
  const folder = React.useRef<HTMLDivElement>(null);
  const grab = React.useRef<{ dx: number; dy: number } | null>(null);

  const inside = (x: number, y: number) => {
    const f = folder.current!.getBoundingClientRect();
    return x > f.left && x < f.right && y > f.top && y < f.bottom;
  };
  const at = card ?? home;

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div
        ref={box}
        className="snap-canvas"
        style={{ height: 340, touchAction: 'none' }}
        onPointerMove={(e) => {
          if (!grab.current) return;
          const r = box.current!.getBoundingClientRect();
          setCard({ x: e.clientX - r.left - grab.current.dx, y: e.clientY - r.top - grab.current.dy });
          setOver(inside(e.clientX, e.clientY));
        }}
        onPointerUp={(e) => {
          if (!grab.current) return;
          grab.current = null;
          if (inside(e.clientX, e.clientY)) {
            setPeeks((p) => [...p, { thumb: NEXT[count % NEXT.length] }].slice(-3));
            setCount((n) => n + 1);
            setLanded((n) => n + 1);
          }
          setOver(false);
          setCard(null);
        }}
      >
        <div style={{ position: 'absolute', left: '58%', top: 70, transform: 'translateX(-50%)' }}>
          <Folder ref={folder} name="poster refs" count={count} peeks={peeks} hue={hue} open={over} landed={landed} />
        </div>
        <Surface
          material="raise-sm"
          radius="plate"
          onPointerDown={(e) => {
            // No text selection or native drag: the card itself moves.
            e.preventDefault();
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ }
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            grab.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
          }}
          style={{ position: 'absolute', left: at.x, top: at.y, width: 120, height: 64, display: 'grid', placeItems: 'center', cursor: 'grab', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', zIndex: 10, transition: card ? 'none' : 'left .5s var(--mu-spring-object), top .5s var(--mu-spring-object)' }}
        >
          <span className="eng">drag me in</span>
        </Surface>
      </div>
      <Segmented
        size="compact"
        aria-label="Colour"
        value={hue}
        onValueChange={(v) => setHue(v as FolderHue)}
        options={(['neutral', 'red', 'amber', 'green', 'blue', 'violet'] as const).map((h) => ({ value: h, label: h[0].toUpperCase() + h.slice(1) }))}
      />
    </div>
  );
}

export default function FolderPage() {
  return (
    <ComponentPage
      title="Folder"
      lede="A folder on the canvas holds blocks and takes little space. Unfold it to work with what is inside."
      play={{ lede: 'Hover the folder to fan its cards. Drag the card onto it: it opens as you hover and swings shut as the card lands. Try the colours.', node: <Play /> }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'FO1', title: 'A physical thing', body: 'A folder lives on the canvas like any object: you can move it, drop things in, and see what is inside peeking out.', origin: 'Owner' },
        { id: 'FO2', title: 'One container, two states', body: 'A folder unfolds into a region in its own colour and folds back. The blocks are the same in both.', origin: 'Owner' },
        { id: 'FO3', title: 'Soft colours', body: 'Six paper colours, never a free colour picker. A folder picks its colour from what is inside; you can change it.', origin: 'Owner' },
      ]}
    />
  );
}
