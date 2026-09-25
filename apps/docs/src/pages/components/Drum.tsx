import * as React from 'react';
import { Drum, Switch, type DrumProps } from '@unlocalhosted/metalui';
import { GADGETS, MECHANISM_TIMELINES, SPRINGS } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import drumSource from '../../../../../packages/metalui/src/components/drum/drum.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/drum.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/drum/drum.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalDrum.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const LOOKS: { label: string; props: DrumProps }[] = [
  { label: '0 · ceramic', props: { value: 0 } },
  { label: '7 · ceramic', props: { value: 7 } },
  { label: '9.5 · between', props: { value: 9.5 } },
  { label: '3 · accent', props: { value: 3, accent: true } },
  { label: '4 · clay', props: { value: 4, face: 'clay' } },
];

// The roll's own numbers: its spring, its tick and knock levels, the tick's size and pitch.
const ROLL = MECHANISM_TIMELINES.roll as unknown as { spring: keyof typeof SPRINGS; held: { tickMin: number; tickGap: number; rest: number }; cues: { kind: string; level: number }[] };
const LEVEL = (kind: string) => ROLL.cues.find((c) => c.kind === kind)?.level ?? 0;
const SIZE = 200;
// One digit's height on screen: the pitch on the drum drawn alone, in pixels.
const PITCH_PX = GADGETS.drum.pitch * (GADGETS.drum.alone / GADGETS.parts.drum.size[0]) * (SIZE / 400);
// A flick carries on this long at the speed it was let go with, before the spring takes it to a digit.
const CARRY = 0.14;
// ms: a hand this long without moving has stopped, so letting go does not flick.
const STILL = 60;

/** A drum you turn with your hand: drag it, flick it, scroll it or use the arrow keys. It settles on a
 *  digit on the roll's spring, ticking past each one and knocking as it settles. */
function TurnableDrum({ sound, onChange }: { sound: ReturnType<typeof createSound>; onChange: (v: number) => void }) {
  const [value, setValue] = React.useState(7);
  const st = React.useRef({ x: 7, v: 0, target: 7, raf: 0, last: 0, tick: -Infinity, drag: null as null | { y: number; t: number }, settling: false, wheel: 0 });
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = (x: number) => { setValue(x); onChange(x); };
  const tick = (level: number, t: number) => {
    const s = st.current;
    if (t - s.tick < ROLL.held.tickGap) return;
    s.tick = t;
    sound.strike('ceramic', { size: GADGETS.parts.drum.size[1] * GADGETS.drive.detentSize, level, pitch: GADGETS.drive.detentPitch });
  };
  // Moving to a new place: a tick for each digit passed.
  const moveTo = (x: number, t: number) => {
    const s = st.current;
    if (Math.floor(s.x + 0.5) !== Math.floor(x + 0.5)) tick(LEVEL('detent'), t);
    s.x = x; show(x);
  };
  // Settle on a digit, on the roll's spring, from wherever it is and at whatever speed it has.
  const settleTo = (target: number) => {
    const s = st.current;
    s.target = target;
    if (reduced()) { moveTo(target, performance.now()); s.v = 0; sound.strike('ceramic', { size: GADGETS.parts.drum.size[1], level: LEVEL('settle') }); return; }
    s.settling = true;
    const sp = SPRINGS[ROLL.spring];
    const frame = (now: number) => {
      const dt = Math.min(0.032, s.last ? (now - s.last) / 1000 : 1 / 60);
      s.last = now;
      let x = s.x;
      for (let i = 0; i < 4; i++) { const h = dt / 4; s.v += (-sp.stiffness * (x - s.target) - sp.damping * s.v) * h; x += s.v * h; }
      moveTo(x, now);
      if (Math.abs(x - s.target) < ROLL.held.rest && Math.abs(s.v) < ROLL.held.tickMin) {
        moveTo(s.target, now); s.v = 0; s.settling = false; s.last = 0; s.raf = 0;
        sound.strike('ceramic', { size: GADGETS.parts.drum.size[1], level: LEVEL('settle') });
        return;
      }
      s.raf = requestAnimationFrame(frame);
    };
    if (!s.raf) s.raf = requestAnimationFrame(frame);
  };
  const stop = () => { const s = st.current; if (s.raf) cancelAnimationFrame(s.raf); s.raf = 0; s.settling = false; s.last = 0; };
  React.useEffect(() => stop, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    stop();
    st.current.drag = { y: e.clientY, t: performance.now() };
    st.current.v = 0;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = st.current;
    if (!s.drag) return;
    const now = performance.now(), dy = e.clientY - s.drag.y, dt = Math.max(1, now - s.drag.t) / 1000;
    const dx = -dy / PITCH_PX;                            // drag up: the next digit comes into the window
    s.v = 0.7 * s.v + 0.3 * (dx / dt);                     // the hand's speed, smoothed, for a flick
    s.drag = { y: e.clientY, t: now };
    moveTo(s.x + dx, now);
  };
  const onPointerUp = () => {
    const s = st.current;
    if (!s.drag) return;
    // A hand that stopped before letting go carries nothing on.
    if (performance.now() - s.drag.t > STILL) s.v = 0;
    s.drag = null;
    settleTo(Math.round(s.x + s.v * CARRY));
  };
  const onWheel = (e: React.WheelEvent) => {
    const s = st.current;
    stop();
    moveTo(s.x + e.deltaY / PITCH_PX, performance.now());
    window.clearTimeout(s.wheel);
    s.wheel = window.setTimeout(() => settleTo(Math.round(st.current.x)), 140);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 };
    if (!(e.key in step)) return;
    e.preventDefault();
    settleTo(Math.round(st.current.target) + step[e.key]);
  };
  const digit = ((Math.round(value) % 10) + 10) % 10;
  return (
    <div role="slider" tabIndex={0} aria-label="Drum" aria-valuemin={0} aria-valuemax={9} aria-valuenow={digit} aria-valuetext={String(digit)}
      data-testid="drum-turn" data-value={value.toFixed(3)}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      onWheel={onWheel} onKeyDown={onKeyDown}
      className="cursor-grab touch-none select-none rounded-card outline-none focus-visible:focus-ring active:cursor-grabbing">
      <Drum value={value} size={SIZE} aria-hidden />
    </div>
  );
}

