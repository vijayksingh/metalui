import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button } from '@unlocalhosted/metalui';
import { tokens, dampingRatio, settleTime } from '../../lib/tokens';
import { Bench, PageHeader, Rules, Section, TokenTable, copyJSON } from '../../ui/doc';

/* ─────────────────────────────────────────────────────────
 * METAL MOTION: objects with mass, under one light
 *
 * Every specimen rides its mass class's spring (CSS: the sampled linear()).
 *   part     switch thumb hits the end of its track      k170 c16  overshoot ~9%
 *   settle   card hover-lifts one step (4), still on leave    k380 c36  no overshoot
 *   object   a dropped card lands on the table            k120 c13  overshoot ~10%
 *   hinge    flap tilts −15° → −45°                       k120 c14
 *   surface  a plate rises one nest from its cap          k220 c28  no overshoot
 *   release  a pressed cap returns                        k500 c40
 *   refusal  a field released one nest aside rings out    k900 c12
 * Shadows change with elevation as part of each motion; the light never moves.
 * ───────────────────────────────────────────────────────── */

type SpringName = keyof typeof tokens.springs;
const S = tokens.springs;
const physics = (k: SpringName) => ({ type: 'spring' as const, stiffness: S[k].stiffness, damping: S[k].damping, mass: 1 });

function overshoot(zeta: number) {
  return zeta >= 1 ? 0 : Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta));
}

/** A spring sampled as CSS linear() over its settle time, from live dial values. */
function curve(k: number, c: number, duration: number, n = 40) {
  const w0 = Math.sqrt(k), z = c / (2 * Math.sqrt(k)), wd = w0 * Math.sqrt(Math.max(1 - z * z, 1e-6));
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * duration;
    pts.push(i === n ? 1 : +(1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t))).toFixed(4));
  }
  return `linear(${pts.join(',')})`;
}

const read = (config: object) => {
  const s = config as { stiffness?: number; damping?: number };
  return { k: s.stiffness ?? 200, c: s.damping ?? 20 };
};

function summary(config: object) {
  const { k, c } = read(config);
  const z = dampingRatio(k, c);
  return `k${Math.round(k)} c${Math.round(c)} · ζ ${z.toFixed(2)} · settles ${Math.round(settleTime(k, c) * 1000)}ms · ${(overshoot(z) * 100).toFixed(1)}% overshoot`;
}

/** A transition string that rides a live spring config. */
function ride(config: object, props: string[]) {
  const { k, c } = read(config);
  const d = settleTime(k, c);
  const ease = curve(k, c, d);
  return props.map((p) => `${p} ${d.toFixed(3)}s ${ease}`).join(', ');
}

type Reduced = 'unchanged' | 'crossfade' | 'instant';
const REDUCED_WORDS: Record<Reduced, string> = {
  unchanged: 'plays as authored',
  crossfade: 'no travel, fades in place',
  instant: 'applies at once',
};

