import * as React from 'react';
import { Folder, Segmented, type FolderHue, type FolderPeek } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/folder/folder.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/folder/folder.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * PUTTING A THING IN A FOLDER
 *
 *  drag     the thing follows the pointer; over the folder, the folder opens wide
 *    0ms    let go over it: the folder stays open; its cards each glide one slot back
 *           (the oldest slides down into the pocket), leaving the front slot empty
 *    0ms    the thing flies into that slot on the object spring, turning to its lean
 *  420ms    it is there: it simply is the front card now
 *  520ms    the whole fan settles down together and the flap swings shut; the count goes up
 *  let go anywhere else: the thing springs back to where it was
 * ───────────────────────────────────────────────────────── */

const TIMING = { fly: 420, settle: 100 };

interface Thing { id: string; peek: FolderPeek; label: string; home: { x: number; y: number } }

const START: FolderPeek[] = [
  { id: 'poster', thumb: 'linear-gradient(135deg,#F2A56B,#E0673C 60%,#9E3B25)' },
  { id: 'type', thumb: 'radial-gradient(60% 60% at 30% 30%,#7FA8FF,#2B3F8F)', link: true },
  { id: 'night', thumb: 'linear-gradient(160deg,#3D4B45,#1E2623),radial-gradient(40% 40% at 70% 30%,#9FE3BF,transparent)' },
];
const THINGS: Thing[] = [
  { id: 'photo', label: 'a photo', peek: { thumb: 'linear-gradient(135deg,#F7D774,#D99A1E 55%,#8C5A12)' }, home: { x: 36, y: 40 } },
  { id: 'link', label: 'a link', peek: { thumb: 'linear-gradient(135deg,#C9B6F2,#6E54C9)', link: true }, home: { x: 36, y: 196 } },
  { id: 'note', label: 'a note', peek: { thumb: 'linear-gradient(135deg,#9AD8C0,#2E8C6A)' }, home: { x: 176, y: 118 } },
];

/** A thing on the canvas, drawn as a folder card so it reads as the same object when it goes in. */
function ThingCard({ peek, label }: { peek: FolderPeek; label: string }) {
  return (
    <div className="folder-card" style={{ position: 'relative', left: 0, bottom: 'auto', transform: 'none', transition: 'none' }} aria-label={label}>
      <div className="folder-thumb" style={{ background: peek.thumb }} />
      <i className="folder-line folder-line-lg" style={{ width: '70%' }} />
      <i className={peek.link ? 'folder-line folder-line-blue' : 'folder-line'} />
      <i className="folder-line" style={{ width: '60%' }} />
    </div>
  );
}

function springEase() {
  if (typeof window === 'undefined') return 'ease-out';
  return getComputedStyle(document.documentElement).getPropertyValue('--mu-spring-object').trim() || 'cubic-bezier(.2,.8,.2,1)';
}

