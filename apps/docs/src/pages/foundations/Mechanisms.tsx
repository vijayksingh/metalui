import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Switch, Switcher } from '@unlocalhosted/metalui';
import { GADGETS, MECHANISM_TIMELINES, bodyFill, createDrive, createPlayer, drawCap, drawSlab, tierFor, type Drive, type DriveEvent, materialFilter, pigment, resolveFeel, sampleTrack, type CueEvent, type Player, type Pose } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import { useColorway } from '../../app/colorway';
import { Bench, PageHeader, Rules, Section, TokenTable } from '../../ui/doc';
import { BODY_PATH } from '../../ui/GadgetSpecimen';

const SEAT = MECHANISM_TIMELINES.seat;
const JACK: [number, number] = [200, 214];
type State = 'connected' | 'syncing' | 'failed';
const STATE_POSE: Record<State, string | null> = { connected: null, syncing: 'half', failed: 'out' };
const STATE_LAMP: Record<State, [string, string]> = { connected: ['live', 'steady'], syncing: ['waiting', 'breathe'], failed: ['failed', 'blink2'] };
const LAMP_FILL: Record<string, [string, string]> = { live: ['#D9FFE9', '#2FB673'], waiting: ['#FFF1CF', '#C98A18'], failed: ['#FFD9D2', '#D5392A'], off: ['#8B8B8E', '#4A4A4D'] };

/** A stand-in for the patch bay, drawn from the foundations: a stone slab, a metal jack, an accent plug, a lamp. */
function Bay({ host, plugRef, shadowRef, lamp, gesture, beat }: {
  host: 'bone' | 'graphite'; plugRef: React.Ref<SVGGElement>; shadowRef: React.Ref<SVGGElement>; lamp: string; gesture: string; beat: number;
}) {
  const uid = React.useId().replace(/:/g, '');
  const r = resolveFeel({ job: 'link', feel: { v: 0.7, a: 0.8, w: 0.4 }, material: 'stone', station: 195 });
  const acc = r.accent;
  const defs = React.useMemo(() =>
    materialFilter(`mb-${uid}-body`, 'stone', { host }) + materialFilter(`mb-${uid}-jack`, 'metal', { host, part: true, tier: 'lite' }) + materialFilter(`mb-${uid}-plug`, 'clay', { host, part: true, tier: 'lite' })
    + bodyFill(`mb-${uid}-bf`, 'stone', r.body.L, r.body.C, r.body.H, host)
    + `<radialGradient id="mb-${uid}-acc" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${pigment(acc.L + 0.05, acc.C * 0.9, acc.H - 6).srgb}"/><stop offset="1" stop-color="${acc.pigment.srgb}"/></radialGradient>`
    + `<linearGradient id="mb-${uid}-nut" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pigment(0.86, 0.01, 230).srgb}"/><stop offset=".5" stop-color="${pigment(0.66, 0.01, 230).srgb}"/><stop offset="1" stop-color="${pigment(0.78, 0.01, 230).srgb}"/></linearGradient>`
    + `<filter id="mb-${uid}-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>`,
  [uid, host, r.body.L, r.body.C, r.body.H, acc.L, acc.C, acc.H]);
  const [l0, l1] = LAMP_FILL[lamp] ?? LAMP_FILL.off;
  const [cx, cy] = JACK;
  return (
    <svg viewBox="0 0 400 400" width={260} height={260} role="img" aria-label="A plug in a jack on a stone panel" className="overflow-visible" data-testid="seat-bay">
      <defs dangerouslySetInnerHTML={{ __html: defs }} />
      <path d={BODY_PATH} fill={`url(#mb-${uid}-bf)`} filter={`url(#mb-${uid}-body)`} />
      <g filter={`url(#mb-${uid}-jack)`}>
        <path fillRule="evenodd" fill={`url(#mb-${uid}-nut)`} d={`M${cx - 40},${cy} a40,40 0 1 0 80,0 a40,40 0 1 0 -80,0 Z M${cx - 17},${cy} a17,17 0 1 0 34,0 a17,17 0 1 0 -34,0 Z`} />
      </g>
      <g ref={shadowRef} data-part="plug.shadow"><circle cx={cx + 8} cy={cy + 14} r="31" fill="rgba(30,26,22,.42)" filter={`url(#mb-${uid}-soft)`} /></g>
      <g ref={plugRef} data-part="plug">
        <g filter={`url(#mb-${uid}-plug)`}>
          <circle cx={cx} cy={cy + 4} r="33" fill={pigment(acc.L - 0.12, acc.C * 0.95, acc.H + 6).srgb} />
          <circle cx={cx} cy={cy} r="31" fill={`url(#mb-${uid}-acc)`} />
          {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d={`M${cx},${cy - 28} v6`} transform={`rotate(${a} ${cx} ${cy})`} stroke="rgba(0,0,0,.2)" strokeWidth="2.6" strokeLinecap="round" />)}
          <circle cx={cx} cy={cy} r="12" fill={pigment(acc.L - 0.04, acc.C, acc.H).srgb} />
        </g>
      </g>
      <radialGradient id={`mb-${uid}-lamp`} cx=".4" cy=".35" r=".65"><stop offset="0" stopColor={l0} /><stop offset="1" stopColor={l1} /></radialGradient>
      <circle key={`${lamp}-${gesture}-${beat}`} cx="313" cy="78" r="11" fill={`url(#mb-${uid}-lamp)`} stroke="rgba(0,0,0,.25)" strokeWidth=".8" data-lamp={lamp} data-gesture={gesture}
        className={gesture === 'steady' ? '' : `animate-led-${gesture} reduced-motion:animate-none`} />
    </svg>
  );
}

