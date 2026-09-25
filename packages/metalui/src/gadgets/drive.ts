// The drive: how a held mechanism moves. Each actor has a value from 0 to 1 (a place along its
// travel, between the mechanism's `from` and `to` poses), carried to a new target on the mechanism's
// spring, keeping its velocity when the target changes again. The ends of the travel are walls: an
// actor that reaches one comes back a little and knocks, as hard as it hit. Crossing a detent ticks,
// but only while it is really moving. Actors bound to one slot start `stagger` ms apart.
//
// The model advances in fixed steps (`held.step` a second), so it lands on the same numbers wherever
// it runs: this file for the web, MetalDrive for SwiftUI, and the fixture that proves they agree.
import { MECHANISMS } from './mechanisms.generated';
import { SPRINGS } from '../motion/springs.generated';
import type { Pose } from './player';
import { GADGETS } from './gadgets.generated';
import type { Scrape, Sound, SoundMaterial } from '../sound/sound';

interface Held {
  slot: string; from: Partial<Pose>; to: Partial<Pose>; detents: number; stagger: number;
  wall: number; impactFull: number; scrapeFull: number; tickMin: number; tickGap: number; step: number;
}
export type DriveName = { [K in keyof typeof MECHANISMS]: (typeof MECHANISMS)[K] extends { held: object } ? K : never }[keyof typeof MECHANISMS];
export type DriveEvent =
  | { kind: 'detent'; actor: number; at: number; level: number }
  | { kind: 'stop'; actor: number; at: number; level: number; end: 0 | 1 };

const heldOf = (name: string) => (MECHANISMS as unknown as Record<string, { held: Held | null; spring: string; reduced: readonly string[]; cues: { kind: string; level?: number }[] }>)[name];

/** The drive as numbers: no DOM, no clock of its own. `advance(ms)` steps it to that time. */
export class DriveModel {
  readonly held: Held;
  private readonly k: number;
  private readonly c: number;
  private readonly levels: { detent: number; stop: number; scrape: number };
  x: number[]; v: number[]; target: number[];
  private pending: ({ value: number; at: number } | null)[];
  private lastTick: number[];
  private readonly keepsSound: boolean;
  t = 0;

  constructor(name: string, start: number[]) {
    const m = heldOf(name);
    if (!m?.held) throw new Error(`${name} is not a held mechanism`);
    this.held = m.held;
    const sp = SPRINGS[m.spring as keyof typeof SPRINGS] ?? SPRINGS.part;
    this.k = sp.stiffness; this.c = sp.damping;
    const level = (kind: string) => m.cues.find((q) => q.kind === kind)?.level ?? 0;
    this.levels = { detent: level('detent'), stop: level('stop'), scrape: level('friction') };
    this.keepsSound = m.reduced.includes('sound');
    this.x = start.map(clamp01); this.v = start.map(() => 0); this.target = [...this.x];
    this.pending = start.map(() => null); this.lastTick = start.map(() => -Infinity);
  }

  /** New targets from now: each actor starts `stagger` ms after the one before it. Same targets, nothing. */
  retarget(values: number[]) {
    let order = 0;
    values.forEach((raw, i) => {
      const value = clamp01(raw), now = this.pending[i]?.value ?? this.target[i];
      if (Math.abs(value - now) < 1e-9) return;
      this.pending[i] = { value, at: this.t + order++ * this.held.stagger };
    });
  }

  /** Jumps every actor to its target (reduced motion). Each one that moved ticks once, if the
   *  mechanism keeps its sound under reduced motion: it arrived, without the travel. */
  snap(values: number[]): DriveEvent[] {
    const out: DriveEvent[] = [];
    values.forEach((raw, i) => {
      const value = clamp01(raw);
      if (Math.abs(value - this.x[i]) > 1e-9 && this.keepsSound) out.push({ kind: 'detent', actor: i, at: this.t, level: this.levels.detent });
      this.x[i] = this.target[i] = value; this.v[i] = 0; this.pending[i] = null;
    });
    return out;
  }

  /** Steps to `to` ms, returning what happened on the way. */
  advance(to: number): DriveEvent[] {
    const out: DriveEvent[] = [], h = 1 / this.held.step, hms = 1000 / this.held.step, H = this.held;
    while (this.t + hms <= to + 1e-9) {
      this.t += hms;
      for (let i = 0; i < this.x.length; i++) {
        const p = this.pending[i];
        if (p && this.t >= p.at) { this.target[i] = p.value; this.pending[i] = null; }
        const before = this.x[i];
        this.v[i] += (-this.k * (this.x[i] - this.target[i]) - this.c * this.v[i]) * h;
        this.x[i] += this.v[i] * h;
        // The ends are walls: it comes back a little, and knocks as hard as it hit.
        for (const end of [0, 1] as const) {
          const past = end === 0 ? this.x[i] < 0 : this.x[i] > 1;
          if (!past) continue;
          const impact = Math.abs(this.v[i]);
          this.x[i] = end; this.v[i] = -this.v[i] * H.wall;
          // Resting against a wall is contact, not a knock: too slow to hear, like a wobble past a detent.
          if (impact >= H.tickMin) out.push({ kind: 'stop', actor: i, at: this.t, end, level: this.levels.stop * Math.min(1, impact / H.impactFull) });
        }
        // A detent crossed at speed ticks; a slow wobble across one does not.
        if (H.detents > 0) {
          // Detents lie inside the travel: reaching an end is the wall's knock, not a tick.
          const cell = (u: number) => Math.min(H.detents - 1, Math.floor(u * H.detents + 1e-9));
          const a = cell(before), b = cell(this.x[i]);
          if (a !== b && Math.abs(this.v[i]) >= H.tickMin && this.t - this.lastTick[i] >= H.tickGap) {
            this.lastTick[i] = this.t;
            out.push({ kind: 'detent', actor: i, at: this.t, level: this.levels.detent });
          }
        }
      }
    }
    return out;
  }

