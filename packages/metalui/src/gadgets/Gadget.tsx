'use client';

// <Gadget spec />: draws any valid gadget spec and runs it. The spec names its Parts, where they sit,
// its job and feel, its mechanism and its states; this component resolves the colours, draws the
// Parts, and binds the mechanism's player to them, so a state change springs parts to their held
// poses, relights the lamp and plays the beeper, and an act plays the mechanism with its sound. It is
// never a control: a host that wants to operate it wraps it in a Button and drives `state` and `act`.
import * as React from 'react';
import type { GadgetSpec } from './spec';
import { validateGadget, type Problem } from './validate';
import { drawGadget, driveDefault, driveTargets, formPoses, stateOf } from './draw';
import { createPlayer, type MechanismName, type Player } from './player';
import { createDrive, type Drive, type DriveName } from './drive';
import { MECHANISMS as TIMELINES } from './mechanisms.generated';
import { createCableSwing, type CableSwing } from './parts/cable';
import { playBeeper } from './parts/beeper';
import { GADGETS } from './gadgets.generated';
import { tierFor, type Host, type Tier } from './light';
import { useHost } from './host';
import type { Sound } from '../sound/sound';

export interface GadgetProps extends Omit<React.SVGProps<SVGSVGElement>, 'onChange'> {
  spec: GadgetSpec;
  /** The state to show (a key of `spec.states`); default the spec's initial state. */
  state?: string;
  /** Change it to play the mechanism's act. */
  act?: number;
  /** A held gadget's drive value (its drive port, 0 to 1 for a number): parts move to follow it. */
  value?: number;
  /** A sound engine from createSound(); without one the gadget is silent. */
  sound?: Sound | null;
  size?: number;
  tier?: Tier;
  host?: Host;
  /** Called with the problems when the spec is invalid (the gadget then draws nothing). */
  onProblems?: (problems: Problem[]) => void;
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
type Pt = [number, number];

export function Gadget({ spec, state: wanted, act = 0, value, sound = null, size = 160, tier: forcedTier, host: forcedHost, onProblems, ...props }: GadgetProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forcedHost);
  const uid = React.useId().replace(/:/g, '');
  const tier = forcedTier ?? tierFor(size);
  const check = React.useMemo(() => validateGadget(spec), [spec]);
  const valid = check.ok ? check.spec : null;
  const state = valid ? stateOf(valid, wanted) : '';
  // The lamp an act asks for (a flicker as the plug lands), until the state changes again.
  const [lampCue, setLampCue] = React.useState<{ gesture: string; beat: number } | null>(null);

  // Parts are drawn once per spec and look; the player moves them from then on. The body and the lamp
  // follow the state. The first paint already holds the state's poses, as the server's does.
  const first = React.useRef(state);
  const parts = React.useMemo(() => valid ? drawGadget(valid, { state: first.current, tier, host, id: `g${uid}` }).parts : null, [valid, tier, host, uid]);
  const drawn = React.useMemo(() => valid ? drawGadget(valid, { state, tier, host, id: `g${uid}` }) : null, [valid, state, tier, host, uid]);
  const lamp = React.useMemo(() => {
    if (!valid || !drawn) return null;
    const signal = drawn.resolved.states[state].lamp[0];
    return lampCue ? drawGadget(valid, { state, tier, host, id: `g${uid}`, lamp: [signal, lampCue.gesture] }).lamp : drawn.lamp;
  }, [valid, drawn, state, lampCue, tier, host, uid]);

  React.useEffect(() => { if (!check.ok) onProblems?.(check.problems); }, [check]); // eslint-disable-line react-hooks/exhaustive-deps

