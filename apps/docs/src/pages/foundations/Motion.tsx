import * as React from 'react';
import { useDialKit } from 'dialkit';
import { motion, useReducedMotion } from 'motion/react';
import { tokens, dampingRatio, settleTime } from '../../lib/tokens';
import { Bench, PageHeader, Rules, Section, copyJSON } from '../../ui/doc';

/* ─────────────────────────────────────────────────────────
 * MOTION STORYBOARD
 *
 * Play toggles every specimen between rest and active:
 *   obj    card lifts 3pt on hover, falls back       (k120 c13)
 *   flap   folder flap tilts −15° → −45°             (k120 c14)
 *   ui     switch thumb slides 16pt                  (k170 c16)
 *   press  cap lands in 50ms linear, releases spring (k500 c40)
 *   morph  footprint springs to new content          (k380 c36)
 * ───────────────────────────────────────────────────────── */

type SpringKey = 'obj' | 'flap' | 'ui' | 'press';
const S = tokens.springs;
const physics = (k: SpringKey) => ({ type: 'spring' as const, stiffness: S[k].stiffness, damping: S[k].damping, mass: 1 });

function overshoot(zeta: number) {
  return zeta >= 1 ? 0 : Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta));
}

/** DialKit hands back a transition config; springs carry stiffness, damping and mass. */
function springSummary(k: SpringKey, config: object) {
  const spring = config as { stiffness?: number; damping?: number; mass?: number };
  const stiffness = spring.stiffness ?? S[k].stiffness;
  const damping = spring.damping ?? S[k].damping;
  const mass = spring.mass ?? 1;
  const z = dampingRatio(stiffness, damping, mass);
  return `k${Math.round(stiffness)} c${Math.round(damping)} · ζ ${z.toFixed(2)} · ${Math.round(settleTime(stiffness, damping, mass) * 1000)}ms · ${(overshoot(z) * 100).toFixed(1)}% overshoot`;
}

function SpringReadout({ k, spring: config }: { k: SpringKey; spring: object }) {
  const spring = config as { stiffness?: number; damping?: number; mass?: number };
  const stiffness = spring.stiffness ?? S[k].stiffness;
  const damping = spring.damping ?? S[k].damping;
  const mass = spring.mass ?? 1;
  const z = dampingRatio(stiffness, damping, mass);
  return (
    <span className="type-readout text-ink2">
      k{Math.round(stiffness)} c{Math.round(damping)} · ζ {z.toFixed(2)} · {Math.round(settleTime(stiffness, damping, mass) * 1000)}ms · {(overshoot(z) * 100).toFixed(1)}%
      <span className="sr-only"> for {k}</span>
    </span>
  );
}

