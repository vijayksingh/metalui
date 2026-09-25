// The mechanism player: one clock drives a gadget's motion, lamp and sound from one cue list
// (mechanisms.generated.ts), so the click is heard the moment the plug lands and the lamp answers
// it. Motion runs on requestAnimationFrame through the same sampler SwiftUI uses, so a state change
// mid-act can spring from exactly where a part is, with its velocity kept (engine LLD §6.3).
import { MECHANISMS } from './mechanisms.generated';
import { SPRINGS } from '../motion/springs.generated';

export type MechanismName = keyof typeof MECHANISMS;
export interface Pose { x: number; y: number; r: number; sx: number; sy: number }
type Bezier = readonly [number, number, number, number];
interface Frame { at: number; pose: Pose; opacity: number | null; ease: Bezier }
interface Track { part: string; frames: readonly Frame[] }
export type Cue =
  | { at: number; kind: 'strike'; slot: string; level: number; pitch: number }
  | { at: number; kind: 'lamp'; gesture: string }
  | { at: number; kind: 'beep' }
  | { at: number; until: number; kind: 'friction'; slot: string; level: number }
  | { kind: 'detent'; slot: string; level: number }
  | { kind: 'stop'; slot: string; level: number };
interface Mechanism {
  name: string; mode: 'momentary' | 'held'; duration: number; stagger?: number; loop?: boolean; phase?: Record<string, { by: string; about: string }> | null; spring: string; caption: string;
  tracks: readonly Track[]; cues: readonly Cue[]; states: Record<string, { hold: string; pose: Partial<Pose> }>; reduced: readonly string[];
}

export const REST: Pose = { x: 0, y: 0, r: 0, sx: 1, sy: 1 };

/** A cubic-bezier easing at x (the same Newton solve as the build's sampler and SwiftUI's). */
export function bezier([x1, y1, x2, y2]: Bezier, x: number): number {
  if (x1 === y1 && x2 === y2) return x;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
    const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
    if (Math.abs(cx) < 1e-6 || d === 0) break;
    t = Math.min(1, Math.max(0, t - cx / d));
  }
  return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
}

/** A track's pose and opacity at `at` ms. */
export function sampleTrack(frames: readonly Frame[], at: number): { pose: Pose; opacity: number | null } {
  const i = frames.findIndex((f) => f.at >= at);
  if (i <= 0) { const f = frames[Math.max(0, i)]; return { pose: { ...f.pose }, opacity: f.opacity }; }
  if (i < 0) { const f = frames[frames.length - 1]; return { pose: { ...f.pose }, opacity: f.opacity }; }
  const a = frames[i - 1], b = frames[i], k = bezier(a.ease, (at - a.at) / (b.at - a.at));
  const lerp = (u: number, v: number) => u + (v - u) * k;
  return {
    pose: { x: lerp(a.pose.x, b.pose.x), y: lerp(a.pose.y, b.pose.y), r: lerp(a.pose.r, b.pose.r), sx: lerp(a.pose.sx, b.pose.sx), sy: lerp(a.pose.sy, b.pose.sy) },
    opacity: a.opacity === null ? null : lerp(a.opacity, b.opacity ?? a.opacity),
  };
}

export interface CueEvent { at: number; cue: Cue; skipped?: 'reduced' | 'cancelled' }
export interface PlayerOptions {
  /** Canvas-unit centre each part turns and scales about; one per actor when a slot binds many. */
  origins?: Record<string, [number, number] | [number, number][]>;
  reduced?: boolean;
  /** Slow motion for the docs: 0.25 plays at a quarter speed. Sound keeps its own time. */
  speed?: number;
  /** A strike cue, handed over at the start of the act with its delay in seconds (and which actor struck). */
  onStrike?: (cue: Extract<Cue, { kind: 'strike' }>, delay: number, actor: number) => void;
  onLamp?: (gesture: string) => void;
  onBeep?: () => void;
  /** Every cue as it happens, with `skipped` when reduced motion or a state change dropped it. */
  onCue?: (e: CueEvent) => void;
  /** Every frame, each part's pose (for readouts and timelines). */
  onFrame?: (t: number, poses: Record<string, Pose>) => void;
  /** Each actor's own start, ms, for a slot the mechanism phases (a blip lit when the beam reaches
   *  it): the caller knows where the actors sit, so it says when each one's moment is. */
  offsets?: Record<string, number[]>;
  /** An act has finished (a looping mechanism's caller may play it again). */
  onEnd?: () => void;
}

export interface Player {
  /** Plays the act. A second act while one plays is ignored (returns false). */
  act(): boolean;
  /** Stops an act where it is (a state change): its pending lamp and beep are cancelled. */
  stop(): void;
  /** Springs to a state's held pose (or rest with null), from wherever the part is now. */
  hold(state: string | null): void;
  /** Plays only the act's landing (its cues from the last strike on), now: for a part that came home
   *  another way, like a plug springing back into its socket from lying aside. */
  land(): void;
  /** Springs one part to a pose given outright (a gadget state's form), or snaps with `immediate`. Its
   *  shadow moves with it: a plug held out lies on the panel, so its shadow lies under it. */
  holdPose(part: string, pose: Partial<Pose> | null, o?: { immediate?: boolean }): void;
  readonly playing: boolean;
  pose(part: string): Pose;
  setOptions(o: Partial<PlayerOptions>): void;
  destroy(): void;
}

