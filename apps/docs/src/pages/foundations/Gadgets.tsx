import * as React from 'react';
import { Select, Slider, Switch } from '@unlocalhosted/metalui';
import { GADGETS, JOBS, checkSet, resolveFeel, validate, type Feel, type GadgetSpec, type Job, type Problem, type ResolvedFeel } from '@unlocalhosted/metalui/gadgets';
import { createSound, SOUND } from '@unlocalhosted/metalui/sound';
import { useColorway } from '../../app/colorway';
import { Bench, PageHeader, Rules, Section, TokenTable } from '../../ui/doc';
import { GadgetSpecimen } from '../../ui/GadgetSpecimen';
import { SwiftCapture } from '../../ui/SwiftCapture';
import patchBay from '../../../../../packages/metalui/src/gadgets/fixtures/patch-bay.gadget.json';
import counterDrum from '../../../../../packages/metalui/src/gadgets/fixtures/counter-drum.gadget.json';
import needleGauge from '../../../../../packages/metalui/src/gadgets/fixtures/needle-gauge.gadget.json';
import readingRig from '../../../../../packages/metalui/src/gadgets/fixtures/reading.rig.json';
import placements from '../../../../../packages/metalui/src/gadgets/fixtures/placements.json';

const VERB: Record<Job, string> = { tune: 'tunes', command: 'commands', link: 'links', keep: 'keeps', identify: 'identifies', destroy: 'destroys', take: 'takes', find: 'finds', make: 'makes', signal: 'signals' };
const feelWords = (f: Feel) => [f.v >= 0.6 ? 'pleased' : f.v <= 0.35 ? 'tense' : 'even', f.a >= 0.6 ? 'active' : f.a <= 0.3 ? 'still' : 'steady', f.w >= 0.66 ? 'heavy' : f.w <= 0.33 ? 'light' : 'weighted'];
const ruleWords = (by: string) => by === 'pin' ? 'pinned by the spec' : by === 'job' ? 'pinned by its job' : by === '*' ? 'the default' : `because ${by.replace(/&/g, ' and ').replace(/>=/g, ' ≥ ').replace(/<=/g, ' ≤ ')}`;

