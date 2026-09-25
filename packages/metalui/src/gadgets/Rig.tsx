'use client';

// <Rig spec />: gadgets on a grid in one panel, wired by patch cables. Each gadget sits in a tray in the
// panel and is drawn by <Gadget>; every wired port has a jack beside its gadget with a plug in it, and a
// rubber cord runs between the plugs. Set a gadget's input (`values`) and the rig works out what travels:
// a bead of light runs along each cord it crosses, and the gadget at the far end answers when it
// arrives, hop by hop. Like a gadget, a rig is never a control.
import * as React from 'react';
import type { GadgetSpec, RigSpec, Value } from './spec';
import { GADGETS } from './gadgets.generated';
import { resolveFeel } from './resolve';
import { drawSlab, type Cut } from './parts/slab';
import { drawJack } from './parts/jack';
import { drawPlug } from './parts/plug';
import { drawCable } from './parts/cable';
import { tierFor, type Host } from './light';
import { useHost } from './host';
import { createRigFlow, layoutRig, type RigHop } from './rig-engine';
import { Gadget } from './Gadget';
import type { Sound } from '../sound/sound';

export interface RigProps extends Omit<React.SVGProps<SVGSVGElement>, 'values'> {
  spec: RigSpec;
  /** The gadgets a rig names by catalog name. */
  catalog?: Record<string, GadgetSpec>;
  /** Inputs set from outside: instance → port → value. A change travels the cables. */
  values?: Record<string, Record<string, Value>>;
  sound?: Sound | null;
  /** Rendered width in pixels. */
  width?: number;
  host?: Host;
  /** Every hop as its value sets off along a cable. */
  onPropagate?: (hop: RigHop) => void;
}

