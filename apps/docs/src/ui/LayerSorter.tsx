import * as React from 'react';
import { Button, Led } from '@unlocalhosted/metalui';

/* ─────────────────────────────────────────────────────────
 * WHERE DOES IT GO? (the layers page): the six tests, asked in order
 *
 *   pick      a thing latches; the light starts at the first question
 *   ask       every 420 ms the light moves down one question on the settle spring;
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

const STEP = 420;

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

  // The light sits on the middle of the current row; rows wrap on narrow screens, so they are measured.
  const rows = React.useRef<(HTMLLIElement | null)[]>([]);
  const [y, setY] = React.useState(0);
  React.useLayoutEffect(() => {
    const place = () => { const r = rows.current[step]; if (r) setY(r.offsetTop + r.offsetHeight / 2); };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [step]);

  const thing = pick === null ? null : THINGS[pick];

  return (
    <div className="flex w-full flex-col gap-24">
      <div className="flex flex-col gap-12">
        <span className="type-label engraved">Pick a thing</span>
        <div className="flex flex-wrap gap-8">
          {THINGS.map((t, i) => (
            <Button key={t.name} size="compact" aria-pressed={pick === i} className="aria-pressed:recipe-button-compact-pressed aria-pressed:text-ink" onClick={() => setPick(i)}>
              {t.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-16" aria-live="polite">
        <ol className="relative flex flex-col">
          <span aria-hidden className="absolute bottom-20 left-11 top-20 w-1 bg-[var(--mu-rule)]" />
          <span
            aria-hidden
            className="absolute left-8 top-0 grid size-8 place-items-center transition-transform ease-settle duration-settle motion-reduce:transition-none"
            style={{ transform: `translateY(${y - 4}px)`, opacity: pick === null ? 0 : 1 }}
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