  // The player, bound to the Parts the mechanism names (its `bind`: slot → part id).
  const player = React.useRef<Player | null>(null);
  const beepFor = React.useRef<string | null>(null);
  // A plug springing home from lying aside lands when it gets there, with the act's landing.
  const landing = React.useRef(false);
  React.useEffect(() => {
    const svg = ref.current;
    // Only a mechanism with a built timeline can play; a spec naming another draws still.
    if (!valid || !svg || (TIMELINES as unknown as Record<string, { mode: string }>)[valid.mechanism.name]?.mode !== 'momentary') return;
    const bind = valid.mechanism.bind as Record<string, string>;
    const at = (id: string) => valid.parts.find((p) => p.id === id)?.at ?? [0, 0];
    const el = (id: string | undefined, sel: string) => (id ? svg.querySelector(`[data-id="${id}"] ${sel}`) : null);
    const plugId = bind.plug, plug = valid.parts.find((p) => p.id === plugId);
    // The cable whose end the plug holds follows it, its belly swinging after.
    const cableEl = svg.querySelector<SVGGElement>(`[data-id][data-from="${plugId}"], [data-id][data-to="${plugId}"]`);
    const cablePart = valid.parts.find((p) => p.id === cableEl?.getAttribute('data-id'));
    const cableSpec = (end: Pt) => {
      const from = cablePart?.params?.from === plugId ? end : at(String(cablePart?.params?.from)) as Pt;
      const to = cablePart?.params?.to === plugId ? end : at(String(cablePart?.params?.to)) as Pt;
      return { from, to, sag: cablePart?.params?.sag === undefined ? undefined : Number(cablePart.params.sag), length: cablePart?.params?.length === undefined ? undefined : Number(cablePart.params.length) };
    };
    const home = at(plugId) as Pt;
    const held = formPoses(valid, first.current)[plugId];
    const start: Pt = [home[0] + (held?.x ?? 0), home[1] + (held?.y ?? 0)];
    let swing: CableSwing | null = cableEl && cablePart ? createCableSwing(cableEl, cableSpec(start), { reduced: reducedMotion() }) : null;
    // Every bound slot's moving elements (and their shadows), in bind order, about their own centres:
    // a plug about itself, a key about its face.
    const moving: Record<string, Element[]> = {}, origins: Record<string, [number, number][]> = {}, bound: Record<string, string[]> = {};
    for (const [slot, ids] of Object.entries(valid.mechanism.bind)) {
      const list = Array.isArray(ids) ? ids : [ids], els = list.map((id) => svg.querySelector(`[data-id="${id}"] [data-moves]`));
      if (!els.every(Boolean)) continue;
      moving[slot] = els as Element[]; bound[slot] = list;
      origins[slot] = list.map((id) => {
        const q = valid.parts.find((x) => x.id === id)!, S = (q.size ?? GADGETS.parts[q.part].size)[0] as number;
        return q.part === 'key' ? [q.at[0], q.at[1] - S * GADGETS.key.faceLift] : [q.at[0], q.at[1]];
      });
      const shadows = list.map((id) => svg.querySelector(`[data-id="${id}"] [data-moves-shadow]`));
      if (shadows.every(Boolean)) moving[`${slot}.shadow`] = shadows as Element[];
    }
    // A strike sounds in the struck part's own material, at its own size.
    const struck = (slot: string, i: number) => {
      const q = valid.parts.find((x) => x.id === bound[slot]?.[i]);
      const def = q ? (GADGETS.parts[q.part] as unknown as { size: readonly number[]; materials: readonly string[] }) : null;
      const material = (!q || q.material === 'accent' || !q.material ? def?.materials.find((m) => m !== 'accent') ?? 'clay' : q.material) as 'clay';
      return { material, size: (q?.size ?? def?.size ?? [GADGETS.parts.plug.size[0]])[0] as number };
    };
    const p = createPlayer(valid.mechanism.name as MechanismName, moving, {
      origins,
      reduced: reducedMotion(),
      onStrike: (cue, delay, i) => { const w = struck(cue.slot, i); sound?.strike(w.material, { size: w.size, weight: valid.feel.w, reach: valid.reach ?? 'world', level: cue.level, pitch: cue.pitch, delay }); },
      onLamp: (gesture) => setLampCue((c) => ({ gesture, beat: (c?.beat ?? 0) + 1 })),
      onBeep: () => {
        const earcon = beepFor.current as 'done' | null;
        if (!earcon) return;
        sound?.beep(earcon);
        const b = svg.querySelector(`[data-id="${bind.beeper}"]`);
        if (b) playBeeper(b, earcon, { reduced: reducedMotion(), width: GADGETS.parts.beeper.size[0] });
      },
      onFrame: (_t, poses) => {
        const q = poses.plug;
        if (!q) return;
        if (swing) swing.set(cableSpec([home[0] + q.x, home[1] + q.y]));
        // It lands the moment the spring first brings it home, not when it has stopped moving.
        if (landing.current && Math.hypot(q.x, q.y) < 1) { landing.current = false; p.land(); }
      },
    });
    if (held) p.holdPose('plug', held, { immediate: true });
    player.current = p;
    return () => { p.destroy(); swing?.destroy(); swing = null; player.current = null; };
  }, [parts]); // eslint-disable-line react-hooks/exhaustive-deps

