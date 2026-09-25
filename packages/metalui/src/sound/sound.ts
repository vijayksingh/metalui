// The sound foundation for the web: plays the material and beeper recipes from
// tokens.json (recipes.generated.ts) with Web Audio. Modal synthesis: a strike is the
// material's modes (decaying partials) plus its contact noise; a beep is a piezo.
// Off until a person opts in; `enable()` must run inside a user gesture.
import { SOUND, SOUND_MATERIALS, type Earcon, type Reach, type SoundMaterial } from './recipes.generated';

export type { Earcon, Reach, SoundMaterial } from './recipes.generated';
export { SOUND, SOUND_MATERIALS, EARCONS } from './recipes.generated';

export type Plays = keyof typeof SOUND.policy.plays;

export interface SoundSettings {
  /** Off by default; people opt in once. */
  on: boolean;
  /** 'acts': acts and changes of state make sound. 'states': only changes of state. */
  plays: Plays;
  /** Which materials may sound. */
  materials: Record<SoundMaterial, boolean>;
}

export interface StrikeOptions {
  /** The struck part's longest side, in the 400-unit drawing (the body is 320). Sets pitch and ring. */
  size?: number;
  /** How heavy the object is, 0 to 1: lower pitch, and a thump through hard materials. */
  weight?: number;
  /** Where the act goes. */
  reach?: Reach;
  /** 0 to 1, relative to the act level. */
  level?: number;
  /** Seconds from now. */
  delay?: number;
  /** The rendered size in points: small things are quieter. */
  rendered?: number;
  /** A stable name for the playing thing, for the rate limit and the session decay. */
  key?: string;
  /** Multiplies the fundamental: below 1 a part sounds lower (a soft pull), above 1 higher (a cap hitting its top stop). */
  pitch?: number;
  /** Tuning, for the docs workbench: scales the recipe without editing tokens. */
  tune?: { f0x?: number; tone?: number; loud?: number; decay?: number };
}

type Recipe = {
  f0x: number; tone: number; loud: number; attackMs: number; maxMs: number; thump?: boolean; noisyModes?: boolean;
  modes: readonly (readonly number[])[];
  noise: readonly { type: string; f: number; q?: number; ms: number; gain: number }[];
  grit?: { n: number; spreadMs: number; f: number; level: number };
  bounce?: { ms: number; level: number };
};
const recipeOf = (material: SoundMaterial) => SOUND.materials[material] as unknown as Recipe;

export type SoundSkip = 'off' | 'plays' | 'material' | 'rate' | 'no-audio';
export type SoundEvent =
  | { kind: 'strike'; material: SoundMaterial; f0: number; peak: number; skipped?: SoundSkip }
  | { kind: 'scrape'; material: SoundMaterial; skipped?: SoundSkip }
  | { kind: 'beep'; earcon: Earcon; skipped?: SoundSkip };

export interface Sound {
  readonly settings: SoundSettings;
  configure(next: Partial<SoundSettings>): void;
  /** Creates or resumes the audio context and turns sound on. Call it from a click or key press. */
  enable(): Promise<void>;
  disable(): void;
  /** Strikes a part of a material. Returns whether it played. */
  strike(material: SoundMaterial, options?: StrikeOptions): boolean;
  /** Starts a part sliding along another. Drive it with `set(speed)` (0 to 1) as it moves; `stop()` lets it die away. */
  scrape(material: SoundMaterial, options?: { reach?: Reach; rendered?: number }): Scrape;
  /** Plays a change of state on the beeper. Returns whether it played. */
  beep(earcon: Earcon, options?: { key?: string; rendered?: number }): boolean;
  /** The fundamental a part would ring at. */
  fundamental(material: SoundMaterial, size?: number, weight?: number): number;
  subscribe(listener: (event: SoundEvent) => void): () => void;
}

/** A sliding contact, live: its level and band follow the speed it is given. */
export interface Scrape {
  /** How fast the part is moving now, 0 to 1. */
  set(speed: number): void;
  /** It has stopped: the sound dies away in release-ms. */
  stop(): void;
  readonly playing: boolean;
}

