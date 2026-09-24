import * as React from 'react';
import { useDialKit } from 'dialkit';
import { motion, useReducedMotion } from 'motion/react';
import { Button, SwapIcon, SwapText } from '@unlocalhosted/metalui';
import { CheckIcon, NoteIcon, SyncedIcon } from '@unlocalhosted/metalui/icons';
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
 *   swap   old label out 120ms ↑4 blur2, new in 180ms ↓4
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

const SWAP_STATES = [
  { key: 'save', label: 'Save', icon: <NoteIcon size={14} /> },
  { key: 'saving', label: 'Saving to Today…', icon: <SyncedIcon size={14} /> },
  { key: 'saved', label: 'Saved', icon: <CheckIcon size={14} /> },
] as const;

export default function Motion() {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [swapAt, setSwapAt] = React.useState(0);
  const sw = useDialKit('Content swap', {
    textExit: [120, 40, 400, 10],
    textEnter: [180, 40, 500, 10],
    travel: [4, 0, 16, 1],
    blur: [2, 0, 8, 0.5],
    iconDuration: [250, 60, 600, 10],
    iconScale: [0.25, 0, 1, 0.05],
    morphDuration: [0.44, 0.1, 1.2, 0.02],
    next: { type: 'action', label: 'Next state' },
  }, { onAction: (a) => { if (a === 'next') setSwapAt((i) => (i + 1) % SWAP_STATES.length); } });
  const swapVars = {
    '--mu-swap-text-exit': `${sw.textExit}ms`,
    '--mu-swap-text-enter': `${sw.textEnter}ms`,
    '--mu-swap-travel': `${sw.travel}px`,
    '--mu-swap-blur': `${sw.blur}px`,
    '--mu-swap-icon-dur': `${sw.iconDuration}ms`,
    '--mu-swap-icon-scale': sw.iconScale,
    '--mu-spring-morph-d': `${sw.morphDuration}s`,
  } as React.CSSProperties;
  const swapState = SWAP_STATES[swapAt];
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
        lede="Motion is short, damped and physical. Four springs cover everything; the CSS versions are the same springs sampled into linear() curves, and SwiftUI uses them as interpolating springs. Under reduced motion every transition is instant, but a press still moves 1 point, because that is feedback."
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

      <Section title="Content swap" lede="When a control's content changes (a label, an icon, a count) the control keeps its identity. Its footprint springs to the new size, the old content leaves first and quickly, and the new content arrives as the surface makes room. Press the button to step through its states, or tune the swap in the dial panel.">
        <Bench caption={`morph k380 c36 · ${sw.morphDuration}s · text out ${sw.textExit}ms · in ${sw.textEnter}ms · travel ${sw.travel} · blur ${sw.blur} · icon ${sw.iconDuration}ms from ${sw.iconScale}`}>
          <div style={swapVars} className="flex flex-col items-center gap-16">
            <Button cap="primary" onClick={() => setSwapAt((i) => (i + 1) % SWAP_STATES.length)}>
              <SwapIcon swapKey={swapState.key}>{swapState.icon}</SwapIcon>
              <span aria-live="polite"><SwapText value={swapState.label} /></span>
            </Button>
            <span className="type-readout text-ink2">{swapAt + 1} / {SWAP_STATES.length} · {swapState.key}</span>
          </div>
        </Bench>
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'M1', title: 'Objects may overshoot gently; chrome stays crisp', body: 'Object springs overshoot 7–10%. The press release is near-critical (ζ ≈ 0.9), so controls never wobble.' },
            { id: 'M2', title: 'Press lands linear, releases on a spring', body: 'Pressing is a 50ms linear step down 1 point. Letting go uses the press spring, from wherever the cap currently is.' },
            { id: 'M3', title: 'Hover is a pose, press is a one-shot', body: 'Hover moves parts into a state that reverses and can be interrupted. Press plays a keyframe gesture once and returns to the current pose.' },
            { id: 'M4', title: 'Reduced motion keeps feedback', body: 'Transitions become instant and loops stop; the 1-point press travel stays. Content swaps keep a short opacity cross-fade.' },
            { id: 'M5', title: 'Content changes morph, never snap', body: 'A control whose label, icon or count changes keeps its surface: the footprint springs to the new size on the morph spring (k380 c36, no visible overshoot). The old content leaves first and faster (120ms, 4pt up, 2pt blur), the new content arrives from 4pt below (180ms). When the control grows, the surface moves first; when it shrinks, the content leaves first. Icons cross through scale 0.25 with a 2pt blur (250ms). Use SwapText and SwapIcon; never swap text or resize a control in a single frame.' },
            { id: 'M6', title: 'Frequent means fast', body: 'Something the user does a hundred times a day gets no choreography: press, hover, swap stay under 300ms. Longer motion is for rare moments and large spatial changes.' },
          ]}
        />
      </Section>
    </>
  );
}
