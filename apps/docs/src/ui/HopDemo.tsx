import * as React from 'react';
import { hop, Region, Surface, Switcher } from '@unlocalhosted/metalui';

/* ─────────────────────────────────────────────────────────
 * HOP (the Motion page): a thing changes place
 *
 *   rest    a card sits in one of two paper regions on the canvas
 *   click   it goes to the other region
 *             hop    along MetalUI's far hop: an arc that bows up, as if lifted and set down
 *             slide  straight across, same time and ease, for comparison
 *             while it is in the air the region it is heading for lights as a drop target;
 *             it settles when the card lands
 *   resize  the card is placed again without motion
 * Reduce Motion: hop jumps; slide jumps.
 * ───────────────────────────────────────────────────────── */

type Way = 'hop' | 'slide';

export function HopDemo() {
  const [way, setWay] = React.useState<Way>('hop');
  const [side, setSide] = React.useState<0 | 1>(0);
  const [over, setOver] = React.useState<0 | 1 | null>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const card = React.useRef<HTMLButtonElement>(null);
  const regions = [React.useRef<HTMLDivElement>(null), React.useRef<HTMLDivElement>(null)];
  const at = React.useRef<{ x: number; y: number } | null>(null);
  const run = React.useRef<Animation | null>(null);

  // Where the card rests in region i: centred in its body, below the head.
  const spot = (i: 0 | 1) => {
    const b = box.current!.getBoundingClientRect(), r = regions[i].current!.getBoundingClientRect(), c = card.current!.getBoundingClientRect();
    return { x: r.left - b.left + (r.width - c.width) / 2, y: r.top - b.top + (r.height - c.height) / 2 + 10 };
  };
  const put = (p: { x: number; y: number }) => { run.current?.cancel(); run.current = null; card.current!.style.transform = `translate(${p.x}px, ${p.y}px)`; at.current = p; };

  const sideNow = React.useRef(side);
  sideNow.current = side;
  React.useLayoutEffect(() => {
    const place = () => put(spot(sideNow.current));
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = () => {
    const next = side === 0 ? 1 : 0;
    const from = at.current ?? spot(side), to = spot(next);
    put(from);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const a = way === 'hop'
      ? hop(card.current!, from, to, { side: 'up', reach: 'far' })
      : card.current!.animate(
          [{ transform: `translate(${from.x}px, ${from.y}px)` }, { transform: `translate(${to.x}px, ${to.y}px)` }],
          { duration: reduced ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-motion-hop-duration')) || 250, easing: 'ease-out', fill: 'forwards' },
        );
    run.current = a;
    at.current = to;
    a.onfinish = () => { if (run.current === a) { put(to); setOver(null); } };
    setOver(next);
    setSide(next);
  };

  return (
    <div className="flex w-full flex-col items-center gap-20">
      <Switcher aria-label="How it moves" size="compact" value={way} onValueChange={setWay} options={[{ value: 'hop', label: 'Hop' }, { value: 'slide', label: 'Slide' }]} />
      <div ref={box} className="relative flex items-start gap-48">
        <div ref={regions[0]}><Region name="To do" rule="makes tasks" over={over === 0} width={220} height={150} /></div>
        <div ref={regions[1]}><Region name="Done" rule="marks tasks done" over={over === 1} width={220} height={150} /></div>
        <button ref={card} type="button" onClick={move} aria-label={`Move the card to ${side === 0 ? 'Done' : 'To do'}`} className="absolute left-0 top-0 cursor-pointer rounded-card border-0 bg-transparent p-0 outline-none focus-visible:focus-ring">
          <Surface material="raise" radius="card" className="px-16 py-10 type-ui text-ink">send the poster</Surface>
        </button>
      </div>
    </div>
  );
}