/* ---------- The feel space: valence × arousal × weight, coloured by what it resolves to ---------- */
function FeelSpace({ job, feel, onPick }: { job: Job; feel: Feel; onPick: (f: Feel) => void }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const view = React.useRef({ yaw: -0.62, pitch: 0.32, drag: null as null | { x: number; y: number; yaw: number; pitch: number; moved: number } });
  const grid = React.useMemo(() => {
    const pts: { f: Feel; c: string }[] = [];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) for (let k = 0; k < 5; k++) {
      const f = { v: i / 4, a: j / 4, w: k / 4 };
      pts.push({ f, c: resolveFeel({ job, feel: f }).body.pigment.srgb });
    }
    return pts;
  }, [job]);
  const proj = (W: number, f: Feel) => {
    const { yaw, pitch } = view.current, x = f.v * 2 - 1, y = f.a * 2 - 1, z = f.w * 2 - 1;
    const cy = Math.cos(yaw), sy = Math.sin(yaw); let X = x * cy + z * sy, Z = -x * sy + z * cy;
    const cp = Math.cos(pitch), sp = Math.sin(pitch); const Y = y * cp - Z * sp; Z = y * sp + Z * cp;
    const k = 4.2 / (4.2 + Z), s = W * 0.29 * k;
    return { x: W / 2 + X * s, y: W / 2 - Y * s, z: Z, k };
  };
  const draw = React.useCallback(() => {
    const cv = ref.current; if (!cv) return;
    const W = cv.clientWidth, d = devicePixelRatio || 1; cv.width = W * d; cv.height = W * d;
    const g = cv.getContext('2d')!; g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, W);
    const ink = getComputedStyle(cv).color;
    g.strokeStyle = ink; g.globalAlpha = 0.14; g.lineWidth = 1;
    for (const a of [0, 1]) for (const b of [0, 1]) for (const [p, q] of [[{ v: 0, a, w: b }, { v: 1, a, w: b }], [{ v: a, a: 0, w: b }, { v: a, a: 1, w: b }], [{ v: a, a: b, w: 0 }, { v: a, a: b, w: 1 }]] as [Feel, Feel][]) {
      const P = proj(W, p), Q = proj(W, q); g.beginPath(); g.moveTo(P.x, P.y); g.lineTo(Q.x, Q.y); g.stroke();
    }
    g.globalAlpha = 1;
    const items = grid.map((pt) => ({ ...pt, p: proj(W, pt.f) })).sort((a, b) => b.p.z - a.p.z);
    for (const it of items) { g.globalAlpha = 0.45 + 0.45 * (1 - (it.p.z + 1.6) / 3.2); g.fillStyle = it.c; g.beginPath(); g.arc(it.p.x, it.p.y, 7 * it.p.k, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    const me = proj(W, feel), mine = resolveFeel({ job, feel }).body.pigment.srgb;
    g.fillStyle = mine; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(me.x, me.y, 13 * me.k, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(63,185,122,.95)'; g.lineWidth = 1.5; g.beginPath(); g.arc(me.x, me.y, 19 * me.k, 0, 7); g.stroke();
    g.font = '600 9.5px ui-monospace, SF Mono, monospace'; g.fillStyle = ink; g.globalAlpha = 0.6; g.textAlign = 'center';
    for (const [t, f] of [['TENSE', { v: -0.12, a: 0.5, w: 0.5 }], ['PLEASED', { v: 1.12, a: 0.5, w: 0.5 }], ['STILL', { v: 0.5, a: -0.1, w: 0.5 }], ['ACTIVE', { v: 0.5, a: 1.1, w: 0.5 }], ['LIGHT', { v: 0.5, a: 0.5, w: -0.14 }], ['HEAVY', { v: 0.5, a: 0.5, w: 1.14 }]] as [string, Feel][]) {
      const p = proj(W, f); g.fillText(t, p.x, p.y);
    }
    g.globalAlpha = 1;
  }, [grid, feel, job]);
  React.useEffect(() => { draw(); const ro = new ResizeObserver(draw); if (ref.current) ro.observe(ref.current); return () => ro.disconnect(); }, [draw]);
  return (
    <canvas
      ref={ref}
      aria-label="The feel space: valence, arousal and weight, coloured by the body each feel resolves to"
      data-testid="feel-space"
      className="aspect-square w-full max-w-[420px] cursor-grab touch-none text-ink active:cursor-grabbing"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); view.current.drag = { x: e.clientX, y: e.clientY, yaw: view.current.yaw, pitch: view.current.pitch, moved: 0 }; }}
      onPointerMove={(e) => {
        const d = view.current.drag; if (!d) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y; d.moved = Math.max(d.moved, Math.hypot(dx, dy));
        view.current.yaw = d.yaw + dx * 0.008; view.current.pitch = Math.max(-1.2, Math.min(1.2, d.pitch + dy * 0.008)); draw();
      }}
      onPointerUp={(e) => {
        const d = view.current.drag; view.current.drag = null; if (!d || d.moved > 4) return;
        const cv = e.currentTarget, r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        const hit = grid.map((pt) => ({ pt, p: proj(cv.clientWidth, pt.f) })).map((o) => ({ ...o, dist: Math.hypot(o.p.x - mx, o.p.y - my) })).filter((o) => o.dist < 12).sort((a, b) => a.dist - b.dist || a.p.z - b.p.z)[0];
        if (hit) onPick(hit.pt.f);
      }}
    />
  );
}