/** The act as a timeline: the plug's rise and fall, its shadow, every cue, and a playhead. */
function Timeline({ at }: { at: number }) {
  const W = 520, H = 150, D = SEAT.duration, x = (t: number) => 40 + (t / D) * (W - 60);
  const plug = SEAT.tracks.find((t) => t.part === 'plug')!, shadow = SEAT.tracks.find((t) => t.part === 'plug.shadow')!;
  const path = (f: (t: number) => number) => Array.from({ length: 91 }, (_, i) => (i / 90) * D).map((t, i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${f(t).toFixed(1)}`).join(' ');
  const yPlug = (t: number) => 50 + sampleTrack(plug.frames as never, t).pose.y * 2.4;
  const yShadow = (t: number) => 118 - (sampleTrack(shadow.frames as never, t).opacity ?? 1) * 30;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[560px] text-ink" role="img" aria-label="The seat act as a timeline" data-testid="seat-timeline">
      <g className="type-label" fill="currentColor" opacity=".55" fontSize="9">
        <text x="0" y="54">PLUG</text><text x="0" y="112">SHADOW</text>
        {[0, 200, 400, 600, 800].filter((t) => t <= D).map((t) => <text key={t} x={x(t)} y={H - 2} textAnchor="middle">{t}</text>)}
      </g>
      <line x1={x(0)} x2={x(D)} y1="50" y2="50" stroke="currentColor" opacity=".15" />
      <path d={path(yPlug)} fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".8" />
      <path d={path(yShadow)} fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".45" strokeDasharray="3 3" />
      {SEAT.cues.filter((c) => 'at' in c).map((c, i) => (
        <g key={i} data-cue-mark={c.kind}>
          <line x1={x(c.at)} x2={x(c.at)} y1="10" y2="132" stroke={c.kind === 'strike' ? 'rgb(63,185,122)' : c.kind === 'lamp' ? 'rgb(245,191,85)' : 'rgb(111,155,255)'} strokeWidth="1.2" opacity=".85" />
          <text x={x(c.at) + 3} y={14 + (i % 3) * 10} fontSize="9" fill="currentColor" opacity=".7">{c.kind}</text>
        </g>
      ))}
      {at >= 0 && <line x1={x(at)} x2={x(at)} y1="4" y2="136" stroke="currentColor" strokeWidth="1.5" data-testid="playhead" />}
    </svg>
  );
}

const SLIDE = MECHANISM_TIMELINES.slide;
const SLOTS_X = [128, 200, 272], SLOT_Y = 210;
const MIXES: { label: string; values: number[] }[] = [
  { label: 'Mix A', values: [0.25, 0.75, 0.5] },
  { label: 'Mix B', values: [0.8, 0.3, 0.6] },
  { label: 'All up', values: [1, 1, 1] },
  { label: 'All down', values: [0, 0, 0] },
];

/** A fader stand-in: three caps in three slots of a clay slab, moved by the slide drive. */
function Faders({ sound, reduced }: { sound: ReturnType<typeof createSound>; reduced: boolean }) {
  const { colorway } = useColorway();
  const host = colorway === 'graphite' ? 'graphite' : 'bone';
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(260);
  const travel = Math.abs(SLIDE.held!.to.y! - SLIDE.held!.from.y!);
  const r = resolveFeel({ job: 'tune', feel: { v: 0.6, a: 0.5, w: 0.3 } });
  const [pw, ph] = GADGETS.parts.cap.size;
  const art = React.useMemo(() => {
    const slab = drawSlab(`fs-${uid}`, { at: [200, 196], size: [320, 320], material: 'clay', color: r.body, cuts: SLOTS_X.map((x) => ({ kind: 'slot' as const, at: [x, SLOT_Y] as [number, number], size: [18, travel + 20] as [number, number] })) }, { tier, host });
    const caps = SLOTS_X.map((x, i) => drawCap(`fc-${uid}-${i}`, { at: [x, SLOT_Y], size: [pw, ph], color: i === 1 ? r.accent : { L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: (GADGETS.materials.clay as unknown as { sample: number }).sample } }, { tier, host }));
    return { slab, caps };
  }, [uid, tier, host, r.body.L, r.body.C, r.body.H, r.accent.L, travel, pw, ph]); // eslint-disable-line react-hooks/exhaustive-deps
  const root = React.useRef<SVGGElement>(null);
  const drive = React.useRef<Drive | null>(null);
  const [values, setValues] = React.useState([0.5, 0.5, 0.5]);
  const [log, setLog] = React.useState<DriveEvent[]>([]);
  const [speed, setSpeed] = React.useState(0);
  React.useEffect(() => {
    const caps = [...(root.current?.querySelectorAll('[data-cap]') ?? [])];
    const d = createDrive('slide', caps, [0.5, 0.5, 0.5], {
      sound, material: 'clay', partSize: pw, reduced,
      onEvent: (e) => setLog((l) => [...l.slice(-11), e]),
      onFrame: (v) => setValues(v),
      onScrape: (sp) => setSpeed(sp),
    });
    drive.current = d;
    return () => d.destroy();
  }, [art, sound]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { drive.current?.setOptions({ reduced }); }, [reduced]);
  const since = React.useRef(0);
  const go = (v: number[]) => { setLog([]); since.current = drive.current?.time ?? 0; drive.current?.set(v); };
  return (
    <div className="grid w-full items-center gap-24 md:grid-cols-[260px_1fr]" data-testid="slide-bench" data-values={values.map((v) => v.toFixed(2)).join(',')} data-speed={speed.toFixed(2)}>
      <svg viewBox="0 0 400 400" width={260} height={260} role="img" aria-label="Three faders in a clay slab" className="overflow-visible">
        <defs dangerouslySetInnerHTML={{ __html: art.slab.defs + art.caps.map((c) => c.defs).join('') }} />
        <g dangerouslySetInnerHTML={{ __html: art.slab.floors + art.slab.body + art.slab.lips }} />
        <g ref={root}>
          {art.caps.map((c, i) => <g key={i} data-cap={i} dangerouslySetInnerHTML={{ __html: c.shadow + c.body }} />)}
        </g>
      </svg>
      <div className="flex min-w-0 flex-col gap-12">
        <div className="flex flex-wrap gap-8">
          {MIXES.map((m) => <Button key={m.label} onClick={() => go(m.values)}>{m.label}</Button>)}
        </div>
        <ol className="m-0 flex min-h-[120px] list-none flex-col gap-2 p-0 type-readout text-ink3" data-testid="slide-log" aria-live="off">
          {log.map((e, i) => (
            <li key={i} data-kind={e.kind}>{Math.round(e.at - since.current)} ms · cap {e.actor + 1} · {e.kind === 'stop' ? `knocks the ${e.end ? 'top' : 'bottom'} at ${e.level.toFixed(2)}` : 'ticks a detent'}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function Mechanisms() {
  const { colorway } = useColorway();
  const host = colorway === 'graphite' ? 'graphite' : 'bone';
  const plugRef = React.useRef<SVGGElement>(null), shadowRef = React.useRef<SVGGElement>(null);
  const player = React.useRef<Player | null>(null);
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [state, setState] = React.useState<State>('connected');
  const [lamp, setLamp] = React.useState<[string, string]>(STATE_LAMP.connected);
  const [beat, setBeat] = React.useState(0);
  const [log, setLog] = React.useState<CueEvent[]>([]);
  const [head, setHead] = React.useState(-1);
  const [pose, setPose] = React.useState<Pose>({ x: 0, y: 0, r: 0, sx: 1, sy: 1 });
  const d = useDialKit('Mechanisms', { speed: { type: 'select', options: ['1', '0.5', '0.25'], default: '1' }, reduced: false });
  const systemReduced = React.useSyncExternalStore(
    (cb) => { const q = matchMedia('(prefers-reduced-motion: reduce)'); q.addEventListener('change', cb); return () => q.removeEventListener('change', cb); },
    () => matchMedia('(prefers-reduced-motion: reduce)').matches, () => false,
  );
  const reduced = d.reduced || systemReduced;

  React.useEffect(() => {
    const p = createPlayer('seat', { plug: plugRef.current, 'plug.shadow': shadowRef.current }, {
      origins: { plug: JACK },
      onStrike: (cue, delay) => sound.strike('clay', { size: 54, weight: 0.4, reach: 'world', level: cue.level, pitch: cue.pitch, delay }),
      onLamp: (g) => { setLamp(([k]) => [k === 'off' ? 'live' : k, g]); setBeat((b) => b + 1); },
      onBeep: () => sound.beep('done'),
      onCue: (e) => setLog((l) => [...l, e]),
      onFrame: (t, poses) => { setHead(t); setPose(poses.plug); },
    });
    player.current = p;
    return () => p.destroy();
  }, [sound]);
  React.useEffect(() => { player.current?.setOptions({ speed: Number(d.speed), reduced }); }, [d.speed, reduced]);

  // A second act while one plays is ignored, and so is its click on the log.
  const act = () => { if (player.current && !player.current.playing) { setLog([]); player.current.act(); } };
  const toState = (s: State) => { setState(s); setLamp(STATE_LAMP[s]); setBeat((b) => b + 1); player.current?.hold(STATE_POSE[s]); };

  return (
    <>
      <PageHeader
        title="Mechanisms"
        lede="A mechanism is how a gadget moves when it acts, written as data: one clock, a track for each moving part, and cues for everything a real object also does while it moves. A part of its material strikes the moment it lands; the lamp answers; the beeper, if the gadget has one, gives the news. Motion, light and sound come from the same list, so they never drift apart."
      />
      <Section title="Seat" lede="The plug lifts out of its jack, hangs a moment, and seats again. Its shadow opens as it rises and closes as it lands. The click is placed where the spring first brings the plug home, not by eye. Change the state mid-act: the plug springs on from wherever it is, and the pending lamp and beep are cancelled.">
        <Bench caption={`seat · ${SEAT.duration} ms · ${SEAT.cues.length} cues${reduced ? ' · reduced motion: the act is its click and its lamp' : ''} · plug y ${pose.y.toFixed(1)}`}>
          <div className="grid w-full items-center gap-24 md:grid-cols-[260px_1fr]" data-testid="seat-bench" data-state={state} data-reduced={reduced}>
            <button type="button" onClick={act} aria-label="Play the seat act" className="cursor-pointer rounded-card border-0 bg-transparent p-0 focus-visible:focus-ring">
              <Bay host={host} plugRef={plugRef} shadowRef={shadowRef} lamp={lamp[0]} gesture={lamp[1]} beat={beat} />
            </button>
            <div className="flex min-w-0 flex-col gap-14">
              <div className="flex flex-wrap items-center gap-12">
                <Button onClick={act} data-testid="seat-act">Act</Button>
                <Switcher<State> aria-label="State" value={state} onValueChange={toState}
                  options={[{ value: 'connected', label: 'Connected' }, { value: 'syncing', label: 'Syncing' }, { value: 'failed', label: 'Failed' }]} />
                <label className="flex items-center gap-8 type-ui text-ink">
                  <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
                </label>
              </div>
              <Timeline at={head} />
              <ol className="m-0 flex list-none flex-wrap gap-6 p-0" data-testid="cue-log" aria-live="polite">
                {log.map((e, i) => (
                  <li key={i} data-cue-kind={e.cue.kind} data-cue-at={e.at} data-skipped={e.skipped ?? ''} className="type-readout rounded-row px-8 py-2 recipe-well-field text-ink2">
                    {e.at} ms · {e.cue.kind}{'gesture' in e.cue ? ` ${e.cue.gesture}` : ''}{e.skipped ? ` · ${e.skipped}` : ''}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="Slide" lede="A held mechanism: a value moves the caps, not a clock. Each cap springs to its new place along its slot, the next one 40 ms after, keeping its speed if the mix changes again on the way. You hear them scrape as they travel, tick past each eighth of the slot, and knock if they reach an end, which is a wall they bounce back from a little. With reduced motion they go straight to their places, each with one tick.">
        <Bench caption={`slide · held · ${SLIDE.held!.detents} detents · stagger ${SLIDE.held!.stagger} ms · walls return ${SLIDE.held!.wall} · ${SLIDE.held!.step} steps a second on both platforms`}>
          <Faders sound={sound} reduced={reduced} />
        </Bench>
      </Section>
      <Section title="The cue list">
        <TokenTable
          head={['At', 'Cue', 'What it is']}
          mono={[0, 1]}
          rows={SEAT.cues.map((c) => [('at' in c ? `${c.at} ms` : 'per detent'), c.kind + ('gesture' in c ? ` ${c.gesture}` : ''),
            c.kind === 'strike' ? (c.level < 0.5 ? 'the pull: soft and a little low' : 'the seat: the plug lands in its jack') : c.kind === 'lamp' ? 'the lamp answers the click' : 'the state’s own news, on the beeper'])}
        />
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'M1', title: 'Sound where it lands', body: 'A strike cue sits at the moment a part meets something. The seat\'s click is computed from the spring, not placed by eye.' },
            { id: 'M2', title: 'One act at a time', body: 'A second act while one plays is ignored. A change of state is not: it springs from where the part is, keeping its speed.' },
            { id: 'M3', title: 'An act returns exactly', body: 'Every track ends where it began, so nothing snaps when the act is over.' },
            { id: 'M4', title: 'Reduced motion keeps the meaning', body: 'Without travel, the act is still its click and its lamp at the moment you act. The part never moves.' },
            { id: 'M5', title: 'One list, three sinks', body: 'Motion, lamp and sound read the same cues. SwiftUI plays the same list; its poses are checked against the web\'s samples.' },
          ]}
        />
      </Section>
    </>
  );
}
