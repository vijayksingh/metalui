import * as React from 'react';
import { GADGETS, GADGET_MATERIALS, bodyFill, materialFilter, type GadgetMaterial, type Host, type LightOptions } from '@unlocalhosted/metalui/gadgets';
import { SOUND, type Sound } from '@unlocalhosted/metalui/sound';

/** The weights the sheet shows each material at: light, middling, heavy. */
export const SHEET_WEIGHTS = [0.1, 0.5, 0.9] as const;

const [BX, BY, BW, BH] = GADGETS.canvas.body;
const R = GADGETS.canvas.radius;
const BODY = `M${BX + R},${BY} H${BX + BW - R} A${R},${R} 0 0 1 ${BX + BW},${BY + R} V${BY + BH - R} A${R},${R} 0 0 1 ${BX + BW - R},${BY + BH} H${BX + R} A${R},${R} 0 0 1 ${BX},${BY + BH - R} V${BY + R} A${R},${R} 0 0 1 ${BX + R},${BY} Z`;

type Finish = { L: readonly [number, number]; cCap: number; sample: number; gloss: readonly [number, number] };
const finish = (m: GadgetMaterial) => {
  const r = GADGETS.materials[m] as unknown as { L: readonly [number, number]; CCap: number; sample: number; gloss: readonly [number, number] };
  return { L: r.L, cCap: r.CCap, sample: r.sample, gloss: r.gloss } satisfies Finish;
};

/** A sample body for the sheet: lighter when light, darker when heavy, at the material's own hue. */
export function sampleBody(m: GadgetMaterial, weight: number) {
  const f = finish(m);
  const L = Math.min(f.L[1], Math.max(f.L[0], 0.88 - 0.56 * weight));
  const C = Math.min(f.cCap, 0.095);
  return { L, C, H: f.sample - 8 * weight };
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const springOf = (name: string, fallback: string) => {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--mu-spring-${name}`).trim();
  return v || fallback;
};
const durOf = (name: string) => {
  if (typeof document === 'undefined') return 600;
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--mu-spring-${name}-d`).trim();
  return v.endsWith('ms') ? parseFloat(v) : v.endsWith('s') ? parseFloat(v) * 1000 : 600;
};

/** The visual twin of a strike: the body gives by its material's travel, soft ones squash, glossy ones glint. */
function play(cell: SVGSVGElement, m: GadgetMaterial) {
  const body = cell.querySelector<SVGGElement>('[data-part="body"]');
  const glint = cell.querySelector<SVGRectElement>('[data-part="glint"]');
  if (!body) return;
  const S = GADGETS.strike;
  const travel = (S.travel as Record<string, number>)[m] ?? 0;
  const squash = reduced() ? 0 : (S.squash as Record<string, number>)[m] ?? 0;
  const spring = springOf('part', 'ease-out'), back = durOf('part');
  const down = `translateY(${travel * 2}px) scale(${1 + squash / 2}, ${1 - squash})`;
  body.animate([{ transform: 'none' }, { transform: down }], { duration: 50, easing: 'linear', fill: 'forwards' })
    .finished.then(() => body.animate([{ transform: down }, { transform: 'none' }], { duration: back, easing: spring, fill: 'forwards' }))
    .catch(() => {});
  if (glint && !reduced() && finish(m).gloss[1] > S.glintAbove) {
    glint.animate([{ transform: 'translateX(0)', opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: 'translateX(560px)', opacity: 0 }],
      { duration: S.glintMs, easing: springOf('settle', 'ease-out') });
  }
}

export interface SheetProps {
  host: Host;
  contrast?: boolean;
  sound: Sound;
  /** Workbench multipliers for one material's finish. */
  tune?: { material: GadgetMaterial; values: LightOptions['tune'] };
  size?: number;
}

/** Seven materials at three weights, lit by the one light. Strike a body, or run a finger along a row. */
export function GadgetMaterialSheet({ host, contrast, sound, tune, size = 132 }: SheetProps) {
  const uid = React.useId().replace(/:/g, '');
  const defs = React.useMemo(() => GADGET_MATERIALS.map((m) =>
    materialFilter(`gm-${uid}-${m}`, m, { tier: 'full', host, contrast, tune: tune?.material === m ? tune.values : undefined })).join(''),
  [uid, host, contrast, tune]);

  const strike = (el: SVGSVGElement, m: GadgetMaterial, weight: number) => {
    sound.strike(m, { weight, rendered: size });
    play(el, m);
  };

  return (
    <div className="flex w-full flex-col gap-10" data-testid="gadget-materials" data-host={host}>
      <svg width="0" height="0" className="absolute" aria-hidden dangerouslySetInnerHTML={{ __html: `<defs>${defs}<linearGradient id="gm-${uid}-glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="gm-${uid}-clip"><path d="${BODY}"/></clipPath></defs>` }} />
      {GADGET_MATERIALS.map((m) => (
        <div key={m} className="grid grid-cols-[minmax(120px,180px)_1fr] items-center gap-16 max-sm:grid-cols-1" data-row={m}>
          <div className="flex flex-col gap-4">
            <span className="type-title text-ink capitalize">{m}</span>
            <span className="type-ui text-ink2">{(SOUND.materials[m] as { hear: string }).hear}</span>
          </div>
          <div className="flex flex-wrap gap-8">
            {SHEET_WEIGHTS.map((w) => {
              const b = sampleBody(m, w);
              const fill = bodyFill(`gm-${uid}-${m}-${w}`, m, b.L, b.C, b.H, host);
              return (
                <figure key={w} className="m-0 flex flex-col items-center gap-4">
                <svg
                  viewBox="0 0 400 400"
                  width={size}
                  height={size}
                  role="img"
                  aria-label={`${m}, weight ${w}`}
                  data-gadget-material={m}
                  data-weight={w}
                  className="cursor-pointer overflow-visible touch-none select-none"
                  onPointerDown={(e) => strike(e.currentTarget, m, w)}
                  onPointerEnter={(e) => { if (e.buttons === 1) strike(e.currentTarget, m, w); }}
                >
                  <defs dangerouslySetInnerHTML={{ __html: fill }} />
                  <g data-part="body" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
                    <path d={BODY} fill={`url(#gm-${uid}-${m}-${w})`} filter={`url(#gm-${uid}-${m})`} />
                    <g clipPath={`url(#gm-${uid}-clip)`} pointerEvents="none">
                      <g transform="skewX(-18)">
                        <rect data-part="glint" x={-200} y={0} width={120} height={400} fill={`url(#gm-${uid}-glint)`} opacity={0} />
                      </g>
                    </g>
                  </g>
                </svg>
                <figcaption className="type-readout text-ink3">W {w}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
