import * as React from 'react';
import { Folder, Region, Segmented, type FolderHue, type FolderPeek } from '@unlocalhosted/metalui';

/* ─────────────────────────────────────────────────────────
 * UNFOLD AND FOLD · one container, two states (a container transform)
 *
 * Unfold (double-click the folder, or Enter)
 *    0ms   the flap opens and the cards rise out of the pocket (the folder's open pose)
 *  200ms   the region opens out of the folder's footprint: a rounded clip grows from the
 *          folder's back panel to the full region on the surface spring (no overshoot, so
 *          the edge never wobbles), never stretched
 *  200ms   the folder fades into it (220 ms)
 *  280ms   the cards follow the opening region: each leaves its place in the fan for its
 *          place in the region, straightening as it goes, back card first, 60 ms apart
 *          (object spring: they land with a small overshoot)
 *  540ms   the region's head fades in: name, what it is, the count
 *
 * Fold (fold ↑ in the head)
 *    0ms   the head fades out (140 ms)
 *   60ms   the cards fly back to their places in the fan, front card first (object spring);
 *  140ms   the region closes back into the folder's footprint behind them (surface spring)
 *  ~560ms  the folder fades in under the arriving cards (200 ms)
 *  ~900ms  they are the folder's cards again; the flap swings shut
 *
 * Nothing mounts mid-motion: the region and the loose cards are always there, invisible, so
 * every move starts on its first frame; each card is measured where it is and lands exactly
 * where it goes, so it is the same object the whole way.
 * ───────────────────────────────────────────────────────── */

const TIMING = { flap: 200, region: 640, card: 620, cardLag: 80, stagger: 60, fade: 220, head: 300, headDelay: 340, foldHead: 140, foldCards: 60 };
const REGION = { x: 24, y: 24, w: 600, h: 300, head: 44, pad: 18, gap: 14, cw: 114, ch: 148, radius: 26 };

const ITEMS: (FolderPeek & { id: string })[] = [
  { id: 'a', thumb: 'linear-gradient(135deg,#F2A56B,#E0673C 60%,#9E3B25)' },
  { id: 'b', thumb: 'radial-gradient(60% 60% at 30% 30%,#7FA8FF,#2B3F8F)', link: true },
  { id: 'c', thumb: 'linear-gradient(160deg,#3D4B45,#1E2623),radial-gradient(40% 40% at 70% 30%,#9FE3BF,transparent)' },
  { id: 'd', thumb: 'linear-gradient(135deg,#F7D774,#D99A1E 55%,#8C5A12)' },
];