export default function DrumPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [value, setValue] = React.useState(7);
  return (
    <>
      <PageHeader
        title="Drum"
        lede="A numbered wheel seen through a window. Its strip wraps from 9 into 0, it darkens where the cylinder turns away at the top and bottom, and a glint lies across its upper curve. Its value can stand between two digits, as a real drum does while it rolls."
      />
      <Section title="Digits" lede="Whole digits sit centred in the window; between two, both show, cut by the window's edges. The digit you read first wears the accent.">
        <Bench caption={`gadgets.drum · 52 × 88 · pitch ${GADGETS.drum.pitch} · mono ${GADGETS.drum.weight}`}>
          <div className="flex flex-wrap items-end gap-24" data-testid="drum-looks">
            {LOOKS.map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6">
                <Drum {...l.props} size={120} />
                <figcaption className="type-label engraved">{l.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="drum" maxWidth={760} />
      </Section>
      <Section title="Turn it" lede="Grab the drum and turn it: drag it up or down, flick it and let it spin on, or scroll it. It settles on the nearest digit on the roll's own spring, ticking past each digit and knocking as it lands. With a keyboard, the arrow keys step it one digit. Past 9 it runs on into 0, without an end.">
        <Bench caption={`digit ${((Math.round(value) % 10) + 10) % 10} · at ${value.toFixed(2)} · the ${ROLL.spring} spring`}>
          <div className="flex flex-wrap items-center gap-24">
            <TurnableDrum sound={sound} onChange={setValue} />
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
            </label>
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'D1', title: 'Counts, not measures', body: 'A drum counts. A level or a proportion is a needle or a fader.' },
            { id: 'D2', title: 'Forward through 9', body: 'Counting up, a drum runs on from 9 into 0; it never turns back through 8.' },
            { id: 'D3', title: 'One accent', body: 'Only the digit you read first wears the accent.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: drumSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