  /** Still: every actor at its target, at rest, with nothing pending. */
  get settled() {
    return this.pending.every((p) => !p) && this.x.every((x, i) => Math.abs(x - this.target[i]) < 1e-3 && Math.abs(this.v[i]) < 1e-2);
  }
  /** How fast the fastest actor slides, 0 to 1 of the scrape's full speed. */
  get scrapeSpeed() { return Math.min(1, Math.max(0, ...this.v.map(Math.abs)) / this.held.scrapeFull); }
  get scrapeLevel() { return this.levels.scrape; }

  /** An actor's pose at its value: between `from` and `to`. */
  pose(i: number): Pose {
    const f = { x: 0, y: 0, r: 0, sx: 1, sy: 1, ...this.held.from }, g = { x: 0, y: 0, r: 0, sx: 1, sy: 1, ...this.held.to }, u = this.x[i];
    return { x: f.x + (g.x - f.x) * u, y: f.y + (g.y - f.y) * u, r: f.r + (g.r - f.r) * u, sx: f.sx + (g.sx - f.sx) * u, sy: f.sy + (g.sy - f.sy) * u };
  }
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export interface DriveOptions {
  reduced?: boolean;
  /** Plays the motion: detents tick and ends knock in `material`, and it scrapes while it moves. */
  sound?: Sound | null;
  material?: SoundMaterial;
  /** The actor's longest side on the canvas, for the pitch of its knock. */
  partSize?: number;
  /** A detent crossed or an end hit, as it happens. */
  onEvent?: (e: DriveEvent) => void;
  /** The scrape's speed, each frame it moves (0 when it stops). */
  onScrape?: (speed: number, level: number) => void;
  /** Every frame, each actor's value. */
  onFrame?: (values: number[]) => void;
}

export interface Drive {
  /** Moves the actors to these values (0 to 1 each). */
  set(values: number[]): void;
  readonly values: number[];
  readonly moving: boolean;
  /** The drive's own clock, ms: event times are on it. */
  readonly time: number;
  setOptions(o: Partial<DriveOptions>): void;
  destroy(): void;
}

/** Runs a held mechanism on drawn actors: writes each one's transform every frame while it moves. */
export function createDrive(name: DriveName, actors: (Element | null | undefined)[], start: number[], options: DriveOptions = {}): Drive {
  const model = new DriveModel(name, start);
  let o = options, raf = 0, t0 = 0, moving = false;
  const paint = () => actors.forEach((el, i) => {
    if (!el) return;
    const p = model.pose(i);
    el.setAttribute('transform', `translate(${+p.x.toFixed(3)} ${+p.y.toFixed(3)})`);
  });
  const D = GADGETS.drive;
  let scrape: Scrape | null = null;
  const play = (e: DriveEvent) => {
    const m = o.material ?? 'clay', size = o.partSize ?? GADGETS.parts.cap.size[0];
    if (e.kind === 'detent') o.sound?.strike(m, { size: size * D.detentSize, level: e.level, pitch: D.detentPitch });
    else o.sound?.strike(m, { size, level: e.level, pitch: e.end === 1 ? D.stopPitch[1] : D.stopPitch[0] });
  };
  const frame = () => {
    raf = 0;
    for (const e of model.advance(performance.now() - t0)) { play(e); o.onEvent?.(e); }
    paint();
    o.onFrame?.([...model.x]);
    if (model.settled) { moving = false; scrape?.stop(); scrape = null; o.onScrape?.(0, model.scrapeLevel); return; }
    if (!scrape && o.sound) scrape = o.sound.scrape(o.material ?? 'clay', { level: model.scrapeLevel });
    scrape?.set(model.scrapeSpeed);
    o.onScrape?.(model.scrapeSpeed, model.scrapeLevel);
    raf = requestAnimationFrame(frame);
  };
  paint();
  return {
    set(values) {
      if (o.reduced) { for (const e of model.snap(values)) { play(e); o.onEvent?.(e); } paint(); o.onFrame?.([...model.x]); return; }
      if (!moving) { t0 = performance.now() - model.t; moving = true; }
      model.retarget(values);
      if (!raf) raf = requestAnimationFrame(frame);
    },
    get values() { return [...model.x]; },
    get moving() { return moving; },
    get time() { return model.t; },
    setOptions(next) { o = { ...o, ...next }; },
    destroy() { if (raf) cancelAnimationFrame(raf); raf = 0; moving = false; scrape?.stop(); scrape = null; },
  };
}
