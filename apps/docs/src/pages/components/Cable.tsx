import * as React from 'react';
import { Cable, Slab, Switch } from '@unlocalhosted/metalui';
import { GADGETS, createCableSwing, drawCable, drawJack, drawPlug, tierFor, type CableSwing } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import cableSource from '../../../../../packages/metalui/src/components/cable/cable.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/cable.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/cable/cable.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalCable.swift?raw';
import { useColorway } from '../../app/colorway';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

type Pt = [number, number];
const LENGTH = 280;
const JACK_A: Pt = [120, 150], JACK_B: Pt = [280, 150], LOOSE: Pt = [262, 292];
const STEP = 12;
// One cord, 280 units long, with its ends at three distances: taut, hanging, and a U.
const DROOPS: { label: string; from: Pt; to: Pt }[] = [
  { label: 'taut', from: [60, 150], to: [340, 150] },
  { label: 'hanging', from: [90, 150], to: [310, 150] },
  { label: 'a U', from: [150, 150], to: [250, 150] },
];

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clampTo = (a: Pt, p: Pt, r: number): Pt => {
  const dx = p[0] - a[0], dy = p[1] - a[1], d = Math.hypot(dx, dy);
  return d <= r ? p : [a[0] + (dx * r) / d, a[1] + (dy * r) / d];
};

/** A clay panel with two jacks: one plug seated, one loose on its cord. Drag the loose plug (or move it
 *  with the arrow keys and let go with Enter); let go over the free jack and it seats. */
function Patch({ sound }: { sound: ReturnType<typeof createSound> }) {
  const { colorway } = useColorway();
  const host = colorway === 'graphite' ? 'graphite' : 'bone';
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(260);
  const [w, wC, wH] = GADGETS.accent.warm;
  const [at, setAt] = React.useState<Pt>(LOOSE);
  const [seated, setSeated] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const cordRef = React.useRef<SVGGElement>(null);
  const swing = React.useRef<CableSwing | null>(null);
  const clay = { L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: (GADGETS.materials.clay as unknown as { sample: number }).sample };

  const a = drawJack(`pa-${uid}`, { at: JACK_A, lit: seated ? 'link' : null }, { tier, host });
  const b = drawJack(`pb-${uid}`, { at: JACK_B, lit: seated ? 'link' : null }, { tier, host });
  const cord = React.useMemo(() => drawCable(`pc-${uid}`, { from: JACK_A, to: LOOSE, length: LENGTH }, { tier }), [uid, tier]);
  const home = React.useMemo(() => drawPlug(`ph-${uid}`, { at: [0, 0], color: clay }, { tier, host }), [uid, tier, host]); // eslint-disable-line react-hooks/exhaustive-deps
  const loose = React.useMemo(() => drawPlug(`pl-${uid}`, { at: [0, 0], color: { L: w, C: wC, H: wH } }, { tier, host }), [uid, tier, host, w, wC, wH]);

  React.useEffect(() => {
    if (!cordRef.current) return;
    const s = createCableSwing(cordRef.current, { from: JACK_A, to: LOOSE, length: LENGTH }, { reduced: reducedMotion() });
    swing.current = s;
    return () => s.destroy();
  }, [cord]);
  const moveTo = (p: Pt) => {
    const q = clampTo(JACK_A, p, LENGTH);   // the cord is only so long: past it, the plug stops
    setAt(q);
    swing.current?.setReduced(reducedMotion());
    swing.current?.set({ from: JACK_A, to: q, length: LENGTH });
    return q;
  };
  const letGo = (p: Pt) => {
    setHeld(false);
    if (Math.hypot(p[0] - JACK_B[0], p[1] - JACK_B[1]) <= GADGETS.cable.seatReach) {
      moveTo(JACK_B); setSeated(true);
      sound.strike('clay', { size: 54, weight: 0.4, reach: 'world' });
      sound.strike('metal', { size: 68, weight: 0.3, reach: 'world', level: 0.4, delay: 0.02 });
    } else {
      sound.strike('clay', { size: 54, weight: 0.3, reach: 'world', level: 0.35 });
      sound.strike('rubber', { size: 40, weight: 0.2, reach: 'world', level: GADGETS.parts.cable.strike[1] as number, delay: 0.04 });
    }
  };
  const toCanvas = (e: React.PointerEvent): Pt => {
    const svg = cordRef.current?.ownerSVGElement, m = svg?.getScreenCTM()?.inverse();
    if (!svg || !m) return at;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return [p.x, p.y];
  };
  const onDown = (e: React.PointerEvent) => { e.currentTarget.setPointerCapture(e.pointerId); setHeld(true); setSeated(false); moveTo(toCanvas(e)); };
  const onMove = (e: React.PointerEvent) => { if (held) moveTo(toCanvas(e)); };
  const onUp = (e: React.PointerEvent) => { if (held) letGo(moveTo(toCanvas(e))); };
  const onKey = (e: React.KeyboardEvent) => {
    const d: Record<string, Pt> = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] };
    if (d[e.key]) { e.preventDefault(); setSeated(false); setHeld(true); moveTo([at[0] + d[e.key][0], at[1] + d[e.key][1]]); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); letGo(at); }
  };
  const lift = held ? ' scale(1.06)' : '';
  return (
    <div data-testid="cable-patch" data-seated={seated || undefined} data-at={`${Math.round(at[0])},${Math.round(at[1])}`}>
      <Slab material="clay" size={260} cuts={[{ kind: 'hole', at: JACK_A, size: [30, 30] }, { kind: 'hole', at: JACK_B, size: [30, 30] }]}>
        <defs dangerouslySetInnerHTML={{ __html: a.defs + b.defs + cord.defs + home.defs + loose.defs }} />
        <g dangerouslySetInnerHTML={{ __html: a.socket + b.socket + a.nut + b.nut }} />
        <g ref={cordRef} dangerouslySetInnerHTML={{ __html: cord.shadow + cord.body }} />
        <g transform={`translate(${JACK_A[0]} ${JACK_A[1]})`} dangerouslySetInnerHTML={{ __html: home.shadow + home.body }} />
        <g transform={`translate(${at[0]} ${at[1]})${lift}`} role="button" tabIndex={0} aria-label="Loose plug: arrow keys move it, Enter lets go"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onKeyDown={onKey} onBlur={() => held && letGo(at)}
          className="cursor-grab touch-none outline-none focus-visible:[&>g]:[filter:drop-shadow(0_0_6px_var(--color-focus,#3b82f6))]" style={{ cursor: held ? 'grabbing' : undefined }}
          data-testid="cable-loose" dangerouslySetInnerHTML={{ __html: loose.shadow + loose.body }} />
      </Slab>
    </div>
  );
}