/** Every class arriving from one step away, as Reduce Motion resolves it (tokens.json springs.*.reduced). */
function ReducedMotionBench() {
  const [reduce, setReduce] = React.useState(false);
  const [phase, setPhase] = React.useState<'from' | 'to'>('to');
  const [system, setSystem] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystem(mq.matches);
    const on = () => setSystem(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const replay = () => {
    setPhase('from');
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase('to')));
  };
  const active = reduce || system;
  return (
    <div className="flex w-full flex-col gap-16" data-mu-motion={reduce ? 'reduce' : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-12">
        <div className="flex items-center gap-8">
          <Button onClick={replay}>Replay</Button>
          <button
            type="button"
            aria-pressed={reduce}
            onClick={() => setReduce((v) => !v)}
            className={['type-ui h-32 cursor-pointer rounded-pill px-15 text-ink', reduce ? 'material-pressed' : 'material-cap'].join(' ')}
          >
            Reduce motion
          </button>
        </div>
        <span className="type-readout text-ink2">{system ? 'system: reduce' : 'system: full'} · {active ? 'reduced' : 'full motion'}</span>
      </div>
      <div className="flex flex-col">
        {(Object.entries(S) as [string, { reduced: Reduced }][]).map(([k, s]) => (
          <div key={k} data-md="row" className="grid grid-cols-[88px_1fr_160px] items-center gap-12 border-b border-[var(--mu-rule)] py-10 last:border-0 max-md:grid-cols-[72px_1fr]">
            <span className="type-readout text-ink">{k}</span>
            <div className="material-well relative h-24 overflow-hidden rounded-pill">
              <span
                className="material-thumb absolute left-[calc(50%-8px)] top-4 size-16 rounded-full"
                style={{
                  opacity: phase === 'to' ? 1 : 0,
                  transform: phase === 'to' ? 'none' : `translateX(calc(-24px * var(--mu-travel-${k})))`,
                  transition:
                    phase === 'to'
                      ? `transform var(--mu-spring-${k}-d) var(--mu-spring-${k}), opacity var(--mu-spring-${k}-d) var(--mu-spring-${k})`
                      : 'none',
                }}
              />
            </div>
            <span className="type-meta text-ink2 max-md:col-span-2">
              <b className="font-medium text-ink">{active ? s.reduced : 'full'}</b> · {active ? REDUCED_WORDS[s.reduced] : 'rides its spring'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Motion() {
  const [on, setOn] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [lifted, setLifted] = React.useState(false);
  const [refused, setRefused] = React.useState(0);
  const field = React.useRef<HTMLDivElement>(null);

  const d = useDialKit(
    'Motion',
    {
      part: physics('part'),
      object: physics('object'),
      hinge: physics('hinge'),
      surface: physics('surface'),
      release: physics('release'),
      refusal: physics('refusal'),
      play: { type: 'action', label: 'Play all' },
      copy: { type: 'action', label: 'Copy springs' },
    },
    {
      onAction: (a) => {
        if (a === 'play') { setOn((v) => !v); setOpen((v) => !v); setRefused((n) => n + 1); }
        if (a === 'copy') copyJSON({ part: d.part, object: d.object, hinge: d.hinge, surface: d.surface, release: d.release, refusal: d.refusal });
      },
    },
  );

  // Replay the refusal from one nest aside.
  React.useEffect(() => {
    const el = field.current;
    if (!el || refused === 0) return;
    const { k, c } = read(d.refusal);
    const dur = settleTime(k, c);
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = `mu-refuse ${dur.toFixed(3)}s ${curve(k, c, dur, 64)}`;
  }, [refused]); // eslint-disable-line react-hooks/exhaustive-deps

  const massRows = (Object.keys(S) as SpringName[]).map((name) => {
    const s = S[name];
    return [name, `k${s.stiffness} c${s.damping} · ζ ${s.zeta}`, `half ${s.half} · near ${s.near}`, s.use];
  });
  const lift = on || lifted;

  return (
    <>
      <style>{'@keyframes mu-refuse { from { transform: translateX(var(--mu-motion-nest)); } to { transform: none; } }'}</style>
      <PageHeader
        title="Motion"
        lede="Soft Hardware objects have mass and sit under one light, so their motion is physics, not a timing table. How heavy a thing is decides its spring; the springs decide how long everything takes; the grid decides how far anything moves; the light decides how shadows change on the way."
      />

      <Section title="Mass classes" lede="Every moving thing belongs to a class, and each class has one spring. Half is when a motion is visibly underway; near is when it reads as done. There is no separate duration table: every timing comes from these.">
        <TokenTable head={['Class', 'Spring', 'Timing', 'Moves']} rows={massRows} mono={[0, 1, 2]} />
      </Section>

      <Section title="Reduce Motion" lede="Each class resolves one way under Reduce Motion, from the system setting or from data-mu-motion=&quot;reduce&quot; on any ancestor. Parts, objects, hinges and refusals apply at once; surfaces and settles lose their travel and fade in place; release plays as authored, because a press of one point is feedback. Meaning never depends on the motion.">
        <Bench caption="Each class arrives from one step away · Replay, then turn Reduce motion on and replay">
          <ReducedMotionBench />
        </Bench>
      </Section>

      <Section title="Specimens" lede="Each specimen rides its own spring, live from the dial panel. Press, hover, or use Play all.">
        <div className="grid gap-16 md:grid-cols-2 [&>*]:min-w-0">
          <Bench caption={`part · a thumb meets the end of its track · ${summary(d.part)}`}>
            <div className="material-raised flex h-44 w-[216px] items-center justify-between rounded-pill pl-21 pr-10">
              <span className="type-ui text-ink">Open at login</span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label="Open at login"
                onClick={() => setOn((v) => !v)}
                className="relative h-24 w-40 cursor-pointer rounded-pill transition-[background] duration-200"
                style={on ? { background: 'linear-gradient(#66CC99,#8BDFB5)', boxShadow: 'inset 0 2px 5px -1px rgba(0,70,35,.28), inset 0 0 6px 1px rgba(255,255,255,.25)' } : { background: 'linear-gradient(var(--mu-well-top),var(--mu-well-bot))', boxShadow: 'var(--mu-well)' }}
              >
                <span className="material-thumb absolute left-2 top-2 block size-20 rounded-pill" style={{ transform: `translateX(${on ? 16 : 0}px)`, transition: ride(d.part, ['transform']) }} />
              </button>
            </div>
          </Bench>

          <Bench caption={`settle lifts one step on hover · object lands it · ${summary(d.object)}`}>
            <div className="p-4" onPointerEnter={() => setLifted(true)} onPointerLeave={() => setLifted(false)}>
              <div
                className="material-raised h-[96px] w-[200px] rounded-card"
                style={{ transform: `translateY(${lift ? -4 : 0}px)`, transition: lift ? `transform var(--mu-spring-settle-d) var(--mu-spring-settle)` : ride(d.object, ['transform']) }}
              />
            </div>
          </Bench>

          <Bench caption={`hinge · a flap tilts on its hinge · ${summary(d.hinge)}`}>
            <div className="relative h-[96px] w-[200px] [perspective:800px]">
              <div className="material-well absolute inset-x-0 bottom-0 h-[72px] rounded-card" />
              <div
                className="material-float absolute inset-x-0 bottom-0 h-[56px] origin-bottom rounded-card"
                style={{ transform: `rotateX(${on ? -45 : -15}deg)`, transition: ride(d.hinge, ['transform']) }}
              />
            </div>
          </Bench>

          <Bench caption={`surface · rises one nest from its cap; the light does not move · ${summary(d.surface)}`}>
            <div className="relative flex h-[152px] w-[220px] flex-col items-center justify-end">
              <div
                aria-hidden={!open}
                className="pointer-events-none absolute bottom-44 left-[10px] w-[200px] origin-bottom rounded-card"
                style={{
                  transform: `translateY(${open ? 0 : 6}px) scale(${open ? 1 : (200 - 6) / 200})`,
                  opacity: open ? 1 : 0,
                  transition: ride(d.surface, ['transform', 'opacity']),
                }}
              >
                {/* The shadow grows from the cap's contact to the floating ambient: two recipes crossfade. */}
                <div className="material-cap absolute inset-0 rounded-card" style={{ opacity: open ? 0 : 1, transition: ride(d.surface, ['opacity']) }} />
                <div className="material-float absolute inset-0 rounded-card" style={{ opacity: open ? 1 : 0, transition: ride(d.surface, ['opacity']) }} />
                <div className="relative flex flex-col gap-2 p-6">
                  {['Arrange as Timeline', 'Tag Selection', 'Export…'].map((row) => (
                    <span key={row} className="type-ui flex h-28 items-center rounded-row px-8 text-ink">{row}</span>
                  ))}
                </div>
              </div>
              <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="material-cap type-ui h-32 cursor-pointer rounded-pill px-15 text-ink">
                Actions
              </button>
            </div>
          </Bench>

          <Bench caption={`release · a pressed cap returns · ${summary(d.release)}`}>
            <button
              type="button"
              onPointerDown={() => setPressed(true)}
              onPointerUp={() => setPressed(false)}
              onPointerLeave={() => setPressed(false)}
              className={`type-ui h-32 cursor-pointer rounded-pill px-15 text-ink ${pressed ? 'material-pressed' : 'material-cap'}`}
              style={{ transform: `translateY(${pressed ? 1 : 0}px)`, transition: pressed ? 'transform 50ms linear' : ride(d.release, ['transform']) }}
            >
              Hold me
            </button>
          </Bench>

          <Bench caption={`refusal · released one nest aside, it rings against the walls · ${summary(d.refusal)}`}>
            <div className="flex items-center gap-12">
              <div ref={field} className="material-well type-readout flex h-36 w-[140px] items-center rounded-pill px-17 text-ink2">0 4 2 _</div>
              <button type="button" onClick={() => setRefused((n) => n + 1)} className="material-cap type-ui h-32 cursor-pointer rounded-pill px-15 text-ink">Unlock</button>
            </div>
          </Bench>
        </div>
      </Section>

      <Section title="Distances" lede="How far things move comes from the grid and the material, never from taste. Defocus is half the travel, like a lens pulling focus on what moved.">
        <TokenTable
          head={['Token', 'Value', 'What moves that far']}
          rows={Object.entries(tokens.motion)
            .filter(([k]) => !k.startsWith('$'))
            .map(([k, v]) => [`--mu-motion-${k}`, (v as { value: string }).value, (v as { use: string }).use])}
        />
      </Section>

      <Section title="Principles">
        <Rules
          rules={[
            { id: 'M1', title: 'Mass decides the spring', body: 'A part (a thumb, a key) is light and quick; an object (a card) is heavier; a surface floats and settles without bounce. Pick the class, and the spring, timing and overshoot follow. There is no duration to choose.', origin: 'Ours' },
            { id: 'M2', title: 'Fades ride springs', body: 'Opacity, focus and color that accompany a motion use the same spring as the motion, so everything lands together. Arrivals ride settle, departures ride release. No cubic-bezier tables; linear only for constant motion like progress.', origin: 'Ours' },
            { id: 'M3', title: 'Bounce needs a stop', body: 'Only something that meets a physical stop may overshoot: a thumb at the end of its track, a card landing on the table, a flap at its hinge. Surfaces, footprints and free glides have nothing to bounce against, so they settle.', origin: 'Ours · sharpens “bounce by size” from Animations on the Web' },
            { id: 'M4', title: 'Light stays put', body: 'Elevation changes are part of the motion. Lifting grows the ambient shadow, pressing collapses it into a well, and a surface rising from its cap grows from contact shadow to floating ambient. Highlights stay on the top-left edges.', origin: 'Ours' },
            { id: 'M5', title: 'Distances come from the grid', body: 'A press is the cap’s depth (1). A swap turns one step (4). A surface rises one nest (6), and a refusal reaches one nest. A view changes by two steps (8). A panel travels its own extent. Defocus is half the travel.', origin: 'Ours' },
            { id: 'M6', title: 'Frequency decides whether anything moves', body: 'What is done a hundred times a day (shortcuts, arrowing through a list, the palette toggle) does not animate. Motion is kept for what is seen occasionally.', origin: 'Adapted · Animations on the Web (Emil Kowalski)' },
            { id: 'M7', title: 'Reduced motion keeps meaning', body: 'Each class has one resolution, written in tokens.json: travel classes (part, object, hinge, refusal) apply at once, surfaces and settles fade in place, and release plays as authored, because a press of one point is feedback, not decoration. Color changes stay.', origin: 'Adapted · Animations on the Web, beUI; Kamui’s motion roles' },
            { id: 'M8', title: 'Interruptible by construction', body: 'State changes use transitions and springs, which continue from wherever the object is. Keyframes are only for one-shot gestures such as an icon’s press or a refusal.', origin: 'Adapted · Animations on the Web' },
          ]}
        />
      </Section>
    </>
  );
}