const cssVar = (name: string, fallback: string) => (typeof window === 'undefined' ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);
/** Cards land on the table: the object spring. */
const spring = () => cssVar('--mu-spring-object', 'ease-out');
/** The region is a surface opening: the surface spring, no overshoot, so its edge never wobbles. */
const surface = () => cssVar('--mu-spring-surface', 'ease-out');
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
  const folderWrap = React.useRef<HTMLDivElement>(null);
  const folder = React.useRef<HTMLDivElement>(null);
  const region = React.useRef<HTMLDivElement>(null);
  const loose = React.useRef<Record<string, HTMLDivElement | null>>({});
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const origin = () => box.current!.getBoundingClientRect();
  const fanCards = () => ITEMS.map((it) => folder.current!.querySelector<HTMLElement>(`[data-card="${it.id}"]`)!);
  /** The transform that puts a region-slot card exactly over its fan card (centre and lean). */
  const overFan = (i: number) => {
    const o = origin(), fan = fanCards()[i], r = fan.getBoundingClientRect(), s = slotIn(i);
    const dx = r.left + r.width / 2 - o.left - (s.x + REGION.cw / 2), dy = r.top + r.height / 2 - o.top - (s.y + REGION.ch / 2);
    return `translate(${dx}px, ${dy}px) rotate(${leanOf(fan)}deg)`;
  };
  /** The region clipped down to the folder's back panel. */
  const clipToFolder = () => {
    const o = origin(), f = folder.current!.querySelector('.folder-back')!.getBoundingClientRect();
    const top = f.top - o.top - REGION.y, left = f.left - o.left - REGION.x;
    return `inset(${top}px ${REGION.w - left - f.width}px ${REGION.h - top - f.height}px ${left}px round ${REGION.radius}px)`;
  };
  const clipFull = `inset(0px 0px 0px 0px round ${REGION.radius}px)`;
  const head = () => region.current!.querySelector<HTMLElement>('.mu-region-head');
  const setFanHidden = (hidden: boolean) => fanCards().forEach((c) => { c.style.visibility = hidden ? 'hidden' : ''; });

  const unfold = async () => {
    if (state !== 'folded') return;
    setState('moving');
    setOpen(true);
    await sleep(reduce() ? 0 : TIMING.flap);
    const starts = ITEMS.map((_, i) => overFan(i));
    const from = clipToFolder();
    const r = region.current!, h = head();
    const opts = (extra: KeyframeAnimationOptions = {}) => ({ easing: spring(), fill: 'forwards' as FillMode, ...extra });
    if (reduce()) {
      r.style.opacity = '1'; r.style.clipPath = clipFull; if (h) h.style.opacity = '1';
      ITEMS.forEach((it) => { loose.current[it.id]!.style.opacity = '1'; });
      setFanHidden(true); folderWrap.current!.style.opacity = '0';
    } else {
      // Everything starts in this one task, so the first painted frame is the first frame of motion.
      if (h) h.style.opacity = '0';
      const all = [
        r.animate([{ opacity: 1, clipPath: from }, { opacity: 1, clipPath: clipFull }], { duration: TIMING.region, easing: surface(), fill: 'forwards' }),
        folderWrap.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: TIMING.fade, easing: 'ease-out', fill: 'forwards' }),
        ...ITEMS.map((it, i) => loose.current[it.id]!.animate(
          [{ opacity: 1, transform: starts[i] }, { opacity: 1, transform: 'none' }],
          opts({ duration: TIMING.card, delay: TIMING.cardLag + i * TIMING.stagger, fill: 'both' }),
        )),
      ];
      if (h) all.push(h.animate([{ opacity: 0 }, { opacity: 1 }], { duration: TIMING.head, delay: TIMING.headDelay, easing: 'ease-out', fill: 'forwards' }));
      setFanHidden(true);
      await Promise.all(all.map((a) => a.finished));
      all.forEach((a) => { a.commitStyles(); a.cancel(); });
    }
    // The folder stays open while hidden, so its fan slots are ready for the cards when it folds.
    setState('unfolded');
  };

  const fold = async () => {
    if (state !== 'unfolded') return;
    setState('moving');
    const ends = ITEMS.map((_, i) => overFan(i));
    const to = clipToFolder();
    const r = region.current!, h = head();
    const n = ITEMS.length;
    const opts = (extra: KeyframeAnimationOptions = {}) => ({ easing: spring(), fill: 'forwards' as FillMode, ...extra });
    if (reduce()) {
      r.style.opacity = '0'; ITEMS.forEach((it) => { loose.current[it.id]!.style.opacity = '0'; });
      folderWrap.current!.style.opacity = '1'; setFanHidden(false);
    } else {
      const all: Animation[] = [];
      if (h) all.push(h.animate([{ opacity: 1 }, { opacity: 0 }], { duration: TIMING.foldHead, easing: 'ease-in', fill: 'forwards' }));
      all.push(r.animate([{ clipPath: clipFull, opacity: 1 }, { clipPath: to, opacity: 1 }], { duration: TIMING.region, delay: TIMING.foldCards + TIMING.cardLag, easing: surface(), fill: 'forwards' }));
      all.push(...ITEMS.map((it, i) => loose.current[it.id]!.animate(
        [{ transform: 'none', opacity: 1 }, { transform: ends[i], opacity: 1 }],
        opts({ duration: TIMING.card, delay: TIMING.foldCards + (n - 1 - i) * TIMING.stagger }),
      )));
      // The folder fades in under the arriving cards, before they land.
      all.push(folderWrap.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: TIMING.foldCards + TIMING.card - 120, easing: 'ease-out', fill: 'forwards' }));
      await Promise.all(all.map((a) => a.finished));
      // Hand the cards back to the folder in one frame: same place, same lean.
      setFanHidden(false);
      ITEMS.forEach((it) => { const el = loose.current[it.id]!; el.getAnimations().forEach((a) => a.cancel()); el.style.opacity = '0'; });
      all.forEach((a) => { a.commitStyles(); a.cancel(); });
      r.style.opacity = '0';
    }
    setOpen(false);
    setLanded((k) => k + 1);
    setState('folded');
  };

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div ref={box} className="snap-canvas" style={{ height: 360 }}>
        {/* Always mounted; invisible until it unfolds. */}
        <div ref={region} style={{ position: 'absolute', left: REGION.x, top: REGION.y, width: REGION.w, height: REGION.h, opacity: 0, pointerEvents: state === 'unfolded' ? 'auto' : 'none' }}>
          <Region name="poster refs" rule={`Folder · ${ITEMS.length} blocks`} count={ITEMS.length} width={REGION.w} height={REGION.h} hue={hue} />
          <button type="button" className="eng" onClick={fold} disabled={state !== 'unfolded'} style={{ position: 'absolute', right: 18, top: 14, background: 'none', border: 0, cursor: 'pointer', opacity: state === 'unfolded' ? 1 : 0, transition: 'opacity .2s ease' }}>fold ↑</button>
        </div>
        {ITEMS.map((it, i) => {
          const s = slotIn(i);
          return (
            <div key={it.id} ref={(el) => { loose.current[it.id] = el; }} style={{ position: 'absolute', left: s.x, top: s.y, zIndex: 5, opacity: 0, pointerEvents: 'none' }}>
              <Card peek={it} />
            </div>
          );
        })}
        <div ref={folderWrap} style={{ position: 'absolute', left: '50%', top: 80, translate: '-50% 0', pointerEvents: state === 'folded' ? 'auto' : 'none' }}>
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
