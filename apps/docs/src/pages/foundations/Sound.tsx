import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Checkbox, Led, Switch, Switcher, type LedKind } from '@unlocalhosted/metalui';
import { createSound, EARCONS, SOUND, SOUND_MATERIALS, type Earcon, type Plays, type Reach, type SoundEvent, type SoundMaterial } from '@unlocalhosted/metalui/sound';
import { Bench, PageHeader, Rules, Section, TokenTable, copyJSON } from '../../ui/doc';

const STORE = 'mu-sound';
const REACHES = Object.keys(SOUND.reach) as Reach[];
const NAME: Record<SoundMaterial, string> = { clay: 'Clay', ceramic: 'Ceramic', resin: 'Resin', stone: 'Stone', glass: 'Glass', metal: 'Metal', rubber: 'Rubber' };
const LED_FOR: Record<string, LedKind> = { green: 'live', red: 'failed', amber: 'waiting', blue: 'link' };

/** One engine for the page; settings are the reader's, remembered in this browser. */
function usePageSound() {
  const sound = React.useMemo(() => createSound(), []);
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  const [last, setLast] = React.useState<SoundEvent | null>(null);
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? 'null');
      if (saved) { sound.configure({ plays: saved.plays, materials: saved.materials }); force(); }
    } catch { /* no storage: defaults */ }
    return sound.subscribe(setLast);
  }, [sound]);
  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify({ plays: sound.settings.plays, materials: sound.settings.materials })); } catch { /* ignore */ }
    force();
  };
  return { sound, last, save, refresh: force };
}

function describe(e: SoundEvent | null) {
  if (!e) return 'Nothing played yet.';
  const what = e.kind === 'strike' ? `${NAME[e.material]} · ${Math.round(e.f0)} Hz` : `beep · ${e.earcon}`;
  if (e.skipped) return `${what} · silent (${{ off: 'sound is off', plays: 'states only', material: 'material muted', rate: 'rate limit', 'no-audio': 'no audio yet' }[e.skipped]})`;
  return e.kind === 'strike' ? `${what} · peak ${(20 * Math.log10(e.peak)).toFixed(1)} dBFS` : what;
}

