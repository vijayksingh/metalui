import * as React from 'react';
import { Folder, Region, Segmented, Well, type FolderHue, type FolderPeek } from '@unlocalhosted/metalui';

/* ─────────────────────────────────────────────────────────
 * FOLD AND UNFOLD · the region is a sheet of paper that folds into the folder
 *
 * The sheet is three layers: the back two thirds (the region's surface), the cards (above the
 * fold line, so they end up in the pocket), and the bottom third on a hinge at the fold line,
 * a two-sided flap: the region's surface inside, the folder's glass flap outside.
 *
 * Fold (fold ↑ in the head)
 *    0ms   the head fades (140 ms); then the region is the sheet (same surface, same place)
 *  140ms   the bottom third folds up in front along the fold line (hinge spring): two thirds
 *          behind, one third in front
 *  500ms   the cards fly to their places in the fan, front card first, 60 ms apart (object
 *          spring), the same flight as before
 *  660ms   the folded sheet shrinks to the folder: the back to its back panel, the flap to its
 *          flap, together, on one surface spring, so both arrive at the same moment
 *  ~1100ms the folder fades in over the sheet (identical shapes), then the sheet is gone
 *
 * Unfold (double-click the folder, or Enter): the same, reversed
 *    0ms   the folder fades into the folded sheet (identical shapes)
 *    0ms   the folded sheet grows to region size: back and flap together (surface spring)
 *  120ms   the cards leave the fan for their places, back card first
 *  480ms   the bottom third swings down along the fold line (hinge spring)
 *  ~1050ms the sheet is the region; its head fades in
 *
 * Nothing mounts mid-motion; every layer is measured where it is and lands where it goes.
 * ───────────────────────────────────────────────────────── */

const TIMING = { head: 140, fold: 560, foldAt: 0, cardsAt: 360, card: 620, stagger: 60, shrinkAt: 520, shrink: 560, fade: 180, grow: 560, unfoldAt: 480, cardsOutAt: 120 };
const REGION = { x: 24, y: 24, w: 600, h: 300, head: 38, pad: 18, gap: 14, cw: 114, ch: 148, radius: 26 };
const FOLD = REGION.h * (2 / 3);          // the fold line, a third from the bottom
const STRIP = REGION.h - FOLD;            // the bottom third

const ITEMS: (FolderPeek & { id: string })[] = [
  { id: 'a', thumb: 'linear-gradient(135deg,#F2A56B,#E0673C 60%,#9E3B25)' },
  { id: 'b', thumb: 'radial-gradient(60% 60% at 30% 30%,#7FA8FF,#2B3F8F)', link: true },
  { id: 'c', thumb: 'linear-gradient(160deg,#3D4B45,#1E2623),radial-gradient(40% 40% at 70% 30%,#9FE3BF,transparent)' },
  { id: 'd', thumb: 'linear-gradient(135deg,#F7D774,#D99A1E 55%,#8C5A12)' },
];

const cssVar = (name: string, fallback: string) => (typeof window === 'undefined' ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);
const objectSpring = () => cssVar('--mu-spring-object', 'ease-out');
const surfaceSpring = () => cssVar('--mu-spring-surface', 'ease-out');
const hingeSpring = () => cssVar('--mu-spring-hinge', 'ease-out');
const leanOf = (el: Element) => { const m = new DOMMatrix(getComputedStyle(el).transform); return (Math.atan2(m.b, m.a) * 180) / Math.PI; };