function Play() {
  const [hue, setHue] = React.useState<FolderHue>('neutral');
  const [peeks, setPeeks] = React.useState(START);
  const [count, setCount] = React.useState(3);
  const [landed, setLanded] = React.useState(0);
  const [over, setOver] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [left, setLeft] = React.useState(THINGS.map((t) => t.id));
  const [pos, setPos] = React.useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = React.useState<string | null>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const folder = React.useRef<HTMLDivElement>(null);
  const els = React.useRef<Record<string, HTMLDivElement | null>>({});
  const grab = React.useRef<{ id: string; dx: number; dy: number } | null>(null);

  const inside = (x: number, y: number) => {
    const f = folder.current!.getBoundingClientRect();
    return x > f.left && x < f.right && y > f.top && y < f.bottom;
  };

  // The cards make room, the thing flies into the empty front slot and becomes that card.
  const putIn = async (id: string) => {
    const el = els.current[id]!, from = el.getBoundingClientRect();
    const thing = THINGS.find((t) => t.id === id)!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setBusy(true);
    setPeeks((p) => [...p, { ...thing.peek, id, waiting: true }]);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const slot = folder.current!.querySelector(`[data-card="${id}"]`)!.getBoundingClientRect();
    if (!reduce) {
      const dx = slot.left + slot.width / 2 - (from.left + from.width / 2);
      const dy = slot.top + slot.height / 2 - (from.top + from.height / 2);
      const lean = getComputedStyle(folder.current!.querySelector(`[data-card="${id}"]`)!).getPropertyValue('--r').trim() || '0deg';
      await el.animate(
        [{ transform: 'translate(0,0) rotate(0deg)' }, { transform: `translate(${dx}px, ${dy}px) rotate(${lean})` }],
        { duration: TIMING.fly, easing: springEase(), fill: 'forwards' },
      ).finished;
    }
    // It is there: it is the front card now.
    setPeeks((p) => p.map((c) => (c.id === id ? { ...c, waiting: false } : c)));
    setLeft((l) => l.filter((x) => x !== id));
    setCount((n) => n + 1);
    await new Promise((r) => setTimeout(r, TIMING.settle));
    setOver(false);
    setLanded((n) => n + 1);
    setBusy(false);
  };

  const reset = () => { setLeft(THINGS.map((t) => t.id)); setPos({}); setPeeks(START); setCount(3); };

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div
        ref={box}
        className="snap-canvas"
        style={{ height: 380, touchAction: 'none' }}
        onPointerMove={(e) => {
          const g = grab.current; if (!g) return;
          const r = box.current!.getBoundingClientRect();
          setPos((p) => ({ ...p, [g.id]: { x: e.clientX - r.left - g.dx, y: e.clientY - r.top - g.dy } }));
          setOver(inside(e.clientX, e.clientY));
        }}
        onPointerUp={(e) => {
          const g = grab.current; if (!g) return;
          grab.current = null; setDragging(null);
          if (inside(e.clientX, e.clientY)) void putIn(g.id);
          else { setOver(false); setPos((p) => { const n = { ...p }; delete n[g.id]; return n; }); }
        }}
      >
        <div style={{ position: 'absolute', left: '66%', top: 110, transform: 'translateX(-50%)' }}>
          <Folder ref={folder} name="poster refs" count={count} peeks={peeks} hue={hue} open={over || busy} landed={landed} />
        </div>
        {THINGS.filter((t) => left.includes(t.id)).map((t) => {
          const at = pos[t.id] ?? t.home, held = dragging === t.id;
          return (
            <div
              key={t.id}
              ref={(el) => { els.current[t.id] = el; }}
              onPointerDown={(e) => {
                if (busy) return;
                e.preventDefault();
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ }
                const r = e.currentTarget.getBoundingClientRect();
                grab.current = { id: t.id, dx: e.clientX - r.left, dy: e.clientY - r.top };
                setDragging(t.id);
              }}
              style={{
                position: 'absolute', left: at.x, top: at.y, zIndex: held ? 30 : 20, cursor: held ? 'grabbing' : 'grab',
                touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
                scale: held ? '1.04' : '1', rotate: held ? '-2deg' : '0deg',
                filter: held ? 'drop-shadow(0 18px 24px rgba(0,0,0,.18))' : 'none',
                transition: held ? 'scale .2s var(--mu-spring-part), rotate .2s var(--mu-spring-part), filter .2s ease' : 'left .5s var(--mu-spring-object), top .5s var(--mu-spring-object), scale .3s var(--mu-spring-part), rotate .3s var(--mu-spring-part), filter .3s ease',
              }}
            >
              <ThingCard peek={t.peek} label={t.label} />
            </div>
          );
        })}
        {!left.length && !busy && (
          <button type="button" className="eng" onClick={reset} style={{ position: 'absolute', left: 36, bottom: 24, background: 'none', border: 0, cursor: 'pointer' }}>put them back</button>
        )}
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
      play={{ lede: 'Drag a photo, a link or a note onto the folder: it opens as you come over it, the thing goes into the pocket, and the flap swings shut. Try the colours.', node: <Play /> }}
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
