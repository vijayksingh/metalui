import * as React from 'react';
import { flushSync } from 'react-dom';
import { DialTimeline, useDialTimeline } from 'dialkit';
import 'dialkit/styles.css';
import { Folder, Region, Segmented, Well, type FolderHue, type FolderPeek } from '@unlocalhosted/metalui';

/* ─────────────────────────────────────────────────────────
 * FOLD AND UNFOLD · the region is a sheet that folds into the folder
 *
 * Fold is one DialKit timeline: every layer is a pure function of the playhead; scrub it in the
 * dock, or play it at ½× or ¼× to see every in-between.
 *
 * Unfold keeps the owner's preferred motion (a container transform), not the fold reversed:
 *    0ms   the flap opens and the cards rise out of the pocket (the folder's open pose)
 *  200ms   the region opens out of the folder's footprint: a rounded clip grows to the full
 *          region on the surface spring (no stretch, no wobble); the folder fades into it
 *  280ms   the cards follow: each leaves its place in the fan for its place in the region,
 *          straightening as it goes, back card first, 60 ms apart (object spring)
 *  540ms   the region's head fades in
 * When it ends, the timeline is put back at its start (the unfolded state), ready to fold.
 *
 *   0.00s  head      the region's head fades (0.14 s)
 *   0.14s  sheet     the region becomes the sheet: the same surface, the same place
 *   0.14s  fold      the bottom third folds up in front along a line a third from the bottom
 *                    (hinge spring), and on to the folder flap's lean (-15°)
 *   0.20s  cards     each card flies to its place in the folder's fan, front card first,
 *                    50 ms apart (object spring)
 *   0.30s  material  the region's sunk surface gives way to the folder's materials: the back
 *                    becomes translucent paper, the flap is frosted glass (0.5 s)
 *   0.45s  shrink    back and flap shrink together onto the folder's own outline: the tab
 *                    rises, the pocket tapers; one ease-out for both (0.8 s), landing exactly,
 *                    so they arrive together and nothing is left to jump
 *   1.60s  handoff   every layer now matches the folder exactly (the flap's spring has settled
 *                    at the folder's -15° lean); it takes over
 *
 * Nothing mounts mid-motion; the sheet's outline is generated from the same numbers as the
 * folder's (220 wide, back 150 + a 16 tab, tapering 10, flap 106 tapering 12, radius 26).
 * ───────────────────────────────────────────────────────── */

const R = { x: 24, y: 24, w: 600, h: 300, head: 38, pad: 18, gap: 14, cw: 114, ch: 148, radius: 26 };
const FOLD = R.h * (2 / 3);                       // the fold line, a third from the bottom
const STRIP = R.h - FOLD;                         // the bottom third
const FOLDER = { w: 220, back: 150, rise: 16, tab: 92, backTaper: 10, flap: 106, flapTaper: 12, lean: 15, top: 80 };
const ANGLE_END = 180 + FOLDER.lean;              // flat in front, then leaning back like the folder's flap