export default function CablePage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [far, setFar] = React.useState(false);
  return (
    <>
      <PageHeader
        title="Cable"
        lede="A rubber patch cord between two plugs. Give it a length and it hangs like a real cord: taut when its ends are pulled apart, a U when they come together. When an end moves, the belly swings after it and settles."
      />
      <Section title="Droop" lede="One cord 280 units long with its ends at three distances. The droop is the curve of a hanging cable, so nobody tunes it by eye.">
        <Bench caption={`gadgets.cable · width ${GADGETS.cable.width} (a plug's stub) · length 280 · belly on the ${GADGETS.cable.spring} spring`}>
          <div className="flex flex-wrap items-end gap-24" data-testid="cable-droops">
            {DROOPS.map((c) => (
              <figure key={c.label} className="m-0 flex flex-col items-center gap-6">
                <Cable from={c.from} to={c.to} length={LENGTH} size={180} />
                <figcaption className="type-label engraved">{c.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="cable" maxWidth={620} />
      </Section>
      <Section title="Swing" lede="Move an end and it goes at once, the way a hand holds it. The belly follows on the hinge spring and overshoots a little, as a hanging cord does. With reduced motion the cord goes straight to its new shape.">
        <Bench caption={`one end moves 120 units · ${far ? 'apart' : 'together'}`}>
          <div className="flex flex-wrap items-center gap-24">
            <div data-testid="cable-swing"><Cable from={[80, 170]} to={far ? [340, 170] : [220, 170]} length={LENGTH} size={220} /></div>
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Pull apart" checked={far} onCheckedChange={setFar} />Pull apart
            </label>
          </div>
        </Bench>
      </Section>
      <Section title="Patch it" lede="Drag the orange plug. Its cord is only so long, so past that the plug stops. Let it go over the free jack and it seats with a click, and both sockets light. Let it go anywhere else and it drops. With a keyboard, the arrow keys move it and Enter lets go.">
        <Bench caption="two jacks in clay · one cord · seats within 30 units of the jack">
          <div className="flex flex-wrap items-center gap-24">
            <Patch sound={sound} />
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
            </label>
          </div>
        </Bench>
      </Section>
      <Section title="Detail by size">
        <Bench caption="the body, underside, sheen and a soft shadow · flat: body, sheen and a hard shadow">
          <div className="flex flex-wrap items-end gap-20" data-testid="cable-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Cable from={[70, 160]} to={[330, 160]} length={LENGTH + 40} size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'C1', title: 'Both ends plugged', body: 'A cable means two things are joined. A cord with a loose end is only there while someone holds it.' },
            { id: 'C2', title: 'Gravity decides the droop', body: 'Give a cord its length and let the physics hang it. Tune the length, never the curve.' },
            { id: 'C3', title: 'Under the plugs, over the bodies', body: 'A cord lies on the panel and runs into its plugs. It never crosses a lamp; route it lower instead.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: cableSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