const SCALE_SLACK = 20; // a scale step reads like 20 units of travel when deciding a spring is still

export function createPlayer(name: MechanismName, parts: Record<string, Element | Element[] | null | undefined>, options: PlayerOptions = {}): Player {
  const m = MECHANISMS[name] as unknown as Mechanism;
  // A slot may bind many actors (a chord's keys): each plays the same track, `stagger` ms after the last.
  const actors = (part: string): Element[] => { const el = parts[part]; return !el ? [] : Array.isArray(el) ? el : [el]; };
  // When each actor of a slot starts: its phase offset if the caller gave one, else a stagger apart.
  const startOf = (part: string, i: number) => o.offsets?.[part.split('.')[0]]?.[i] ?? i * (m.stagger ?? 0);
  const totalOf = () => Math.max(m.duration, ...m.tracks.flatMap((t) => actors(t.part).map((_, i) => startOf(t.part, i) + t.frames[t.frames.length - 1].at)));
  let o: PlayerOptions = { speed: 1, ...options };
  const poses: Record<string, Pose> = {}, velocity: Record<string, Pose> = {}, target: Record<string, Pose> = {};
  for (const t of m.tracks) { poses[t.part] = { ...REST }; velocity[t.part] = { x: 0, y: 0, r: 0, sx: 0, sy: 0 }; target[t.part] = { ...REST }; }
  let raf = 0, act: { t0: number; timers: number[] } | null = null, springing = false;

  const apply = (part: string, p: Pose, opacity?: number | null, only?: number) => {
    actors(part).forEach((el, i) => {
      if (only !== undefined && i !== only) return;
      const o0 = o.origins?.[part.split('.')[0]], [cx, cy] = (Array.isArray(o0?.[0]) ? (o0 as [number, number][])[i] : (o0 as [number, number] | undefined)) ?? [0, 0];
      el.setAttribute('transform', `translate(${cx + p.x} ${cy + p.y}) rotate(${p.r}) scale(${p.sx} ${p.sy}) translate(${-cx} ${-cy})`);
      if (opacity !== undefined && opacity !== null) (el as HTMLElement).style.opacity = String(opacity);
    });
  };
  const frame = () => {
    raf = 0;
    const now = performance.now();
    if (act) {
      const t = (now - act.t0) * (o.speed ?? 1);
      for (const tr of m.tracks) {
        const n = Math.max(1, actors(tr.part).length);
        for (let i = 0; i < n; i++) {
          const s = sampleTrack(tr.frames, Math.min(Math.max(0, t - startOf(tr.part, i)), m.duration));
          if (i === 0) poses[tr.part] = s.pose;
          apply(tr.part, s.pose, s.opacity, i);
        }
      }
      const total = totalOf();
      o.onFrame?.(Math.min(t, total), { ...poses });
      if (t >= total) {
        act = null;
        // A part held away from rest (a full drawer, stuck out) springs back to where it is held.
        if (Object.keys(target).some((k) => (Object.keys(REST) as (keyof Pose)[]).some((c) => target[k][c] !== poses[k]?.[c]))) { springing = true; raf = requestAnimationFrame(frame); }
        o.onEnd?.();
      } else { raf = requestAnimationFrame(frame); return; }
    }
    if (springing) stepSprings();
  };
  // Held poses: the mechanism's mass-class spring, integrated per frame, keeping velocity on retarget.
  let last = 0;
  const stepSprings = () => {
    const now = performance.now(), dt = Math.min(0.032, last ? (now - last) / 1000 : 1 / 60) * (o.speed ?? 1);
    last = now;
    const sp = SPRINGS[m.spring as keyof typeof SPRINGS] ?? SPRINGS.part;
    let moving = false;
    for (const part of Object.keys(target)) {
      const p = poses[part], v = velocity[part], g = target[part];
      for (const k of Object.keys(p) as (keyof Pose)[]) {
        for (let i = 0; i < 4; i++) {        // four substeps: stable at any frame rate
          const h = dt / 4, a = -sp.stiffness * (p[k] - g[k]) - sp.damping * v[k];
          v[k] += a * h; p[k] += v[k] * h;
        }
        const w = k === 'sx' || k === 'sy' ? SCALE_SLACK : 1;
        if (Math.abs(p[k] - g[k]) * w > 0.02 || Math.abs(v[k]) * w > 0.05) moving = true;
      }
      if (!moving) { Object.assign(p, g); Object.assign(v, { x: 0, y: 0, r: 0, sx: 0, sy: 0 }); }
      apply(part, p);
    }
    o.onFrame?.(-1, { ...poses });
    springing = moving;
    if (moving) raf = requestAnimationFrame(frame); else last = 0;
  };

  const player: Player = {
    get playing() { return !!act; },
    pose: (part) => ({ ...(poses[part] ?? REST) }),
    setOptions(next) { o = { ...o, ...next }; },
    act() {
      if (act || m.mode !== 'momentary') return false;
      const keep = new Set(m.reduced);
      // Reduced motion drops the travel, unless the mechanism keeps it (a key still dips its few units).
      const reduced = !!o.reduced && !keep.has('press'), speed = o.speed ?? 1;
      const timers: number[] = [];
      for (const cue of m.cues) {
        if (cue.kind === 'detent' || cue.kind === 'stop') continue;      // held cues follow a drive, not a clock
        if (cue.kind === 'friction') { o.onCue?.({ at: cue.at, cue, skipped: reduced ? 'reduced' : undefined }); continue; }
        if (reduced && !keep.has(cue.kind === 'strike' || cue.kind === 'beep' ? 'sound' : 'lamp')) { o.onCue?.({ at: cue.at, cue, skipped: 'reduced' }); continue; }
        // A strike on a slot of many actors strikes each of them, a stagger apart; a lamp or beep plays once.
        const n = cue.kind === 'strike' ? Math.max(1, actors(cue.slot).length) : 1;
        for (let i = 0; i < n; i++) {
          const at = reduced ? 0 : cue.at + (cue.kind === 'strike' ? startOf(cue.slot, i) : 0);
          // Strikes go to the audio clock now, so they land sample-accurately; the rest wait on timers.
          if (cue.kind === 'strike') o.onStrike?.(cue, at / 1000, i);
          timers.push(window.setTimeout(() => {
            if (cue.kind === 'lamp') o.onLamp?.(cue.gesture);
            if (cue.kind === 'beep') o.onBeep?.();
            o.onCue?.({ at, cue });
          }, at / (reduced ? 1 : speed)));
        }
      }
      if (reduced) {                                   // no travel: the act is its sound and its lamp
        act = { t0: performance.now(), timers };
        window.setTimeout(() => { act = null; }, 0);
        return true;
      }
      springing = false;
      act = { t0: performance.now(), timers };
      if (!raf) raf = requestAnimationFrame(frame);
      return true;
    },
    hold(state) {
      const h = state ? m.states[state] : null;
      // A state change mid-act: the act stops where it is (its sound already scheduled plays out),
      // its pending lamp and beep are cancelled, and the part springs on from its current pose.
      if (act) {
        for (const id of act.timers) clearTimeout(id);
        act = null;
      }
      for (const part of Object.keys(target)) {
        const base = part.split('.')[0];
        target[part] = h && h.hold === base ? { ...REST, ...h.pose } : { ...REST };
        if (part.includes('.')) target[part] = { ...REST };
      }
      if (o.reduced) {
        for (const part of Object.keys(target)) { poses[part] = { ...target[part] }; apply(part, poses[part], 1); }
        o.onFrame?.(-1, { ...poses });
        return;
      }
      for (const part of Object.keys(target)) apply(part, poses[part], 1);
      springing = true;
      if (!raf) raf = requestAnimationFrame(frame);
    },
    stop() {
      if (!act) return;
      for (const id of act.timers) clearTimeout(id);
      act = null;
    },
    land() {
      const strikes = m.cues.filter((c) => c.kind === 'strike') as Extract<Cue, { kind: 'strike' }>[];
      const from = strikes.length ? Math.max(...strikes.map((c) => c.at)) : 0;
      for (const cue of m.cues) {
        if (cue.kind === 'detent' || cue.kind === 'stop' || cue.kind === 'friction' || cue.at < from) continue;
        const at = cue.at - from;
        if (cue.kind === 'strike') o.onStrike?.(cue, at / 1000, 0);
        window.setTimeout(() => {
          if (cue.kind === 'lamp') o.onLamp?.(cue.gesture);
          if (cue.kind === 'beep') o.onBeep?.();
          o.onCue?.({ at, cue });
        }, at);
      }
    },
    holdPose(part, pose, opt = {}) {
      if (!(part in target)) return;
      if (act) { for (const id of act.timers) clearTimeout(id); act = null; }
      target[part] = { ...REST, ...pose };
      const shadow = `${part}.shadow`;
      if (shadow in target) target[shadow] = { ...REST, x: pose?.x ?? 0, y: pose?.y ?? 0 };
      if (o.reduced || opt.immediate) {
        for (const k of [part, shadow]) if (k in target) { poses[k] = { ...target[k] }; velocity[k] = { x: 0, y: 0, r: 0, sx: 0, sy: 0 }; apply(k, poses[k], 1); }
        o.onFrame?.(-1, { ...poses });
        return;
      }
      springing = true;
      if (!raf) raf = requestAnimationFrame(frame);
    },
    destroy() { if (raf) cancelAnimationFrame(raf); if (act) for (const id of act.timers) clearTimeout(id); act = null; },
  };
  for (const part of Object.keys(poses)) apply(part, poses[part]);
  return player;
}