export default function Sound() {
  const { sound, last, save, refresh } = usePageSound();
  const [lit, setLit] = React.useState<Partial<Record<Earcon, LedKind | 'off'>>>({});
  const [struck, setStruck] = React.useState<SoundMaterial | null>(null);

  const d = useDialKit(
    'Sound',
    {
      part: {
        material: { type: 'select', options: [...SOUND_MATERIALS], default: 'clay' },
        size: [SOUND.pitch.body, 16, 320, 1],
        weight: [0.3, 0, 1, 0.05],
        reach: { type: 'select', options: REACHES, default: 'own' },
        rendered: [160, 32, 320, 1],
      },
      tune: {
        f0x: [1, 0.3, 3, 0.05],
        tone: [1, 0, 1.5, 0.05],
        loud: [1, 0, 1.5, 0.05],
        decay: [1, 0.25, 3, 0.05],
      },
      strike: { type: 'action', label: 'Strike' },
      copy: { type: 'action', label: 'Copy tuned recipe' },
    },
    {
      onAction: (a) => {
        const m = d.part.material as SoundMaterial, base = SOUND.materials[m];
        if (a === 'strike') workbench();
        if (a === 'copy') copyJSON({ material: m, f0x: +(base.f0x * d.tune.f0x).toFixed(3), tone: +(base.tone * d.tune.tone).toFixed(3), loud: +(base.loud * d.tune.loud).toFixed(3), decayScale: d.tune.decay });
      },
    },
  );

  function workbench() {
    const m = d.part.material as SoundMaterial, base = SOUND.materials[m];
    sound.strike(m, {
      size: d.part.size, weight: d.part.weight, reach: d.part.reach as Reach, rendered: d.part.rendered,
      tune: { f0x: base.f0x * d.tune.f0x, tone: base.tone * d.tune.tone, loud: base.loud * d.tune.loud, decay: d.tune.decay },
    });
  }

  function strike(m: SoundMaterial) {
    sound.strike(m, { weight: 0.3 });
    setStruck(m);
    window.setTimeout(() => setStruck((s) => (s === m ? null : s)), 220);
  }

  function beep(e: Earcon) {
    const def = SOUND.beeper.earcons[e] as { led: string };
    const kind = LED_FOR[def.led] ?? 'live';
    sound.beep(e);
    // The lamp is the visual twin of every beep; failure blinks twice.
    if (e === 'failed') [0, 90, 180, 270].forEach((t, i) => window.setTimeout(() => setLit((s) => ({ ...s, [e]: i % 2 ? 'off' : kind })), t));
    else setLit((s) => ({ ...s, [e]: kind }));
    window.setTimeout(() => setLit((s) => ({ ...s, [e]: 'off' })), 1600);
  }

  const on = sound.settings.on;
  const f0 = sound.fundamental(d.part.material as SoundMaterial, d.part.size, d.part.weight) * d.tune.f0x;

  return (
    <>
      <PageHeader
        title="Sound"
        lede="What a Soft Hardware object would actually make when it acts. A strike is a part of a material hitting, sliding or seating, synthesised from that material's modes and contact noise. A tone exists only where a real device would have a piezo, and only for a change of state. Sound is off until the person turns it on."
      />

      <Section title="Settings" lede="The library exposes three settings: whether sound is on (off by default), what makes sound (acts and changes of state, or changes of state only), and which materials may sound. This page remembers your choices in this browser.">
        <Bench>
          <div className="flex flex-col gap-16" data-testid="sound-settings" data-on={on} data-plays={sound.settings.plays}>
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch
                aria-label="Sound"
                checked={on}
                onCheckedChange={async (next) => { if (next) await sound.enable(); else sound.disable(); refresh(); }}
              />
              Sound
            </label>
            <div className="flex flex-wrap items-center gap-12">
              <span className="type-label engraved">Plays</span>
              <Switcher<Plays>
                aria-label="What makes sound"
                value={sound.settings.plays}
                onValueChange={(plays) => { sound.configure({ plays }); save(); }}
                options={[{ value: 'acts', label: 'Acts and states' }, { value: 'states', label: 'States only' }]}
              />
            </div>
            <div className="flex flex-wrap items-center gap-16">
              <span className="type-label engraved">Materials</span>
              {SOUND_MATERIALS.map((m) => (
                <label key={m} className="flex items-center gap-6 type-ui text-ink2">
                  <Checkbox size="row" checked={sound.settings.materials[m]} onCheckedChange={(v) => { sound.configure({ materials: { ...sound.settings.materials, [m]: !!v } }); save(); }} />
                  {NAME[m]}
                </label>
              ))}
            </div>
            <output data-testid="sound-last" aria-live="polite" className="type-readout text-ink3">{describe(last)}</output>
          </div>
        </Bench>
      </Section>

      <Section title="Materials" lede="Seven materials, closed. Each rings at its own modes (partials that decay), with its own contact noise, loudness and longest ring. Harder, stiffer materials ring longer and brighter: rubber, stone and clay knock; resin and ceramic tock and tink; glass and metal ring. Press a pad to strike it.">
        <Bench caption="A body-sized part (320 of the 400-unit drawing) at weight 0.3, dry and close.">
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-12">
            {SOUND_MATERIALS.map((m) => {
              const r = SOUND.materials[m];
              return (
                <button
                  key={m}
                  type="button"
                  data-sound-material={m}
                  onPointerDown={() => strike(m)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); strike(m); } }}
                  className={`recipe-surface-raise rounded-card flex flex-col items-start gap-6 p-16 text-left cursor-pointer border-0 focus-visible:focus-ring transition-transform ${struck === m ? 'translate-y-[1px]' : ''}`}
                >
                  <span className="type-title text-ink">{NAME[m]}</span>
                  <span className="type-ui text-ink2">{r.hear}</span>
                  <span className="type-readout text-ink3">{Math.round(sound.fundamental(m, SOUND.pitch.body, 0.3))} Hz · rings {Math.max(...r.modes.map((x) => x[2]))} ms</span>
                </button>
              );
            })}
          </div>
        </Bench>
      </Section>

      <Section title="Size, weight and reach" lede="Pitch comes from the part, not the material alone: bigger and heavier ring lower, and small parts stop ringing sooner. Heavy objects add a thump under the strike, but only through hard materials. Reach sets the room: toward yourself it is dry; toward others or the world it has space around it. Use the Sound panel to move a part and tune a recipe, then copy it into tokens.">
        <Bench caption={`${NAME[d.part.material as SoundMaterial]} · part ${d.part.size} · weight ${d.part.weight} · ${d.part.reach} · ${Math.round(f0)} Hz`}>
          <div className="flex flex-wrap items-center gap-12">
            <Button onClick={workbench}>Strike</Button>
            <span className="type-ui text-ink2">A cap is about 72, a keycap 112, the body 320.</span>
          </div>
        </Bench>
      </Section>

      <Section title="Beeper" lede="The only source of tones: a piezo behind a small grille, on objects that report a state. Only a change of state plays it, never an act or a hover, and the lamp always shows the same news. Good news is major and rising; failure is low, then rough.">
        <Bench caption="A beep plays when sound is on, in either Plays setting.">
          <div className="flex flex-wrap gap-12">
            {EARCONS.map((e) => {
              const def = SOUND.beeper.earcons[e] as { label: string };
              return (
                <Button key={e} data-earcon={e} onClick={() => beep(e)}>
                  <Led kind={(lit[e] ?? 'off') as LedKind} />
                  {def.label}
                </Button>
              );
            })}
          </div>
        </Bench>
      </Section>

      <Section title="Recipes" lede="From tokens.json (sound.materials). modes are [ratio, gain, decay ms]; the contact is filtered noise.">
        <TokenTable
          head={['Material', 'Modes · contact', 'Sounds like']}
          rows={SOUND_MATERIALS.map((m) => {
            const r = SOUND.materials[m] as unknown as { modes: number[][]; noise: { type: string; f: number }[]; loud: number; hear: string };
            return [m, `${r.modes.map((x) => x[0]).join(' : ')} · ${r.noise.map((n) => `${n.type} ${n.f}`).join(' + ')} · loud ${r.loud}`, r.hear];
          })}
        />
      </Section>

      <Section title="Use it">
        <TokenTable
          head={['Platform', 'API', 'Notes']}
          mono={[0, 1]}
          rows={[
            ['React', "import { createSound } from '@unlocalhosted/metalui/sound'", 'const sound = createSound(); await sound.enable() inside a click; sound.strike("clay", { size: 72, weight: 0.3 }); sound.beep("done").'],
            ['SwiftUI', 'MetalSound.shared', 'try MetalSound.shared.enable(); MetalSound.shared.strike(.clay, size: 72, weight: 0.3); MetalSound.shared.beep(.done). Ambient session on iOS: respects the silent switch.'],
            ['Both', 'key: "…"', 'Name the playing thing to apply the rate limit (one play per 1.5 s, three per 10 s) and the session decay.'],
          ]}
        />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'S1', title: 'Off until asked', body: 'Sound starts off. A person turns it on once, with a real control; nothing plays before that.' },
            { id: 'S2', title: 'Acts and changes of state only', body: 'A press, a slide, a seat, a result. Never a hover, never a loop, never ambient.' },
            { id: 'S3', title: 'The sound is the material', body: 'An act sounds like its part: a clay cap knocks, a glass face ticks, a metal jack clangs. An LED makes no sound.' },
            { id: 'S4', title: 'Tones come from a beeper', body: 'A tone is a piezo, and only an object that reports a state has one. Acts never sing.' },
            { id: 'S5', title: 'No two strikes alike', body: 'Pitch, ring and contact vary a little every time, as real strikes do, so the hundredth play is not a recording.' },
            { id: 'S6', title: 'Quieter with use', body: 'A playing thing is rate-limited and loses 2 dB after 20 plays in a session and 4 dB after 60.' },
            { id: 'S7', title: 'Always a visual twin', body: 'Every sound has something to see: the part moves, the lamp lights. Nothing is said by sound alone.' },
          ]}
        />
      </Section>
    </>
  );
}