  // A held mechanism: its drive moves the bound parts to follow the value, with its own sound.
  const drive = React.useRef<Drive | null>(null);
  React.useEffect(() => {
    const svg = ref.current;
    const held = valid ? (TIMELINES as unknown as Record<string, { held: object | null }>)[valid.mechanism.name]?.held : null;
    if (!valid || !svg || !held) return;
    const actors = [...svg.querySelectorAll('[data-drive]')].sort((a, b) => Number(a.getAttribute('data-drive')) - Number(b.getAttribute('data-drive')));
    const firstActor = valid.parts.find((p) => p.part === 'cap');
    const d = createDrive(valid.mechanism.name as DriveName, actors, driveTargets(valid, value ?? driveDefault(valid)), {
      sound, material: firstActor?.material === 'ceramic' ? 'ceramic' : 'clay', partSize: GADGETS.parts.cap.size[0], reduced: reducedMotion(),
    });
    drive.current = d;
    return () => { d.destroy(); drive.current = null; };
  }, [parts]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!valid || value === undefined || !drive.current) return;
    drive.current.setOptions({ reduced: reducedMotion(), sound });
    drive.current.set(driveTargets(valid, value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // A state change: parts spring to the state's poses, the lamp relights, and the state's news plays
  // (through the act when the state enters with one, else straight on the beeper).
  const shown = React.useRef(first.current);
  React.useEffect(() => {
    if (!valid || state === shown.current) return;
    shown.current = state;
    setLampCue(null);
    const st = valid.states[state], bind = valid.mechanism.bind as Record<string, string>, p = player.current;
    beepFor.current = st.beep ?? null;
    landing.current = false;
    // A momentary mechanism's parts spring to the state's poses and may act; a held one stays where its value put it.
    const away = p?.pose('plug'), far = !!away && Math.hypot(away.x, away.y) > 2;
    p?.setOptions({ reduced: reducedMotion() });
    p?.holdPose('plug', formPoses(valid, state)[bind.plug] ?? null);
    if (p && st.enter === 'act' && far && !reducedMotion()) landing.current = true;       // it flies home, then lands
    else if (p && st.enter === 'act' && far) p.land();
    else if (p && st.enter === 'act') p.act();
    else if (st.beep) {
      sound?.beep(st.beep);
      const b = ref.current?.querySelector(`[data-id="${bind.beeper}"]`);
      if (b) playBeeper(b, st.beep, { reduced: reducedMotion(), width: GADGETS.parts.beeper.size[0] });
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // An act asked for from outside: the mechanism plays; the beeper speaks only if the state has news.
  const acted = React.useRef(act);
  React.useEffect(() => {
    if (!valid || act === acted.current) return;
    acted.current = act;
    beepFor.current = null;
    player.current?.setOptions({ reduced: reducedMotion() });
    player.current?.act();
  }, [act]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!valid || !drawn || !parts || !lamp) {
    return <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label="invalid gadget" data-invalid="true" {...props} />;
  }
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-labelledby={`g${uid}-t g${uid}-d`}
      data-gadget={valid.name} data-state={state} data-tier={tier} data-host={host} className="overflow-visible" {...props}>
      <title id={`g${uid}-t`}>{valid.title}</title>
      <desc id={`g${uid}-d`}>{drawn.description}</desc>
      <defs dangerouslySetInnerHTML={{ __html: drawn.body.defs + parts.defs + lamp.defs }} />
      <g data-layer="body" pointerEvents="none" dangerouslySetInnerHTML={{ __html: drawn.body.html }} />
      <g data-layer="parts" pointerEvents="none" dangerouslySetInnerHTML={{ __html: parts.html }} />
      <g data-layer="lamp" pointerEvents="none" key={lampCue?.beat ?? 0} dangerouslySetInnerHTML={{ __html: lamp.html }} />
    </svg>
  );
}
