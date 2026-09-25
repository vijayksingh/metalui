import * as React from 'react';
import { animate } from 'motion';
import { Connector, Kbd, Lasso, Led, PastBanner, Region, SearchField, SelectionFrame, SnapGuides, Surface, Swatch, Switch, Well } from '@unlocalhosted/metalui';

/* ─────────────────────────────────────────────────────────
 * WHERE DOES IT GO? (the layers page): the six tests, asked in order
 *
 *   pick      each thing is the real part, live; the picked one gets the selection frame,
 *             and the light starts at the first question
 *   ask       every 420 ms the light hops down one question: 250 ms ease-out along an arc that
 *             bows out min(.8, 14 / distance) of the way (about 7 px), counter-clockwise going
 *             down, clockwise going back up, like a bead jumping from stop to stop;
 *             the question it leaves is marked "no" in ink3
 *   answer    at the first yes it stops: the question and its layer light up in ink,
 *             "yes" with a live LED, and the reason appears under the rail
 *   repick    a new pick restarts from the top, from where the light is
 * Reduce Motion: the answer shows at once, every "no" already marked.
 * ───────────────────────────────────────────────────────── */

const QUESTIONS = [
  { layer: 'Foundations', q: 'Is it a value, not a shape?' },
  { layer: 'Parts', q: 'Is it only a piece of something bigger, with no job alone?' },
  { layer: 'Components', q: 'Do you operate it to change something else?' },
  { layer: 'Objects', q: 'Is it one thing with a body, standing for something of yours, that stays where you put it?' },
  { layer: 'Instruments', q: 'Does it show up only while you act, and leave when you stop?' },
  { layer: 'Places', q: 'Does it have area, and hold other things?' },
];

const THINGS = [
  { name: 'Ink colour', at: 0, why: 'A value. It has no shape until a part uses it.' },
  { name: 'Hinge spring', at: 0, why: 'A value: how fast a flap swings and how much it bounces.' },
  { name: 'Keycap', at: 1, why: 'It looks like a key you press, but it only shows a shortcut inside a menu row or a field. It has no job of its own.' },
  { name: 'Well', at: 1, why: 'The sunk shape fields and tracks are made from. Nothing uses a well alone.' },
  { name: 'Toggle', at: 2, why: 'You flip it to change a setting somewhere else.' },
  { name: 'Search field', at: 2, why: 'You type in it to change what a list shows.' },
  { name: 'Sticker', at: 3, why: 'It stands for something you made, and it stays where you put it.' },
  { name: 'Connector', at: 3, why: 'It joins two cards and is still there after you let go.' },
  { name: 'Lasso', at: 4, why: 'It exists while you drag. Let go and it is gone.' },
  { name: 'Snap guide', at: 4, why: 'It explains a snap while you move something, then leaves.' },
  { name: 'Region', at: 5, why: 'It has area, and you put cards in it. It is where they live.' },
  { name: 'Yesterday', at: 5, why: 'You go back to it and look around. It holds what was on the canvas that day.' },
];


/* A small object on the canvas, for the instruments to act on. */
const Block = ({ x, y, w = 34, h = 24 }: { x: number; y: number; w?: number; h?: number }) => (
  <Surface material="raise" radius="card" className="absolute" style={{ left: x, top: y, width: w, height: h, borderRadius: 7 }} />
);