/** Where each card sits in the region: in the top two thirds, above the fold line. */
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
  const [landed, setLanded] = React.useState(0);
  const box = React.useRef<HTMLDivElement>(null);
  const folderWrap = React.useRef<HTMLDivElement>(null);
  const folder = React.useRef<HTMLDivElement>(null);
  const region = React.useRef<HTMLDivElement>(null);
  const back = React.useRef<HTMLDivElement>(null);      // the sheet's back two thirds
  const hinge = React.useRef<HTMLDivElement>(null);     // the bottom third's frame (moves, scales)
  const strip = React.useRef<HTMLDivElement>(null);     // the bottom third itself (rotates on the fold line)
  const loose = React.useRef<Record<string, HTMLDivElement | null>>({});
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const origin = () => box.current!.getBoundingClientRect();
  const local = (r: DOMRect) => { const o = origin(); return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height }; };
  const fanCard = (id: string) => folder.current!.querySelector<HTMLElement>(`[data-card="${id}"]`)!;
  /** Puts a region-slot card exactly over its fan card (centre and lean). */
  const overFan = (i: number) => {
    const fan = fanCard(ITEMS[i].id), r = local(fan.getBoundingClientRect()), s = slotIn(i);
    return `translate(${r.x + r.w / 2 - (s.x + REGION.cw / 2)}px, ${r.y + r.h / 2 - (s.y + REGION.ch / 2)}px) rotate(${leanOf(fan)}deg)`;
  };
  /** The back two thirds, clipped to the folder's back panel (in the back layer's own coordinates). */
  const backOnFolder = () => {
    const f = local(folder.current!.querySelector('.folder-back')!.getBoundingClientRect());
    const top = f.y - REGION.y, left = f.x - REGION.x;
    return `inset(${top}px ${REGION.w - left - f.w}px ${REGION.h - top - f.h}px ${left}px round ${REGION.radius}px)`;
  };
  // At rest the back layer shows only the top two thirds; it is region-tall so it can reach the folder's panel.
  const backFull = `inset(0px 0px ${STRIP}px 0px round ${REGION.radius}px ${REGION.radius}px 0px 0px)`;
  /** The hinge frame moved and scaled so the folded third lies exactly over the folder's flap. */
  const hingeOnFlap = () => {
    const f = local(folder.current!.querySelector('.folder-flap')!.getBoundingClientRect());
    const sx = f.w / REGION.w, sy = f.h / STRIP;
    // Folded, the third lies above the fold line: its top-left is the frame's (0, -STRIP).
    return `translate(${f.x - REGION.x}px, ${f.y - (REGION.y + FOLD) + STRIP * sy}px) scale(${sx}, ${sy})`;
  };
  const head = () => region.current!.querySelector<HTMLElement>('.mu-region-head');
  const fanHidden = (hidden: boolean) => ITEMS.forEach((it) => { fanCard(it.id).style.visibility = hidden ? 'hidden' : ''; });
  const sheet = (visible: boolean) => [back.current!, hinge.current!].forEach((el) => { el.style.opacity = visible ? '1' : '0'; });
  const settle = async (all: Animation[]) => { await Promise.all(all.map((a) => a.finished)); all.forEach((a) => { try { a.commitStyles(); } catch { /* removed */ } a.cancel(); }); };

  const fold = async () => {
    if (state !== 'unfolded') return;
    setState('moving');
    const ends = ITEMS.map((_, i) => overFan(i));
    const n = ITEMS.length, h = head();
    // The head fades on the region first; then the region becomes the sheet in one frame (same surface, same place).
    if (h && !reduce()) await h.animate([{ opacity: 1 }, { opacity: 0 }], { duration: TIMING.head, easing: 'ease-in', fill: 'forwards' }).finished;
    back.current!.style.clipPath = backFull; hinge.current!.style.transform = 'none'; strip.current!.style.transform = 'rotateX(0deg)';
    sheet(true); region.current!.style.opacity = '0';
    if (reduce()) {
      sheet(false); ITEMS.forEach((it) => { loose.current[it.id]!.style.opacity = '0'; });
      folderWrap.current!.style.opacity = '1'; fanHidden(false);
    } else {
      const all: Animation[] = [];
      all.push(strip.current!.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(180deg)' }], { duration: TIMING.fold, delay: TIMING.foldAt, easing: hingeSpring(), fill: 'forwards' }));
      all.push(back.current!.animate([{ clipPath: backFull }, { clipPath: backOnFolder() }], { duration: TIMING.shrink, delay: TIMING.shrinkAt, easing: surfaceSpring(), fill: 'forwards' }));
      all.push(hinge.current!.animate([{ transform: 'none' }, { transform: hingeOnFlap() }], { duration: TIMING.shrink, delay: TIMING.shrinkAt, easing: surfaceSpring(), fill: 'forwards' }));
      all.push(...ITEMS.map((it, i) => loose.current[it.id]!.animate(
        [{ transform: 'none', opacity: 1 }, { transform: ends[i], opacity: 1 }],
        { duration: TIMING.card, delay: TIMING.cardsAt + (n - 1 - i) * TIMING.stagger, easing: objectSpring(), fill: 'forwards' },
      )));
      // The folder fades in over the sheet as they meet: identical shapes, so it reads as one thing.
      all.push(folderWrap.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: TIMING.fade, delay: TIMING.shrinkAt + TIMING.shrink - TIMING.fade, easing: 'ease-out', fill: 'forwards' }));
      await settle(all);
      fanHidden(false);
      ITEMS.forEach((it) => { loose.current[it.id]!.style.opacity = '0'; loose.current[it.id]!.style.transform = ''; });
      sheet(false);
    }
    setLanded((k) => k + 1);
    setState('folded');
  };

  const unfold = async () => {
    if (state !== 'folded') return;
    setState('moving');
    const starts = ITEMS.map((_, i) => overFan(i));
    const h = head();
    // The folder becomes the folded sheet in one frame: identical shapes.
    back.current!.style.clipPath = backOnFolder(); hinge.current!.style.transform = hingeOnFlap(); strip.current!.style.transform = 'rotateX(180deg)';
    if (reduce()) {
      region.current!.style.opacity = '1'; if (h) h.style.opacity = '1';
      ITEMS.forEach((it) => { loose.current[it.id]!.style.opacity = '1'; });
      fanHidden(true); folderWrap.current!.style.opacity = '0';
      setState('unfolded');
      return;
    }
    if (h) h.style.opacity = '0';
    sheet(true); fanHidden(true);
    const all: Animation[] = [
      folderWrap.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: TIMING.fade, easing: 'ease-out', fill: 'forwards' }),
      back.current!.animate([{ clipPath: backOnFolder() }, { clipPath: backFull }], { duration: TIMING.grow, easing: surfaceSpring(), fill: 'forwards' }),
      hinge.current!.animate([{ transform: hingeOnFlap() }, { transform: 'none' }], { duration: TIMING.grow, easing: surfaceSpring(), fill: 'forwards' }),
      strip.current!.animate([{ transform: 'rotateX(180deg)' }, { transform: 'rotateX(0deg)' }], { duration: TIMING.fold, delay: TIMING.unfoldAt, easing: hingeSpring(), fill: 'forwards' }),
      ...ITEMS.map((it, i) => loose.current[it.id]!.animate(
        [{ opacity: 1, transform: starts[i] }, { opacity: 1, transform: 'none' }],
        { duration: TIMING.card, delay: TIMING.cardsOutAt + i * TIMING.stagger, easing: objectSpring(), fill: 'both' },
      )),
    ];
    await settle(all);
    // The flat sheet is the region: same surface, same place; its head fades in.
    region.current!.style.opacity = '1'; sheet(false);
    if (h) await h.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out', fill: 'forwards' }).finished;
    setState('unfolded');
  };

  const tint = { hue } as const;
  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div ref={box} className="snap-canvas" style={{ height: 360 }}>
        {/* The region at rest. Always mounted; shown only when unfolded. */}
        <div ref={region} style={{ position: 'absolute', left: REGION.x, top: REGION.y, width: REGION.w, height: REGION.h, opacity: 0, zIndex: 1, pointerEvents: state === 'unfolded' ? 'auto' : 'none' }}>
          <Region name="poster refs" rule={`Folder · ${ITEMS.length} blocks`} count={ITEMS.length} width={REGION.w} height={REGION.h} {...tint} />
          <button type="button" className="eng" onClick={fold} disabled={state !== 'unfolded'} style={{ position: 'absolute', right: 18, top: 14, background: 'none', border: 0, cursor: 'pointer', opacity: state === 'unfolded' ? 1 : 0, transition: 'opacity .2s ease' }}>fold ↑</button>
        </div>

        {/* The sheet's back two thirds: behind the cards. */}
        <div ref={back} style={{ position: 'absolute', left: REGION.x, top: REGION.y, width: REGION.w, height: REGION.h, opacity: 0, zIndex: 2, pointerEvents: 'none' }}>
          <Well variant="region" radius="region" {...tint} style={{ position: 'absolute', inset: 0 }} />
        </div>

        {/* The cards: between the back and the folding third, so the fold goes in front of them. */}
        {ITEMS.map((it, i) => {
          const s = slotIn(i);
          return (
            <div key={it.id} ref={(el) => { loose.current[it.id] = el; }} style={{ position: 'absolute', left: s.x, top: s.y, zIndex: 3, opacity: 0, pointerEvents: 'none' }}>
              <Card peek={it} />
            </div>
          );
        })}

        {/* The bottom third, on a hinge at the fold line: the region inside, the folder's flap outside. */}
        <div ref={hinge} style={{ position: 'absolute', left: REGION.x, top: REGION.y + FOLD, width: REGION.w, height: STRIP, opacity: 0, zIndex: 4, pointerEvents: 'none', transformOrigin: '0 0', perspective: 1400 }}>
          <div ref={strip} style={{ position: 'absolute', inset: 0, transformOrigin: '50% 0', transformStyle: 'preserve-3d' }}>
            <Well variant="region" radius="region" {...tint} style={{ position: 'absolute', inset: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} />
            <div
              className="folder"
              data-hue={hue}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'default', transform: 'rotateX(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: `0 0 ${REGION.radius}px ${REGION.radius}px`, overflow: 'hidden' }}
            >
              <div className="folder-sheet-face" style={{ position: 'absolute', inset: 0, background: 'color-mix(in srgb, var(--mu-folder-top) 55%, var(--mu-r-folder-flap-lift))', opacity: 0.94, boxShadow: 'inset 0 1px 0 var(--mu-r-folder-shape-light), inset 0 0 0 1px var(--mu-r-folder-shape-edge)' }} />
            </div>
          </div>
        </div>

        <div ref={folderWrap} style={{ position: 'absolute', left: '50%', top: 80, translate: '-50% 0', zIndex: 5, pointerEvents: state === 'folded' ? 'auto' : 'none' }}>
          <Folder ref={folder} name="poster refs" count={ITEMS.length} peeks={ITEMS} hue={hue} landed={landed} onUnfold={unfold} />
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
