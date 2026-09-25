import * as React from 'react';
import { Folder, Region, Segmented, type FolderHue, type FolderPeek } from '@unlocalhosted/metalui';

/* ─────────────────────────────────────────────────────────
 * UNFOLD AND FOLD · one container, two states
 *
 * Unfold (double-click the folder, or Enter)
 *    0ms   the flap opens and the cards rise out of the pocket (the folder's open pose)
 *  160ms   the folder's footprint grows into the region, washed in the folder's colour
 *          (object spring); the folder itself fades as the region takes its place
 *  220ms   each card leaves its place in the fan for its place in the region, straightening
 *          as it goes, back card first, 50 ms apart (object spring)
 *  ~900ms  the region's head reads the name and the count
 *
 * Fold (the fold button in the head)
 *    0ms   the cards fly back to their places in the fan, front card first; the region
 *          shrinks back into the folder's footprint
 *  ~700ms  they are the folder's cards again; the flap swings shut
 * Nothing is swapped mid-flight: each card is measured where it is and lands exactly where it
 * goes, so it is the same object the whole way.
 * ───────────────────────────────────────────────────────── */

const TIMING = { open: 160, card: 520, stagger: 50, region: 560 };
const REGION = { x: 24, y: 24, w: 600, h: 300, head: 44, pad: 18, gap: 14, cw: 114, ch: 148 };

const ITEMS: (FolderPeek & { id: string })[] = [
  { id: 'a', thumb: 'linear-gradient(135deg,#F2A56B,#E0673C 60%,#9E3B25)' },
  { id: 'b', thumb: 'radial-gradient(60% 60% at 30% 30%,#7FA8FF,#2B3F8F)', link: true },
  { id: 'c', thumb: 'linear-gradient(160deg,#3D4B45,#1E2623),radial-gradient(40% 40% at 70% 30%,#9FE3BF,transparent)' },
  { id: 'd', thumb: 'linear-gradient(135deg,#F7D774,#D99A1E 55%,#8C5A12)' },
];

const spring = () => (typeof window === 'undefined' ? 'ease-out' : getComputedStyle(document.documentElement).getPropertyValue('--mu-spring-object').trim() || 'ease-out');
const leanOf = (el: Element) => { const m = new DOMMatrix(getComputedStyle(el).transform); return (Math.atan2(m.b, m.a) * 180) / Math.PI; };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Where each card sits in the region, in canvas coordinates. */
function slotIn(i: number) {
  const perRow = Math.floor((REGION.w - REGION.pad * 2 + REGION.gap) / (REGION.cw + REGION.gap));
  const col = i % perRow, row = Math.floor(i / perRow);
  return { x: REGION.x + REGION.pad + col * (REGION.cw + REGION.gap), y: REGION.y + REGION.head + row * (REGION.ch + REGION.gap) };
}

function Card({ peek }: { peek: FolderPeek }) {
  return (
    <div className="folder-card" style={{ position: 'relative', left: 0, bottom: 'auto', transform: 'none', transition: 'none' }}>
      <div className="folder-thumb" style={{ background: peek.thumb }} />
      <i className="folder-line folder-line-lg" style={{ width: '70%' }} />
      <i className={peek.link ? 'folder-line folder-line-blue' : 'folder-line'} />
      <i className="folder-line" style={{ width: '60%' }} />
    </div>
  );
}