/* ---------- The spec bench: examples, and ways to break them ---------- */
type Json = Record<string, unknown>;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const EXAMPLES: Record<string, { label: string; spec: () => Json }> = {
  'patch-bay': { label: 'Patch bay (valid)', spec: () => clone(patchBay) },
  'counter-drum': { label: 'Counter drum (valid)', spec: () => clone(counterDrum) },
  'needle-gauge': { label: 'Needle gauge (valid)', spec: () => clone(needleGauge) },
  reading: { label: 'Reading rig (valid)', spec: () => clone(readingRig) },
  invented: { label: 'Break: an invented part', spec: () => { const s = clone(patchBay) as Json; (s.parts as Json[]).push({ id: 'spring', part: 'spring', at: [60, 60], role: 'trim' }); return s; } },
  'no-lamp': { label: 'Break: no lamp', spec: () => { const s = clone(patchBay) as Json; s.parts = (s.parts as Json[]).filter((p) => p.part !== 'led'); return s; } },
  'rest-beep': { label: 'Break: beeping at rest', spec: () => { const s = clone(patchBay) as Json; (s.states as Json).rest = { lamp: ['off', 'steady'], beep: 'done' }; return s; } },
  unbound: { label: 'Break: an unbound slot', spec: () => { const s = clone(patchBay) as Json; delete ((s.mechanism as Json).bind as Json).socket; return s; } },
  material: { label: 'Break: a jack cut from clay', spec: () => { const s = clone(patchBay) as Json; (s.parts as Json[])[2].material = 'clay'; return s; } },
  'off-canvas': { label: 'Break: off the canvas', spec: () => { const s = clone(counterDrum) as Json; (s.parts as Json[])[3].at = [392, 200]; return s; } },
  feel: { label: 'Break: a feel out of range', spec: () => { const s = clone(counterDrum) as Json; s.feel = { v: 1.4, a: 0.3, w: 0.3 }; return s; } },
  schema: { label: 'Break: an old schema', spec: () => { const s = clone(counterDrum) as Json; s.$schema = 'metalui/gadget@0'; return s; } },
  loop: { label: 'Break: cables in a loop', spec: () => { const s = clone(readingRig) as Json; (s.cables as Json[]).push({ from: 'streak.count', to: 'today.value' }); return s; } },
  kind: { label: 'Break: a cable of the wrong kind', spec: () => { const s = clone(readingRig) as Json; delete (s.cables as Json[])[0].map; return s; } },
  twins: { label: 'Break: two of the same', spec: () => ({ $schema: 'metalui/rig@1', name: 'twins', title: 'Twins', job: 'link', feel: { v: 0.7, a: 0.8, w: 0.4 }, grid: [2, 1], gadgets: { a: { gadget: 'patch-bay', at: [0, 0] }, b: { gadget: 'patch-bay', at: [1, 0] } }, cables: [{ from: 'a.done', to: 'b.state', map: { kind: 'select', table: {} } }] }) },
};
const CATALOG = { 'patch-bay': patchBay, 'counter-drum': counterDrum, 'needle-gauge': needleGauge } as unknown as Record<string, GadgetSpec>;