const ITEMS: (FolderPeek & { id: string })[] = [
  { id: 'a', thumb: 'linear-gradient(135deg,#F2A56B,#E0673C 60%,#9E3B25)' },
  { id: 'b', thumb: 'radial-gradient(60% 60% at 30% 30%,#7FA8FF,#2B3F8F)', link: true },
  { id: 'c', thumb: 'linear-gradient(160deg,#3D4B45,#1E2623),radial-gradient(40% 40% at 70% 30%,#9FE3BF,transparent)' },
  { id: 'd', thumb: 'linear-gradient(135deg,#F7D774,#D99A1E 55%,#8C5A12)' },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => +n.toFixed(2);

/** The back's outline: a rounded rectangle whose bottom tapers by d, with a tab of height rise on
 *  the left. At rise 0 and d 0 it is the plain region; at the folder's numbers it is the folder. */
function backPath(x: number, y: number, w: number, h: number, d: number, rise: number, tab: number, r: number) {
  const y0 = y + rise, y1 = y + rise + h, k = r / h, tr = Math.min(18, rise + 2);
  return `M${f2(x)} ${f2(y0 + r)}L${f2(x)} ${f2(y + tr)}Q${f2(x)} ${f2(y)} ${f2(x + tr)} ${f2(y)}H${f2(x + tab - 14)}C${f2(x + tab - 4)} ${f2(y)} ${f2(x + tab)} ${f2(y0)} ${f2(x + tab + 12)} ${f2(y0)}`
    + `H${f2(x + w - r)}Q${f2(x + w)} ${f2(y0)} ${f2(x + w - d * k)} ${f2(y0 + r)}L${f2(x + w - d + d * k)} ${f2(y1 - r)}Q${f2(x + w - d)} ${f2(y1)} ${f2(x + w - d - r)} ${f2(y1)}`
    + `H${f2(x + d + r)}Q${f2(x + d)} ${f2(y1)} ${f2(x + d - d * k)} ${f2(y1 - r)}Z`;
}
/** The flap's outside, in its own box (w × h), narrowing by d toward the bottom. It is drawn on the
 *  face that is turned over twice (the face's flip, then the fold), so it stands upright, a pocket
 *  tapering toward the bottom exactly like the folder's flap. */
function flapPath(w: number, h: number, d: number, r: number) {
  const k = r / h;
  return `M${f2(r)} 0H${f2(w - r)}Q${f2(w)} 0 ${f2(w - d * k)} ${f2(r)}L${f2(w - d + d * k)} ${f2(h - r)}Q${f2(w - d)} ${f2(h)} ${f2(w - d - r)} ${f2(h)}`
    + `H${f2(d + r)}Q${f2(d)} ${f2(h)} ${f2(d - d * k)} ${f2(h - r)}L${f2(d * k)} ${f2(r)}Q0 0 ${f2(r)} 0Z`;
}

/** Where each card sits in the region: in the top two thirds, above the fold line. */
function slotIn(i: number) {
  const perRow = Math.floor((R.w - R.pad * 2 + R.gap) / (R.cw + R.gap));
  const col = i % perRow, row = Math.floor(i / perRow);
  return { x: R.x + R.pad + col * (R.cw + R.gap), y: R.y + R.head + row * (R.ch + R.gap) };
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

type Rect = { x: number; y: number; w: number; h: number };
interface Fan { x: number; y: number; lean: number }

export function FolderUnfold() {
  const [hue, setHue] = React.useState<FolderHue>('violet');
  const [speed, setSpeed] = React.useState('1');
  const [open, setOpen] = React.useState(false);
  const [unfolding, setUnfolding] = React.useState(false);
  const regionEl = React.useRef<HTMLDivElement>(null);
  const folderWrap = React.useRef<HTMLDivElement>(null);
  const still = React.useRef<Record<string, HTMLDivElement | null>>({});
  const box = React.useRef<HTMLDivElement>(null);
  const folder = React.useRef<HTMLDivElement>(null);
  const [geo, setGeo] = React.useState<{ root: Rect; fans: Fan[] } | null>(null);

  // TODO(production): DialKit's clip.current values are the scrubbable authoring preview.
  // Replace them with equivalent real animations using the tuned timings and transitions,
  // then remove useDialTimeline and <DialTimeline />.
  const tl = useDialTimeline(
    'Folder fold',
    {
      head: { at: 0, duration: 0.14, from: { o: 1 }, to: { o: 0 }, transition: { type: 'easing', duration: 0.14, ease: [0.4, 0, 1, 1] } },
      sheet: { at: 0.14, duration: 0 },
      fold: { at: 0.14, from: { a: 0 }, to: { a: ANGLE_END }, transition: { type: 'spring', stiffness: 120, damping: 14 } },
      card0: { at: 0.35, from: { p: 0 }, to: { p: 1 }, transition: { type: 'spring', visualDuration: 0.5, bounce: 0.15 } },
      card1: { at: 0.3, from: { p: 0 }, to: { p: 1 }, transition: { type: 'spring', visualDuration: 0.5, bounce: 0.15 } },
      card2: { at: 0.25, from: { p: 0 }, to: { p: 1 }, transition: { type: 'spring', visualDuration: 0.5, bounce: 0.15 } },
      card3: { at: 0.2, from: { p: 0 }, to: { p: 1 }, transition: { type: 'spring', visualDuration: 0.5, bounce: 0.15 } },
      material: { at: 0.3, duration: 0.5, from: { m: 0 }, to: { m: 1 }, transition: { type: 'easing', duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
      // An ease-out that lands exactly at its end: no overshoot, no long tail, so the sheet is
      // exactly the folder's shape at the handoff.
      shrink: { at: 0.45, duration: 0.8, from: { s: 0 }, to: { s: 1 }, transition: { type: 'easing', duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
      // Long enough for the flap's hinge spring to settle before the folder takes over.
      duration: 1.6,
    },
    { id: 'folder-fold-v2', autoplay: false },
  );

  // The folder's own geometry at rest, measured once: where it sits and where its fan cards are.
  React.useLayoutEffect(() => {
    const measure = () => {
      if (!box.current || !folder.current) return;
      const o = box.current.getBoundingClientRect(), f = folder.current.getBoundingClientRect();
      const fans = ITEMS.map((it) => {
        const c = folder.current!.querySelector<HTMLElement>(`[data-card="${it.id}"]`)!, r = c.getBoundingClientRect();
        const mx = new DOMMatrix(getComputedStyle(c).transform);
        return { x: r.left + r.width / 2 - o.left, y: r.top + r.height / 2 - o.top, lean: (Math.atan2(mx.b, mx.a) * 180) / Math.PI };
      });
      setGeo({ root: { x: f.left - o.left, y: f.top - o.top, w: f.width, h: f.height }, fans });
    };
    measure();
    const t = window.setTimeout(measure, 1200); // after the fan's first settle
    return () => window.clearTimeout(t);
  }, []);

  // The playhead: forward folds, backward unfolds, at the chosen speed.
  const drive = React.useRef(0);
  const tlRef = React.useRef(tl);
  tlRef.current = tl;
  const play = (dir: 1 | -1) => {
    cancelAnimationFrame(drive.current);
    const end = tlRef.current.duration, rate = Number(speed);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { tlRef.current.seek(dir > 0 ? end : 0); return; }
    let t = tlRef.current.time, last = performance.now();
    const step = (now: number) => {
      t = Math.min(end, Math.max(0, t + ((now - last) / 1000) * rate * dir)); last = now;
      tlRef.current.seek(t);
      if ((dir > 0 && t < end) || (dir < 0 && t > 0)) drive.current = requestAnimationFrame(step);
    };
    drive.current = requestAnimationFrame(step);
  };
  React.useEffect(() => () => cancelAnimationFrame(drive.current), []);

  // The owner's unfold: the region opens out of the folder's footprint and the cards follow.
  const UNFOLD = { flap: 200, region: 640, card: 620, cardLag: 80, stagger: 60, fade: 220, head: 300, headDelay: 340 };
  const cssVar = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const unfold = async () => {
    if (unfolding || tlRef.current.time < tlRef.current.duration - 1e-3) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    flushSync(() => setOpen(true));
    await new Promise((r) => setTimeout(r, reduce ? 0 : UNFOLD.flap));
    const o = box.current!.getBoundingClientRect();
    // Each card starts exactly over its fan card (centre and lean), in the folder's open pose.
    const starts = ITEMS.map((it, i) => {
      const fan = folder.current!.querySelector<HTMLElement>(`[data-card="${it.id}"]`)!, r = fan.getBoundingClientRect(), sl = slotIn(i);
      const mx = new DOMMatrix(getComputedStyle(fan).transform);
      return `translate(${r.left + r.width / 2 - o.left - (sl.x + R.cw / 2)}px, ${r.top + r.height / 2 - o.top - (sl.y + R.ch / 2)}px) rotate(${(Math.atan2(mx.b, mx.a) * 180) / Math.PI}deg)`;
    });
    const f = folder.current!.querySelector('.folder-back')!.getBoundingClientRect();
    const top = f.top - o.top - R.y, left = f.left - o.left - R.x;
    const from = `inset(${top}px ${R.w - left - f.width}px ${R.h - top - f.height}px ${left}px round ${R.radius}px)`;
    const full = `inset(0px 0px 0px 0px round ${R.radius}px)`;
    flushSync(() => setUnfolding(true));
    const reg = regionEl.current!, head = reg.querySelector<HTMLElement>('.mu-region-head');
    const fanCards = ITEMS.map((it) => folder.current!.querySelector<HTMLElement>(`[data-card="${it.id}"]`)!);
    const all: Animation[] = [];
    if (!reduce) {
      // Everything starts in this one task, so the first painted frame is the first frame of motion.
      all.push(reg.animate([{ opacity: 1, clipPath: from }, { opacity: 1, clipPath: full }], { duration: UNFOLD.region, easing: cssVar('--mu-spring-surface', 'ease-out'), fill: 'forwards' }));
      all.push(folderWrap.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: UNFOLD.fade, easing: 'ease-out', fill: 'forwards' }));
      all.push(...ITEMS.map((it, i) => still.current[it.id]!.animate(
        [{ opacity: 1, transform: starts[i] }, { opacity: 1, transform: 'none' }],
        { duration: UNFOLD.card, delay: UNFOLD.cardLag + i * UNFOLD.stagger, easing: cssVar('--mu-spring-object', 'ease-out'), fill: 'both' },
      )));
      if (head) all.push(head.animate([{ opacity: 0 }, { opacity: 1 }], { duration: UNFOLD.head, delay: UNFOLD.headDelay, easing: 'ease-out', fill: 'both' }));
      fanCards.forEach((c) => { c.style.visibility = 'hidden'; });
      await Promise.all(all.map((a) => a.finished));
    }
    // The unfolded state is the timeline's start: hand over, then let go of the animations.
    flushSync(() => { tlRef.current.seek(0); setUnfolding(false); setOpen(false); });
    all.forEach((a) => a.cancel());
    fanCards.forEach((c) => { c.style.visibility = ''; });
  };

  // ── Everything below is a pure function of the playhead. ──
  const time = tl.time;
  const atStart = time <= 1e-3, atEnd = time >= tl.duration - 1e-3;
  const head = tl.head.current.o as number;
  const sheetOn = tl.sheet.started && !atEnd;
  const angle = tl.fold.current.a as number;
  const m = tl.material.current.m as number;
  const s = tl.shrink.current.s as number;

  // The back and the flap: from the region's two parts to the folder's two parts, together.
  const finalX = geo ? geo.root.x : R.x, finalY = geo ? geo.root.y + (geo.root.h - FOLDER.back - FOLDER.rise) : R.y;
  const backW = lerp(R.w, FOLDER.w, s), backH = lerp(FOLD, FOLDER.back, s);
  const rise = lerp(0, FOLDER.rise, s), taper = lerp(0, FOLDER.backTaper, s);
  const backX = lerp(R.x, finalX, s), backY = lerp(R.y, finalY, s);        // the top of the tab (the back's top at first)
  const foldY = backY + rise + backH;                                        // the fold line: the back's bottom
  const flapH = lerp(STRIP, FOLDER.flap, s), flapTaper = lerp(0, FOLDER.flapTaper, s);
  const backD = backPath(backX, backY, backW, backH, taper, rise, FOLDER.tab, R.radius);
  const flapD = flapPath(backW, flapH, flapTaper, R.radius);

  // Cards: from the region slot to the folder's fan.
  const cardP = [tl.card0.current.p, tl.card1.current.p, tl.card2.current.p, tl.card3.current.p] as number[];
  const cardStyle = (i: number): React.CSSProperties => {
    const from = slotIn(i), fan = geo?.fans[i];
    if (!fan) return { left: from.x, top: from.y };
    const p = cardP[i], cx = lerp(from.x + R.cw / 2, fan.x, p), cy = lerp(from.y + R.ch / 2, fan.y, p);
    return { left: cx - R.cw / 2, top: cy - R.ch / 2, transform: `rotate(${lerp(0, fan.lean, p)}deg)` };
  };

  const hueVars = { hue } as const;

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div ref={box} className="snap-canvas fold-demo" style={{ height: 360 }}>
        <style>{`.fold-demo .fold-region .mu-region-head{opacity:${head}}`}</style>

        {/* The region at rest (the playhead at 0 and through the head's fade). */}
        <div ref={regionEl} className="fold-region" style={{ position: 'absolute', left: R.x, top: R.y, width: R.w, height: R.h, zIndex: 1, opacity: unfolding ? 1 : sheetOn || atEnd ? 0 : 1, pointerEvents: atStart ? 'auto' : 'none' }}>
          <Region name="poster refs" rule={`Folder · ${ITEMS.length} blocks`} count={ITEMS.length} width={R.w} height={R.h} {...hueVars} />
          {atStart && (
            <button type="button" className="eng" onClick={() => play(1)} style={{ position: 'absolute', right: 18, top: 14, background: 'none', border: 0, cursor: 'pointer' }}>fold ↑</button>
          )}
        </div>
        {((!sheetOn && !atEnd) || unfolding) && (
          <div style={{ position: 'absolute', zIndex: 3, pointerEvents: 'none' }}>
            {ITEMS.map((it, i) => { const p = slotIn(i); return <div key={it.id} ref={(el) => { still.current[it.id] = el; }} style={{ position: 'absolute', left: p.x, top: p.y }}><Card peek={it} /></div>; })}
          </div>
        )}

        {/* The folder's shadow grows in with its materials, so nothing pops in at the handoff. */}
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 1, pointerEvents: 'none', opacity: sheetOn ? m : 0 }}>
          <defs><filter id="fold-shade" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="14" /></filter></defs>
          <path d={backD} transform="translate(0 14)" filter="url(#fold-shade)" style={{ fill: 'var(--mu-r-folder-shade-ink)' }} />
        </svg>

        {/* The sheet's back: the region's surface, becoming the folder's translucent paper. */}
        <div className="folder" data-hue={hue} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', perspective: 'none', cursor: 'default', zIndex: 2, pointerEvents: 'none', opacity: sheetOn ? 1 : 0, clipPath: `path('${backD}')` }}>
          {/* One continuous region surface, sliced: no crease at the fold. */}
          <div style={{ position: 'absolute', left: backX, top: backY + rise, width: backW, height: backH * (R.h / FOLD), opacity: 1 - m }}>
            <Well variant="region" radius="region" {...hueVars} style={{ position: 'absolute', inset: 0 }} />
          </div>
          <div style={{ position: 'absolute', left: backX, top: backY, width: backW, height: backH + rise, opacity: m, background: 'linear-gradient(180deg, color-mix(in srgb, var(--mu-folder-top) var(--mu-r-folder-shape-translucency), transparent), color-mix(in srgb, var(--mu-folder-bottom) var(--mu-r-folder-shape-translucency), transparent))' }} />
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', opacity: m }} aria-hidden>
            <path d={backD} fill="none" style={{ stroke: 'var(--mu-r-folder-shape-edge)', strokeWidth: 1 }} />
          </svg>
        </div>

        {/* The cards in motion: between the back and the flap, so the flap folds in front of them. */}
        {sheetOn && ITEMS.map((it, i) => (
          <div key={it.id} style={{ position: 'absolute', zIndex: 3, pointerEvents: 'none', transformOrigin: '50% 50%', ...cardStyle(i) }}>
            <Card peek={it} />
          </div>
        ))}

        {/* The flap: the bottom third on a hinge at the fold line. Inside, the region's surface
            (the same continuous surface as the back); outside, the folder's frosted glass. */}
        <div style={{ position: 'absolute', left: backX, top: foldY, width: backW, height: flapH, zIndex: 4, pointerEvents: 'none', opacity: sheetOn ? 1 : 0, perspective: 800 }}>
          <div className="folder" data-hue={hue} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', perspective: 'none', cursor: 'default', transformOrigin: '50% 0', transformStyle: 'preserve-3d', transform: `rotateX(${angle}deg)` }}>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden', borderRadius: `0 0 ${R.radius}px ${R.radius}px`, opacity: 1 - m }}>
              <div style={{ position: 'absolute', left: 0, top: -FOLD * (flapH / STRIP), width: '100%', height: R.h * (flapH / STRIP) }}>
                <Well variant="region" radius="region" {...hueVars} style={{ position: 'absolute', inset: 0 }} />
              </div>
            </div>
            <div style={{ position: 'absolute', inset: 0, transform: 'rotateX(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
              <div className="folder-frost" style={{ clipPath: `path('${flapD}')` }} />
              <svg className="folder-edge" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden>
                <path d={flapD} className="folder-flap-fill" />
                <path d={flapD} className="folder-edge-light" style={{ clipPath: `path('${flapD}')` }} />
                <path d={flapD} className="folder-edge-line" />
              </svg>
            </div>
          </div>
        </div>

        {/* The folder: it takes over only at the end, when every layer matches it exactly. */}
        <div ref={folderWrap} style={{ position: 'absolute', left: '50%', top: FOLDER.top, translate: '-50% 0', zIndex: 5, opacity: atEnd ? 1 : 0, pointerEvents: atEnd && !unfolding ? 'auto' : 'none' }}>
          <Folder ref={folder} name="poster refs" count={ITEMS.length} peeks={ITEMS} hue={hue} open={open} onUnfold={unfold} />
        </div>
        {atEnd && <span className="eng ink-hint">double-click the folder to unfold it</span>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-16">
        <Segmented size="compact" aria-label="Colour" value={hue} onValueChange={(v) => setHue(v as FolderHue)}
          options={(['neutral', 'red', 'amber', 'green', 'blue', 'violet'] as const).map((h) => ({ value: h, label: h[0].toUpperCase() + h.slice(1) }))} />
        <Segmented size="compact" aria-label="Speed" value={speed} onValueChange={setSpeed}
          options={[{ value: '1', label: '1×' }, { value: '0.5', label: '½×' }, { value: '0.25', label: '¼×' }]} />
      </div>
      <DialTimeline defaultOpen />
    </div>
  );
}