const R = GADGETS.rig;
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Rig({ spec, catalog = {}, values, sound = null, width = 560, host: forced, onPropagate, ...props }: RigProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const layout = React.useMemo(() => layoutRig(spec, catalog), [spec, catalog]);
  const flow = React.useMemo(() => createRigFlow(spec, catalog), [spec, catalog]);
  const unit = width / layout.width, tier = tierFor(400 * unit);
  // What each gadget shows: its inputs as they have arrived (a value on its way is not there yet).
  const [shown, setShown] = React.useState(() => structuredClone(flow.inputs));
  const [beads, setBeads] = React.useState<{ key: number; cable: number; at: number }[]>([]);

  const art = React.useMemo(() => {
    const r = resolveFeel({ job: spec.job, feel: spec.feel });
    const [bx, by, bw, bh] = GADGETS.canvas.body;
    const cuts: Cut[] = [
      ...layout.modules.map((m) => ({ kind: 'tray' as const, at: [m.at[0] + bx + bw / 2, m.at[1] + by + bh / 2] as [number, number], size: [bw + R.tray, bh + R.tray] as [number, number], depth: R.tray, radius: GADGETS.canvas.radius })),
      ...layout.jacks.map((j) => ({ kind: 'hole' as const, at: j.at, size: [R.jack * GADGETS.jack.hole, R.jack * GADGETS.jack.hole] as [number, number] })),
    ];
    const panel = drawSlab(`rig-${uid}`, { at: [layout.width / 2, layout.height / 2], size: [layout.width, layout.height], radius: R.radius, material: r.material, color: r.body, cuts }, { tier, host });
    const jacks = layout.jacks.map((j, i) => drawJack(`rig-${uid}-j${i}`, { at: j.at, size: R.jack }, { tier, host }));
    // Pale clay plugs: the accent stays in the gadgets, where the thing to touch is.
    const clay = { L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: (GADGETS.materials.clay as unknown as { sample: number }).sample };
    const plugs = layout.cables.flatMap((c) => [c.a, c.b].map((at, k) => drawPlug(`rig-${uid}-p${c.index}-${k}`, { at, size: R.jack * GADGETS.plug.face, color: clay }, { tier, host })));
    const cords = layout.cables.map((c) => drawCable(`rig-${uid}-c${c.index}`, { from: c.a, to: c.b, length: c.length }, { tier }));
    return { panel, jacks, plugs, cords };
  }, [layout, spec.job, spec.feel, tier, host, uid]);

  // A change from outside: work out the hops, then run a bead along each and deliver on arrival.
  const last = React.useRef(values);
  React.useEffect(() => {
    if (values === last.current) return;
    const before = last.current;
    last.current = values;
    for (const [inst, ports] of Object.entries(values ?? {})) for (const [port, v] of Object.entries(ports)) {
      if (before?.[inst]?.[port] === v) continue;
      setShown((s) => ({ ...s, [inst]: { ...s[inst], [port]: v } }));
      const hops = flow.set(inst, port, v);
      hops.forEach((hop) => {
        onPropagate?.(hop);
        const [ti, tp] = hop.to.split('.');
        const deliver = () => setShown((s) => ({ ...s, [ti]: { ...s[ti], [tp]: typeof hop.value === 'object' ? s[ti][tp] : hop.value } }));
        if (reducedMotion()) { deliver(); return; }
        const key = Math.random();
        const delay = (hop.hop - 1) * R.travel;
        window.setTimeout(() => {
          setBeads((b) => [...b, { key, cable: hop.cable, at: performance.now() }]);
          window.setTimeout(() => { setBeads((b) => b.filter((x) => x.key !== key)); deliver(); }, R.travel);
        }, delay);
      });
    }
  }, [values]); // eslint-disable-line react-hooks/exhaustive-deps

  // Beads: a light at a share of its cord, moved every frame while any is on its way.
  const cordRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const [, frame] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!beads.length) return;
    let raf = requestAnimationFrame(function tick() { frame(); raf = requestAnimationFrame(tick); });
    return () => cancelAnimationFrame(raf);
  }, [beads.length]);
  const beadAt = (cable: number, t0: number): [number, number] | null => {
    const path = cordRefs.current[cable];
    if (!path) return null;
    const share = Math.min(1, (performance.now() - t0) / R.travel), p = path.getPointAtLength(share * path.getTotalLength());
    return [p.x, p.y];
  };
  const voices = new Set(layout.modules.slice(0, R.voices).map((m) => m.inst));
  const [br, ba] = R.bead;
  return (
    <svg ref={ref} viewBox={`0 0 ${layout.width} ${layout.height}`} width={width} height={layout.height * unit} role="group" aria-label={spec.title}
      data-rig={spec.name} data-tier={tier} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: art.panel.defs + art.jacks.map((j) => j.defs).join('') + art.plugs.map((p) => p.defs).join('') + art.cords.map((c) => c.defs).join('') }} />
      <g data-layer="panel" dangerouslySetInnerHTML={{ __html: art.panel.floors + art.jacks.map((j) => j.socket).join('') + art.panel.body + art.panel.lips + art.jacks.map((j) => j.nut).join('') }} />
      {layout.modules.map((m) => {
        const drive = m.spec.mechanism.drive ?? Object.keys(m.spec.ports?.in ?? {})[0];
        const v = drive ? shown[m.inst]?.[drive] : undefined;
        return <Gadget key={m.inst} spec={m.spec} value={typeof v === 'number' ? v : typeof v === 'boolean' ? Number(v) : undefined} sound={voices.has(m.inst) ? sound : null}
          x={m.at[0]} y={m.at[1]} size={400} tier={tier} host={host} data-inst={m.inst} />;
      })}
      <g data-layer="cables">
        {layout.cables.map((c, i) => (
          <g key={c.index} data-cable={`${c.from}→${c.to}`}>
            <title>{`${c.from} drives ${c.to}`}</title>
            <path ref={(el) => { cordRefs.current[i] = el; }} d={c.d} fill="none" stroke="none" />
            <g dangerouslySetInnerHTML={{ __html: art.cords[i].shadow + art.cords[i].body }} />
          </g>
        ))}
      </g>
      <g data-layer="plugs" dangerouslySetInnerHTML={{ __html: art.plugs.map((p) => p.shadow + p.body).join('') }} />
      <g data-layer="beads">
        {beads.map((b) => { const p = beadAt(b.cable, b.at); return p && <circle key={b.key} cx={p[0]} cy={p[1]} r={br} fill={GADGETS.lamp.live[0]} fillOpacity={ba} data-bead={b.cable} />; })}
      </g>
    </svg>
  );
}