function SpecBench() {
  const [pick, setPick] = React.useState('patch-bay');
  const [text, setText] = React.useState(() => JSON.stringify(EXAMPLES['patch-bay'].spec(), null, 2));
  const result = React.useMemo(() => {
    try { return { parsed: true as const, v: validate(JSON.parse(text), CATALOG) }; } catch (e) { return { parsed: false as const, error: String((e as Error).message) }; }
  }, [text]);
  const problems: Problem[] = result.parsed && !result.v.ok ? result.v.problems : [];
  return (
    <div className="grid w-full gap-16 lg:grid-cols-2" data-testid="spec-bench">
      <div className="flex min-w-0 flex-col gap-10">
        <Select
          aria-label="Example spec"
          value={pick}
          onValueChange={(k) => { setPick(k); setText(JSON.stringify(EXAMPLES[k].spec(), null, 2)); }}
          options={Object.entries(EXAMPLES).map(([value, e]) => ({ value, label: e.label }))}
        />
        <textarea
          aria-label="Spec"
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="type-code h-[360px] w-full resize-y rounded-plate border-0 p-12 text-ink outline-none recipe-well-field focus-visible:focus-ring"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-8" aria-live="polite">
        {!result.parsed ? (
          <p className="type-ui text-red" data-result="parse">This is not JSON yet: {result.error}</p>
        ) : result.v.ok ? (
          <p className="type-ui text-ink" data-result="ok">Valid. {'gadgets' in result.v.spec ? 'The rig wires, and its gadgets do not repeat each other.' : 'Every part, slot, state and port checks out.'}</p>
        ) : (
          <>
            <p className="type-ui text-ink" data-result="problems">{problems.length} {problems.length === 1 ? 'problem' : 'problems'}, each with its fix:</p>
            <ul className="m-0 flex list-none flex-col gap-8 p-0">
              {problems.map((p, i) => (
                <li key={i} data-code={p.code} className="rounded-row recipe-well-field p-10">
                  <div className="flex flex-wrap items-baseline gap-8"><span className="type-readout text-ink">{p.code}</span><span className="type-readout text-ink3">{p.path}</span></div>
                  <div className="type-ui text-ink2">{p.message}</div>
                  {p.fix && <div className="type-ui text-ink3">→ {p.fix}</div>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function Gadgets() {
  const { colorway } = useColorway();
  const host = colorway === 'graphite' ? 'graphite' : 'bone';
  const [job, setJob] = React.useState<Job>('link');
  const [feel, setFeel] = React.useState<Feel>({ v: 0.7, a: 0.8, w: 0.4 });
  const [soundOn, setSoundOn] = React.useState(false);
  const sound = React.useMemo(() => createSound(), []);
  const r: ResolvedFeel = React.useMemo(() => resolveFeel({ job, feel }), [job, feel]);
  // When the feel carries the object across a material boundary, it re-casts and strikes in its new voice.
  const [recast, setRecast] = React.useState(0);
  const lastMaterial = React.useRef(r.material);
  React.useEffect(() => {
    if (lastMaterial.current === r.material) return;
    lastMaterial.current = r.material;
    setRecast((n) => n + 1);
    sound.strike(r.material, { weight: feel.w, reach: r.reach });
  }, [r.material]); // eslint-disable-line react-hooks/exhaustive-deps

  const worked = React.useMemo(() => Object.entries(placements).filter(([k]) => !k.startsWith('$'))
    .map(([name, p]) => ({ name, resolved: resolveFeel(p as never) })), []);
  const setProblems = React.useMemo(() => checkSet(worked), [worked]);
  const f0 = SOUND.pitch.base * Math.sqrt(SOUND.pitch.ref / SOUND.pitch.body) * (1 - SOUND.pitch.heavy * feel.w) * SOUND.materials[r.material].f0x;
  const set = (k: keyof Feel) => (x: number) => setFeel((f) => ({ ...f, [k]: Math.round(x * 100) / 100 }));

  return (
    <>
      <PageHeader
        title="Gadgets"
        lede="A gadget is described by what it means and what it should make you feel. Its job (a verb) picks the object and its hue; its feel (valence, arousal, weight) picks the material, the colour's lightness and strength, the weight its parts strike with and the key of its beeper. Nothing is tuned per gadget: every gadget resolves through the same foundations, so any two sit together and any new one belongs."
      />

      <Section title="The feel space" lede="Choose a job, then move through the space. Valence runs tense to pleased, arousal still to active, weight light to heavy. Each point is coloured by the body it resolves to. Crossing into another material re-casts the object, and it strikes in its new voice.">
        <Bench caption={`${r.material} (${ruleWords(r.materialBy)}) · body oklch(${r.body.L.toFixed(2)} ${r.body.C.toFixed(3)} ${Math.round(r.body.H)}) · accent ${r.accent.H === 45 ? 'house orange' : 'sky'} · beeper ${r.scale} from MIDI ${r.register} · strikes near ${Math.round(f0)} Hz`}>
          <div className="grid w-full items-center gap-24 md:grid-cols-[minmax(0,420px)_1fr]" data-testid="feel-bench" data-material={r.material} data-job={job}>
            <FeelSpace job={job} feel={feel} onPick={setFeel} />
            <div className="flex flex-col gap-16">
              <div className="flex items-center gap-20">
                <button type="button" aria-label={`Strike the ${r.material} body`} onPointerDown={() => sound.strike(r.material, { weight: feel.w, reach: r.reach })} className="cursor-pointer border-0 bg-transparent p-0 focus-visible:focus-ring rounded-card">
                  <GadgetSpecimen resolved={r} host={host} size={168} lamp="live" recast={recast} label={`A ${job} gadget in ${r.material}`} />
                </button>
                <div className="flex flex-col gap-4">
                  <span className="type-title text-ink" data-testid="feel-material">{r.material[0].toUpperCase() + r.material.slice(1)}</span>
                  <span className="type-ui text-ink2">It {VERB[job]}; it feels {feelWords(feel).join(', ')}.</span>
                  <span className="type-readout text-ink3">{(SOUND.materials[r.material] as { hear: string }).hear}</span>
                </div>
              </div>
              <label className="flex items-center gap-12 type-ui text-ink">
                <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (next) => { if (next) await sound.enable(); else sound.disable(); setSoundOn(next); }} />
                Sound
              </label>
              <div className="flex items-center gap-12">
                <span className="type-label engraved w-[72px]">Job</span>
                <Select<Job> aria-label="Job" value={job} onValueChange={setJob} options={JOBS.map((j) => ({ value: j, label: j }))} />
              </div>
              {(['v', 'a', 'w'] as const).map((k) => (
                <div key={k} className="grid grid-cols-[72px_1fr_36px] items-center gap-12">
                  <span className="type-label engraved">{{ v: 'Valence', a: 'Arousal', w: 'Weight' }[k]}</span>
                  <div className="h-32">
                    <Slider.Root value={feel[k]} min={0} max={1} step={0.01} largeStep={0.1} onValueChange={set(k)}>
                      <Slider.Track />
                      <Slider.Knob aria-label={{ v: 'Valence', a: 'Arousal', w: 'Weight' }[k]} />
                    </Slider.Root>
                  </div>
                  <span className="type-readout text-ink3 text-right">{feel[k].toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </Bench>
      </Section>

      <Section title="The worked set" lede="Eleven placements from the model, each resolved by the same rules. Set rules check them side by side: hues apart, no shared material and lightness band, a visible difference, also for red–green colour blindness. Where two collide, the page says so; a rig that holds both would be refused.">
        <Bench caption={setProblems.length ? `${setProblems.length} set ${setProblems.length === 1 ? 'problem' : 'problems'} if all eleven sat together` : 'All eleven can sit together.'}>
          <div className="flex w-full flex-col gap-20">
            <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-12" data-testid="worked-set">
              {worked.map(({ name, resolved }) => (
                <figure key={name} className="m-0 flex flex-col items-center gap-4" data-placement={name} data-material={resolved.material}>
                  <GadgetSpecimen resolved={resolved} host={host} size={104} label={`${name}: ${resolved.material}`} />
                  <figcaption className="flex flex-col items-center"><span className="type-ui text-ink capitalize">{name}</span><span className="type-readout text-ink3">{resolved.job} · {resolved.material}</span></figcaption>
                </figure>
              ))}
            </div>
            {setProblems.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-6 p-0" data-testid="set-problems">
                {setProblems.map((p, i) => <li key={i} data-code={p.code} className="type-ui text-ink2"><span className="type-readout text-ink">{p.code}</span> {p.message} <span className="text-ink3">→ {p.fix}</span></li>)}
              </ul>
            )}
          </div>
        </Bench>
        <SwiftCapture name="gadgets-worked-set" />
      </Section>

      <Section title="The spec" lede="A gadget or a rig is a small spec: a job, a feel, parts from the catalog, one mechanism, states, ports and cables. The validator returns every problem at once, each with a fix an assistant can apply. Pick an example, or a way to break one, or edit it.">
        <Bench caption="metalui/gadget@1 and metalui/rig@1, validated as you type.">
          <SpecBench />
        </Bench>
      </Section>

      <Section title="Resolution">
        <TokenTable
          head={['Output', 'From', 'Rule']}
          mono={[0]}
          rows={[
            ['material', 'job pin, else feel', GADGETS.feel.materialRules.map(([r, m]) => `${r} → ${m}`).join(' · ')],
            ['L', 'weight, valence', `${GADGETS.feel.L.base} ${GADGETS.feel.L.W} × w + ${GADGETS.feel.L.V} × (v − ½), within the material`],
            ['C', 'arousal, valence', `${GADGETS.feel.C.base} + ${GADGETS.feel.C.A} × a × (${GADGETS.feel.C.VMix[0]} + ${GADGETS.feel.C.VMix[1]} × v), capped by the material`],
            ['H', 'job station', `station + ${GADGETS.feel.H.V} × (v − ½) ${GADGETS.feel.H.W} × w`],
            ['accent', 'body hue', `house orange; sky when the body sits within ${GADGETS.accent.flipWithinDeg}° of orange with chroma ${GADGETS.accent.flipMinC} or more`],
            ['beeper', 'weight, valence', 'register from weight (high when light), major when pleased, minor when tense'],
          ]}
        />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'G1', title: 'Meaning and feeling are separate', body: 'The job picks the object and the hue; the feel picks the material, colour strength and sound. Neither overrides the other, so a heavy link and a light link are the same object in different bodies.' },
            { id: 'G2', title: 'A state is the same object', body: 'A state may change a gadget\'s feel, lamp and pose, never its material. Sync failing is the same patch bay with its plug out and its lamp blinking.' },
            { id: 'G3', title: 'Signals stay on lamps', body: 'Green, amber, red and blue live in the lamp alone. A destroy gadget is dark rubber with a red lamp, never a red body.' },
            { id: 'G4', title: 'Side by side, never alike', body: 'Gadgets together keep their hues apart and never share a material in the same lightness band, and they stay distinct to red–green colour blindness.' },
            { id: 'G5', title: 'Compose, never invent, at run time', body: 'A spec uses Parts and mechanisms from the catalog. A new Part or mechanism is drawn and tuned once, by a person; then everyone can compose with it.' },
          ]}
        />
      </Section>
    </>
  );
}