export default function Motion() {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const d = useDialKit(
    'Motion',
    {
      obj: physics('obj'),
      flap: physics('flap'),
      ui: physics('ui'),
      press: physics('press'),
      liftY: [-3, -12, 0, 1],
      play: { type: 'action', label: 'Play all' },
      copy: { type: 'action', label: 'Copy spring tokens' },
    },
    {
      onAction: (a) => {
        if (a === 'play') setActive((v) => !v);
        if (a === 'copy') copyJSON({ obj: d.obj, flap: d.flap, ui: d.ui, press: d.press });
      },
    },
  );
  const t = (s: object) => (reduce ? { duration: 0 } : s);

  return (
    <>
      <PageHeader
        title="Motion"
        lede="Motion is short, damped and physical. Five springs cover everything; the CSS versions are the same springs sampled into linear() curves, and SwiftUI uses them as interpolating springs. Under reduced motion every transition is instant, but a press still moves 1 point, because that is feedback."
      />

      <Section title="Springs" lede="Hover the card, press the cap, or use Play all in the dial panel. Tune stiffness and damping and the readouts update.">
        <div className="grid gap-16 md:grid-cols-2 [&>*]:min-w-0">
          <Bench caption={`obj · objects, hover lift, card slides · ${springSummary('obj', d.obj)}`}>
            <div className="flex flex-col items-center gap-20">
              <motion.div
                className="material-raised h-[96px] w-[200px] rounded-card"
                animate={{ y: active ? d.liftY : 0 }}
                whileHover={{ y: d.liftY }}
                transition={t(d.obj)}
              />
              <SpringReadout k="obj" spring={d.obj} />
            </div>
          </Bench>

          <Bench caption={`flap · flap tilt, drawers · ${springSummary('flap', d.flap)}`}>
            <div className="flex flex-col items-center gap-20">
              <div className="relative h-[96px] w-[200px] [perspective:800px]">
                <div className="material-well absolute inset-x-0 bottom-0 h-[72px] rounded-card" />
                <motion.div
                  className="material-float absolute inset-x-0 bottom-0 h-[56px] origin-bottom rounded-card"
                  animate={{ rotateX: active ? -45 : -15 }}
                  whileHover={{ rotateX: -45 }}
                  transition={t(d.flap)}
                />
              </div>
              <SpringReadout k="flap" spring={d.flap} />
            </div>
          </Bench>

          <Bench caption={`ui · thumbs, toggles, ticks · ${springSummary('ui', d.ui)}`}>
            <div className="flex flex-col items-center gap-20">
              <div className="material-raised flex h-44 w-[216px] items-center justify-between rounded-pill pl-21 pr-10">
              <span className="type-ui text-ink">Open at login</span>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label="Open at login"
                onClick={() => setActive((v) => !v)}
                className="relative h-24 w-40 cursor-pointer rounded-pill transition-[background] duration-200"
                style={active ? { background: 'linear-gradient(#66CC99,#8BDFB5)', boxShadow: 'inset 0 2px 5px -1px rgba(0,70,35,.28), inset 0 0 6px 1px rgba(255,255,255,.25)' } : { background: 'linear-gradient(var(--mu-well-top),var(--mu-well-bot))', boxShadow: 'var(--mu-well)' }}
              >
                <motion.span className="material-thumb absolute left-2 top-2 block size-20 rounded-pill" animate={{ x: active ? 16 : 0 }} transition={t(d.ui)} />
              </button>
              </div>
              <SpringReadout k="ui" spring={d.ui} />
            </div>
          </Bench>

          <Bench caption={`press · lands in 50ms, releases on a spring · ${springSummary('press', d.press)}`}>
            <div className="flex flex-col items-center gap-20">
              <motion.button
                type="button"
                onPointerDown={() => setPressed(true)}
                onPointerUp={() => setPressed(false)}
                onPointerLeave={() => setPressed(false)}
                className={`type-ui h-32 cursor-pointer rounded-pill px-15 text-ink ${pressed ? 'material-pressed' : 'material-cap'}`}
                animate={{ y: pressed ? 1 : 0 }}
                transition={pressed ? { duration: 0.05, ease: 'linear' } : t(d.press)}
              >
                Hold me
              </motion.button>
              <SpringReadout k="press" spring={d.press} />
            </div>
          </Bench>
        </div>
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'M1', title: 'Objects may overshoot gently; chrome stays crisp', body: 'Object springs overshoot 7–10%. The press release is near-critical (ζ ≈ 0.9), so controls never wobble.' },
            { id: 'M2', title: 'Press lands linear, releases on a spring', body: 'Pressing is a 50ms linear step down 1 point. Letting go uses the press spring, from wherever the cap currently is.' },
            { id: 'M3', title: 'Hover is a pose, press is a one-shot', body: 'Hover moves parts into a state that reverses and can be interrupted. Press plays a keyframe gesture once and returns to the current pose.' },
            { id: 'M4', title: 'Reduced motion keeps feedback', body: 'Transitions become instant and loops stop; the 1-point press travel stays. Content swaps keep a short opacity cross-fade.' },
            { id: 'M5', title: 'State changes use the transition recipes', body: 'Springs move objects; the Transitions page defines how labels, icons, sizes and selections change state (text swap, icon swap, footprint, selection glide, open and close).' },
            { id: 'M6', title: 'Frequent means fast', body: 'Something the user does a hundred times a day gets no choreography: press, hover, swap stay under 300ms. Longer motion is for rare moments and large spatial changes.' },
          ]}
        />
      </Section>
    </>
  );
}