export function FolderUnfold() {
  const [hue, setHue] = React.useState<FolderHue>('violet');
  const [state, setState] = React.useState<'folded' | 'moving' | 'unfolded'>('folded');
  const [open, setOpen] = React.useState(false);
  const [landed, setLanded] = React.useState(0);
  const box = React.useRef<HTMLDivElement>(null);
  const folder = React.useRef<HTMLDivElement>(null);
  const region = React.useRef<HTMLDivElement>(null);
  const loose = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [showLoose, setShowLoose] = React.useState(false);
  const [showFolder, setShowFolder] = React.useState(true);
  const [showRegion, setShowRegion] = React.useState(false);
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const origin = () => box.current!.getBoundingClientRect();
  /** The transform that puts a region-slot card exactly over a fan card (centre and lean). */
  const fromFan = (id: string, i: number) => {
    const o = origin(), fan = folder.current!.querySelector(`[data-card="${id}"]`)!, r = fan.getBoundingClientRect(), s = slotIn(i);
    const dx = r.left + r.width / 2 - o.left - (s.x + REGION.cw / 2), dy = r.top + r.height / 2 - o.top - (s.y + REGION.ch / 2);
    return `translate(${dx}px, ${dy}px) rotate(${leanOf(fan)}deg)`;
  };
  /** The transform that puts the region over the folder's footprint. */
  const regionFromFolder = () => {
    const o = origin(), f = folder.current!.querySelector('.folder-back')!.getBoundingClientRect();
    const sx = f.width / REGION.w, sy = f.height / REGION.h;
    return `translate(${f.left - o.left - REGION.x}px, ${f.top - o.top - REGION.y}px) scale(${sx}, ${sy})`;
  };

  const unfold = async () => {
    if (state !== 'folded') return;
    setState('moving'); setOpen(true);
    await sleep(reduce() ? 0 : TIMING.open);
    const starts = ITEMS.map((it, i) => fromFan(it.id, i));
    const regionStart = regionFromFolder();
    setShowRegion(true); setShowLoose(true);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    setShowFolder(false);
    if (!reduce()) {
      const ease = spring();
      const reg = region.current!.animate([{ transform: regionStart, opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: TIMING.region, easing: ease, fill: 'backwards' });
      await Promise.all([reg.finished, ...ITEMS.map((it, i) => loose.current[it.id]!.animate(
        [{ transform: starts[i] }, { transform: 'none' }],
        { duration: TIMING.card, delay: i * TIMING.stagger, easing: ease, fill: 'backwards' },
      ).finished)]);
    }
    setState('unfolded'); setOpen(false);
  };

  const fold = async () => {
    if (state !== 'unfolded') return;
    setState('moving');
    // The folder comes back, open, so its fan slots can be measured and the cards land in them.
    setOpen(true); setShowFolder(true);
    folder.current!.style.visibility = 'hidden';
    await sleep(reduce() ? 0 : 60);
    const ends = ITEMS.map((it, i) => fromFan(it.id, i));
    const regionEnd = regionFromFolder();
    if (!reduce()) {
      const ease = spring(), n = ITEMS.length;
      await Promise.all([
        region.current!.animate([{ transform: 'none', opacity: 1 }, { transform: regionEnd, opacity: 0 }], { duration: TIMING.region, easing: ease, fill: 'forwards' }).finished,
        ...ITEMS.map((it, i) => loose.current[it.id]!.animate(
          [{ transform: 'none' }, { transform: ends[i] }],
          { duration: TIMING.card, delay: (n - 1 - i) * TIMING.stagger, easing: ease, fill: 'forwards' },
        ).finished),
      ]);
    }
    folder.current!.style.visibility = '';
    setShowLoose(false); setShowRegion(false);
    setOpen(false); setLanded((n) => n + 1); setState('folded');
  };

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div ref={box} className="snap-canvas" style={{ height: 360 }}>
        {showRegion && (
          <div ref={region} style={{ position: 'absolute', left: REGION.x, top: REGION.y, width: REGION.w, height: REGION.h, transformOrigin: '0 0' }}>
            <Region name="poster refs" rule={`Folder · ${ITEMS.length} blocks`} count={ITEMS.length} width={REGION.w} height={REGION.h} hue={hue} />
            {state === 'unfolded' && (
              <button type="button" className="eng" onClick={fold} style={{ position: 'absolute', right: 18, top: 14, background: 'none', border: 0, cursor: 'pointer' }}>fold ↑</button>
            )}
          </div>
        )}
        {showLoose && ITEMS.map((it, i) => {
          const s = slotIn(i);
          return (
            <div key={it.id} ref={(el) => { loose.current[it.id] = el; }} style={{ position: 'absolute', left: s.x, top: s.y, zIndex: 5 }}>
              <Card peek={it} />
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: '50%', top: 80, transform: 'translateX(-50%)', visibility: showFolder ? 'visible' : 'hidden', pointerEvents: state === 'folded' ? 'auto' : 'none' }}>
          <Folder ref={folder} name="poster refs" count={ITEMS.length} peeks={ITEMS} hue={hue} open={open} landed={landed} onUnfold={unfold} />
        </div>
        {state === 'folded' && <span className="eng ink-hint">double-click the folder to unfold it</span>}
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