const dB = (d: number) => 10 ** (d / 20);
const vary = (x: number, pct: number) => x * (1 + (Math.random() * 2 - 1) * pct);
const P = SOUND.policy;

function sizeGain(rendered: number) {
  const steps = P.sizeGain;
  if (rendered <= steps[0][0]) return steps[0][1];
  for (let i = 1; i < steps.length; i++) {
    const [s0, g0] = steps[i - 1], [s1, g1] = steps[i];
    if (rendered <= s1) return g0 + ((g1 - g0) * (rendered - s0)) / (s1 - s0);
  }
  return steps[steps.length - 1][1];
}

export function createSound(initial: Partial<SoundSettings> = {}): Sound {
  const settings: SoundSettings = {
    on: false,
    plays: 'acts',
    materials: Object.fromEntries(SOUND_MATERIALS.map((m) => [m, true])) as Record<SoundMaterial, boolean>,
    ...initial,
  };
  const listeners = new Set<(e: SoundEvent) => void>();
  const plays = new Map<string, number[]>();      // key → play times (ms), for the rate limit
  const counts = new Map<string, number>();       // key → plays this session, for the decay
  let ctx: AudioContext | null = null;
  let master: GainNode, room: GainNode;

  const emit = (e: SoundEvent) => listeners.forEach((l) => l(e));

  function boot() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = P.levelDb.limit; limit.ratio.value = 12; limit.attack.value = 0.002; limit.release.value = 0.1;
    master.connect(limit); limit.connect(ctx.destination);
    const conv = ctx.createConvolver(), len = Math.floor(ctx.sampleRate * SOUND.room.seconds), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** SOUND.room.curve; }
    conv.buffer = ir; room = ctx.createGain(); room.connect(conv); conv.connect(master);
  }

  function out(node: AudioNode, reach: Reach) {
    const r = SOUND.reach[reach], pan = ctx!.createStereoPanner();
    pan.pan.value = r.pan; node.connect(pan); pan.connect(master);
    const send = ctx!.createGain(); send.gain.value = r.send; pan.connect(send); send.connect(room);
  }

  function noise(t: number, layer: { type: string; f: number; q?: number; ms: number; gain: number }, peak: number, reach: Reach) {
    const c = ctx!, dur = vary(layer.ms, P.vary.decay) / 1000, n = Math.ceil(c.sampleRate * (dur + 0.01));
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), flt = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; flt.type = layer.type as BiquadFilterType; flt.frequency.value = vary(layer.f, P.vary.filter);
    if (layer.q) flt.Q.value = layer.q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak * layer.gain, t + SOUND.render.contactAttackMs / 1000); g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
    src.connect(flt); flt.connect(g); out(g, reach); src.start(t); src.stop(t + dur + 0.02);
  }

  const pitch = (f0x: number, size: number, weight: number) =>
    SOUND.pitch.base * Math.sqrt(SOUND.pitch.ref / size) * (1 - SOUND.pitch.heavy * weight) * f0x;
  const fundamental = (material: SoundMaterial, size: number = SOUND.pitch.body, weight = 0) => pitch(recipeOf(material).f0x, size, weight);

  function render(m: Recipe, f0: number, peak: number, t: number, size: number, reach: Reach, echo = false) {
    const c = ctx!;
    const damp = Math.sqrt(size / SOUND.pitch.body), cap = m.maxMs / 1000, attack = m.attackMs / 1000;
    for (const mode of m.modes) {
      const [ratio, gain, decay, glideTo, glideMs] = mode;
      const f = f0 * ratio; if (f > SOUND.render.ceilingHz) continue;
      const T = Math.min(cap, (vary(decay, P.vary.decay) / 1000) * damp);
      if (m.noisyModes) { noise(t, { type: 'bandpass', f, q: SOUND.render.bandQ, ms: T * 1000, gain: gain * m.tone * SOUND.render.bandGain }, peak, reach); continue; }
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(f, t);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(f * glideTo, t + glideMs / 1000);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak * gain * m.tone, t + attack); g.gain.exponentialRampToValueAtTime(1e-4, t + attack + T);
      o.connect(g); out(g, reach); o.start(t); o.stop(t + attack + T + 0.05);
    }
    for (const layer of m.noise) noise(t, layer, peak, reach);
    if (m.grit) for (let i = 0; i < m.grit.n; i++)
      noise(t + (Math.random() * m.grit.spreadMs) / 1000, { type: 'bandpass', f: vary(m.grit.f, SOUND.render.gritSpread), q: SOUND.render.gritQ, ms: SOUND.render.gritMs, gain: m.grit.level * (0.5 + Math.random()) }, peak, reach);
    if (m.bounce && !echo) render(m, f0 * SOUND.render.bouncePitch, peak * m.bounce.level, t + m.bounce.ms / 1000, size, reach, true);
  }

  function thump(t: number, peak: number, weight: number) {
    const c = ctx!, o = c.createOscillator(), g = c.createGain(), th = SOUND.thump;
    o.frequency.setValueAtTime(th.from, t); o.frequency.exponentialRampToValueAtTime(th.to, t + th.ms / 1000);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak * th.level * weight, t + 0.003); g.gain.exponentialRampToValueAtTime(1e-4, t + (th.ms + 10) / 1000);
    o.connect(g); out(g, 'own'); o.start(t); o.stop(t + (th.ms + 30) / 1000);
  }

  /** The rate limit and the session decay, per playing thing. Returns a gain, or 0 to skip. */
  function allow(key: string) {
    const now = performance.now(), times = (plays.get(key) ?? []).filter((x) => now - x < P.rate.burstWindowMs);
    if (times.length && now - times[times.length - 1] < P.rate.gapMs) return 0;
    if (times.length >= P.rate.burst) return 0;
    times.push(now); plays.set(key, times);
    const n = (counts.get(key) ?? 0) + 1; counts.set(key, n);
    const drop = P.decayAfter.reduce((d, [after, db]) => (n > after ? db : d), 0);
    return dB(drop);
  }

  return {
    settings,
    configure(next) { Object.assign(settings, next); if (next.materials) settings.materials = { ...settings.materials, ...next.materials }; },
    async enable() { if (!ctx) boot(); await ctx!.resume(); settings.on = true; },
    disable() { settings.on = false; },
    fundamental,
    subscribe(l) { listeners.add(l); return () => listeners.delete(l); },

    strike(material, o = {}) {
      const base = recipeOf(material), tune = o.tune ?? {};
      const m: Recipe = {
        ...base, f0x: tune.f0x ?? base.f0x, tone: tune.tone ?? base.tone, loud: tune.loud ?? base.loud,
        modes: tune.decay ? base.modes.map(([r, g, d, ...rest]) => [r, g, d * tune.decay!, ...rest]) : base.modes,
      };
      const size = o.size ?? SOUND.pitch.body, weight = o.weight ?? 0, f0 = vary(pitch(m.f0x, size, weight) * (o.pitch ?? 1), P.vary.f0);
      const skip: SoundSkip | undefined = !settings.on ? 'off' : settings.plays !== 'acts' ? 'plays' : !settings.materials[material] ? 'material' : !ctx ? 'no-audio' : undefined;
      const gate = skip ? 0 : o.key ? allow(o.key) : 1;
      const peak = dB(P.levelDb.act) * (o.level ?? 1) * m.loud * sizeGain(o.rendered ?? 160) * gate;
      emit({ kind: 'strike', material, f0, peak, skipped: skip ?? (gate ? undefined : 'rate') });
      if (!peak) return false;
      const t = ctx!.currentTime + 0.005 + (o.delay ?? 0);
      render(m, f0, peak, t, size, o.reach ?? 'own');
      if (weight > SOUND.thump.above && m.thump !== false) thump(t, dB(P.levelDb.act) * (o.level ?? 1), weight);
      return true;
    },

    scrape(material, o = {}) {
      const skip: SoundSkip | undefined = !settings.on ? 'off' : settings.plays !== 'acts' ? 'plays' : !settings.materials[material] ? 'material' : !ctx ? 'no-audio' : undefined;
      emit({ kind: 'scrape', material, skipped: skip });
      if (skip) return { set() {}, stop() {}, playing: false };
      const c = ctx!, R = SOUND.scrape, m = R.materials[material], reach = o.reach ?? 'own';
      const full = dB(R.levelDb) * m.gain * sizeGain(o.rendered ?? 160);
      // A second of noise, looped, through the material's contact band; the gain is the speed.
      const n = c.sampleRate, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(), band = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; src.loop = true;
      band.type = 'bandpass'; band.frequency.value = m.f; band.Q.value = m.q;
      g.gain.value = 0;
      src.connect(band); band.connect(g); out(g, reach); src.start();
      let playing = true, last = performance.now();
      return {
        get playing() { return playing; },
        set(speed) {
          if (!playing) return;
          const v = Math.max(0, Math.min(1, speed)), t = c.currentTime, now = performance.now(), dt = (now - last) / 1000;
          last = now;
          g.gain.setTargetAtTime(full * v, t, R.smoothMs / 1000 / 3);
          band.frequency.setTargetAtTime(m.f * (1 + R.speedPitch * v), t, R.smoothMs / 1000 / 3);
          // Grit: a rough surface ticks under the part, more often the faster it goes.
          const ticks = m.grit * v * Math.min(dt, 0.1);
          for (let k = 0; k < Math.floor(ticks) + (Math.random() < ticks % 1 ? 1 : 0); k++)
            noise(t + Math.random() * 0.016, { type: 'bandpass', f: vary(m.f * R.gritBand, SOUND.render.gritSpread), q: SOUND.render.gritQ, ms: R.gritMs, gain: m.gritLevel }, full * v, reach);
        },
        stop() {
          if (!playing) return;
          playing = false;
          const t = c.currentTime;
          g.gain.setTargetAtTime(0, t, R.releaseMs / 1000 / 3);
          src.stop(t + R.releaseMs / 1000 * 2);
        },
      };
    },

    beep(earcon, o = {}) {
      const skip: SoundSkip | undefined = !settings.on ? 'off' : !ctx ? 'no-audio' : undefined;
      const gate = skip ? 0 : o.key ? allow(o.key) : 1;
      emit({ kind: 'beep', earcon, skipped: skip ?? (gate ? undefined : 'rate') });
      if (!gate) return false;
      const c = ctx!, B = SOUND.beeper, peak = dB(P.levelDb.beep) * sizeGain(o.rendered ?? 160) * gate;
      for (const [midi, atMs, lenMs, level] of SOUND.beeper.earcons[earcon].notes) {
        const t = c.currentTime + 0.005 + atMs / 1000, len = lenMs / 1000, f = 440 * 2 ** ((midi - 69) / 12);
        const o1 = c.createOscillator(), sq = c.createOscillator(), sg = c.createGain(), pk = c.createBiquadFilter(), g = c.createGain();
        o1.frequency.value = f; sq.type = 'square'; sq.frequency.value = f; sg.gain.value = B.square;
        pk.type = 'peaking'; pk.frequency.value = B.resonance; pk.Q.value = B.q; pk.gain.value = B.boostDb;
        const p = peak * level;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(p, t + B.attackMs / 1000); g.gain.setValueAtTime(p, t + len - 0.02); g.gain.linearRampToValueAtTime(0, t + len);
        o1.connect(g); sq.connect(sg); sg.connect(g); g.connect(pk); out(pk, 'own');
        o1.start(t); sq.start(t); o1.stop(t + len + 0.02); sq.stop(t + len + 0.02);
      }
      return true;
    },
  };
}
