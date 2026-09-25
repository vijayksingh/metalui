import * as React from 'react';
import { GADGETS, bodyFill, materialFilter, pigment, type Host, type ResolvedFeel } from '@unlocalhosted/metalui/gadgets';

const [BX, BY, BW, BH] = GADGETS.canvas.body;
const R = GADGETS.canvas.radius;
export const BODY_PATH = `M${BX + R},${BY} H${BX + BW - R} A${R},${R} 0 0 1 ${BX + BW},${BY + R} V${BY + BH - R} A${R},${R} 0 0 1 ${BX + BW - R},${BY + BH} H${BX + R} A${R},${R} 0 0 1 ${BX},${BY + BH - R} V${BY + R} A${R},${R} 0 0 1 ${BX + R},${BY} Z`;
const [LX, LY] = GADGETS.canvas.lamp;

const LAMPS: Record<string, [string, string]> = {
  off: ['#8B8B8E', '#4A4A4D'], live: ['#D9FFE9', '#2FB673'], waiting: ['#FFF1CF', '#C98A18'], failed: ['#FFD9D2', '#D5392A'], link: ['#D8E6FF', '#2457F2'],
};

/**
 * A resolved placement as an object: its body cut from its material, one accent cap (the part you
 * would touch), and its lamp. The docs' way of showing what a feel resolves to before Parts exist.
 */
export function GadgetSpecimen({ resolved, host, size = 180, lamp = 'off', label, recast = 0 }: {
  resolved: ResolvedFeel; host: Host; size?: number; lamp?: keyof typeof LAMPS; label?: string; recast?: number;
}) {
  const uid = React.useId().replace(/:/g, '');
  const { body, accent, material } = resolved;
  const defs = React.useMemo(() => {
    const cap = pigment(accent.L - 0.12, accent.C * 0.95, accent.H + 6);
    const [l0, l1] = LAMPS[lamp];
    return materialFilter(`gs-${uid}-f`, material, { tier: size >= GADGETS.tiers.full ? 'full' : 'lite', host })
      + materialFilter(`gs-${uid}-p`, 'clay', { tier: 'lite', host, part: true })
      + bodyFill(`gs-${uid}-b`, material, body.L, body.C, body.H, host)
      + `<radialGradient id="gs-${uid}-a" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="${pigment(accent.L + 0.05, accent.C * 0.9, accent.H - 6).srgb}"/><stop offset="1" stop-color="${accent.pigment.srgb}"/></radialGradient>`
      + `<radialGradient id="gs-${uid}-l" cx=".4" cy=".35" r=".65"><stop offset="0" stop-color="${l0}"/><stop offset="1" stop-color="${l1}"/></radialGradient>`
      + `<linearGradient id="gs-${uid}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cap.srgb}"/><stop offset="1" stop-color="${cap.srgb}"/></linearGradient>`;
  }, [uid, material, body.L, body.C, body.H, accent.L, accent.C, accent.H, host, size, lamp]);
  const ref = React.useRef<SVGGElement>(null);
  // Re-cast: when the material changes, the object settles into its new body.
  React.useEffect(() => {
    if (!recast || !ref.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ref.current.animate([{ transform: 'scale(.94)', opacity: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.3,1.4,.4,1)' });
  }, [recast]);
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={label ?? `${material} body`} data-material={material} className="overflow-visible">
      <defs dangerouslySetInnerHTML={{ __html: defs }} />
      <g ref={ref} style={{ transformBox: 'fill-box', transformOrigin: '50% 60%' }}>
        <path d={BODY_PATH} fill={`url(#gs-${uid}-b)`} filter={`url(#gs-${uid}-f)`} />
        <g filter={`url(#gs-${uid}-p)`}>
          <circle cx="262" cy="266" r="38" fill={`url(#gs-${uid}-s)`} />
          <circle cx="262" cy="262" r="36" fill={`url(#gs-${uid}-a)`} />
          <rect x="256" y="232" width="12" height="60" rx="6" fill={`url(#gs-${uid}-a)`} />
        </g>
        <circle cx={LX} cy={LY} r="11" fill={`url(#gs-${uid}-l)`} stroke="rgba(0,0,0,.25)" strokeWidth=".8" />
      </g>
    </svg>
  );
}