/* A die-cut sticker: a drawing with a white border and a soft shadow, as it sits on the canvas. */
const Sticker = () => (
  <svg viewBox="0 0 64 64" width="58" height="58" aria-hidden style={{ filter: 'drop-shadow(0 2px 3px rgba(24,22,16,.18))' }}>
    <path d="M32 6l7 15 16 2-12 11 3 16-14-8-14 8 3-16L9 23l16-2z" fill="#F5BF55" stroke="#fff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
    <circle cx="27" cy="30" r="2" fill="#5C4210" /><circle cx="37" cy="30" r="2" fill="#5C4210" />
    <path d="M27 37q5 4 10 0" fill="none" stroke="#5C4210" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* A spring is a value: the curve it follows, and a dot that rides it. */
const Spring = () => (
  <svg viewBox="0 0 120 60" width="120" height="60" aria-hidden className="text-ink2">
    <line x1="6" y1="18" x2="114" y2="18" stroke="currentColor" strokeOpacity=".25" strokeDasharray="2 3" />
    <path d="M6 54 C 24 -8, 34 6, 46 22 S 64 12, 76 19 S 96 17, 114 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const scaled = (node: React.ReactNode, k: number) => <div style={{ transform: `scale(${k})` }}>{node}</div>;

const SPECIMENS: Record<string, () => React.ReactNode> = {
  'Ink colour': () => <Swatch hex="#3FB97A" label="green" />,
  'Hinge spring': () => <Spring />,
  Keycap: () => <span className="flex gap-4"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>,
  Well: () => <Well variant="field" radius="field" style={{ width: 110, height: 30 }} />,
  Toggle: () => <Switch aria-label="Snap to grid" defaultChecked />,
  'Search field': () => scaled(<SearchField placeholder="Search" tone="light" />, 0.8),
  Sticker: () => <Sticker />,
  Connector: () => (
    <div className="relative" style={{ width: 130, height: 70 }}>
      <Block x={4} y={6} /><Block x={92} y={40} />
      <Connector from={{ x: 38, y: 18, attached: true }} to={{ x: 92, y: 52, attached: true }} />
    </div>
  ),
  Lasso: () => (
    <div className="relative" style={{ width: 130, height: 76 }}>
      <Block x={22} y={20} /><Block x={68} y={36} />
      <Lasso rect={{ x: 12, y: 10, width: 100, height: 58 }} count={2} />
    </div>
  ),
  'Snap guide': () => (
    <div className="relative" style={{ width: 130, height: 76 }}>
      <Block x={30} y={6} /><Block x={30} y={46} w={50} />
      <SnapGuides guides={[{ axis: 'vertical', kind: 'edge', position: 30, start: 6, end: 70 }]} />
    </div>
  ),
  Region: () => <Region name="ideas" rule="folders" width={140} height={78} />,
  Yesterday: () => scaled(<PastBanner moment="Yesterday · 18:40" onBack={() => {}} />, 0.55),
};

const STEP = 420;
const LIGHT = 8;

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function LayerSorter() {
  const [pick, setPick] = React.useState<number | null>(null);
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (pick === null) return;
    const target = THINGS[pick].at;
    if (reduced()) { setStep(target); setDone(true); return; }
    setStep(0);
    setDone(false);
    let i = 0;
    const tick = () => {
      if (i === target) { setDone(true); return; }
      i += 1;
      setStep(i);
      timer = window.setTimeout(tick, STEP);
    };
    let timer = window.setTimeout(tick, STEP);
    return () => window.clearTimeout(timer);
  }, [pick]);

  // The light hops to the middle of the current row along a small arc; rows wrap on narrow
  // screens, so they are measured. First paint and resizes place it without motion.
  const rows = React.useRef<(HTMLLIElement | null)[]>([]);
  const light = React.useRef<HTMLSpanElement>(null);
  const lastY = React.useRef<number | null>(null);
  const hop = React.useRef<{ stop: () => void } | null>(null);
  const put = (x: number, y: number) => { if (light.current) light.current.style.transform = `translate(${x}px, ${y}px)`; };
  const yOf = (i: number) => { const r = rows.current[i]; return r ? r.offsetTop + r.offsetHeight / 2 - LIGHT / 2 : 0; };
  React.useLayoutEffect(() => {
    const snap = () => { hop.current?.stop(); const y = yOf(step); put(0, y); lastY.current = y; };
    snap();
    window.addEventListener('resize', snap);
    return () => window.removeEventListener('resize', snap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    const to = yOf(step), from = lastY.current ?? to, d = to - from;
    lastY.current = to;
    if (d === 0) return;
    hop.current?.stop();
    if (reduced()) { put(0, to); return; }
    // A quadratic arc: the middle point pushed sideways by strength × distance, to the left
    // going down (counter-clockwise) and to the right going up (clockwise).
    const bow = -Math.sign(d) * Math.min(0.8, 14 / Math.abs(d)) * Math.abs(d);
    hop.current = animate(0, 1, {
      duration: 0.25,
      ease: 'easeOut',
      onUpdate: (t) => put(2 * (1 - t) * t * bow, from + d * t),
      onComplete: () => put(0, to),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const thing = pick === null ? null : THINGS[pick];

  return (
    <div className="flex w-full flex-col gap-24">
      <div className="flex flex-col gap-12">
        <span className="type-label engraved">Pick a thing</span>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
          {THINGS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-pressed={pick === i}
              onClick={() => setPick(i)}
              className="relative flex h-[128px] cursor-pointer flex-col items-center justify-between rounded-plate border-0 bg-transparent px-8 pb-10 pt-12 outline-none tap-highlight-none focus-visible:focus-ring"
            >
              <span className="pointer-events-none grid flex-1 place-items-center">{SPECIMENS[t.name]()}</span>
              <span className={`type-label ${pick === i ? 'text-ink' : 'engraved'}`}>{t.name}</span>
              {pick === i && <SelectionFrame state="selected" variant="lite" radius={18} handles="none" readout={false} />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-16" aria-live="polite">
        <ol className="relative flex flex-col">
          <span aria-hidden className="absolute bottom-20 left-11 top-20 w-1 bg-[var(--mu-rule)]" />
          <span
            ref={light}
            aria-hidden
            className="absolute left-8 top-0 grid size-8 place-items-center transition-opacity duration-settle"
            style={{ opacity: pick === null ? 0 : 1 }}
          >
            <Led kind={done ? 'live' : 'waiting'} />
          </span>
          {QUESTIONS.map((q, i) => {
            const state = pick === null ? 'idle' : i < step ? 'no' : i === step ? (done ? 'yes' : 'asking') : 'idle';
            return (
              <li key={q.layer} ref={(el) => { rows.current[i] = el; }} data-state={state} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-12 py-10">
                <span />
                <span className={`type-doc-prose transition-colors duration-settle ${state === 'yes' || state === 'asking' ? 'text-ink' : state === 'no' ? 'text-ink3' : 'text-ink2'}`}>{q.q}</span>
                <span className="flex items-center gap-8">
                  <span className={`type-label engraved transition-opacity duration-settle ${state === 'no' || state === 'yes' ? 'opacity-100' : 'opacity-0'}`}>{state === 'yes' ? 'yes' : 'no'}</span>
                  <span className={`type-label ${state === 'yes' ? 'text-ink' : 'engraved'}`}>{q.layer}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="type-doc-prose min-h-[3lh] max-w-[56ch] text-ink2">
          {thing && done ? (
            <>
              <b className="text-ink">{thing.name} is {QUESTIONS[thing.at].layer === 'Places' ? 'a place' : QUESTIONS[thing.at].layer === 'Foundations' ? 'a foundation' : `in ${QUESTIONS[thing.at].layer}`}.</b> {thing.why}
            </>
          ) : thing ? (
            <>Asking the questions in order…</>
          ) : (
            <>Pick a thing above. The light asks the six questions in order and stops at the first yes.</>
          )}
        </p>
      </div>
    </div>
  );
}
