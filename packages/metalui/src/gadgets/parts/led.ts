// The LED as a gadget draws it: a lens in a hole in the body, lit in a signal colour and moving by one
// of the lamp gestures (tokens status.gestures, the same keyframes the LED Part uses). The lamp is
// light, so it animates brightness, never position; with reduced motion it holds its level.
import { GADGETS } from '../gadgets.generated';

export type LampSignal = 'off' | 'live' | 'link' | 'waiting' | 'failed';
/** [centre, edge] of each signal's lens (tokens gadgets.lamp). */
export const LAMP_COLORS = GADGETS.lamp as unknown as Record<LampSignal, [string, string]>;

export interface LampSpec { at: [number, number]; size?: number; signal: LampSignal; gesture?: string }

const n = (x: number) => +x.toFixed(2);
// Named in full so Tailwind emits them: animate-led-flicker animate-led-breathe animate-led-blink2 animate-led-rise

export function drawLamp(id: string, s: LampSpec): { defs: string; body: string } {
  const [c0, c1] = LAMP_COLORS[s.signal] ?? LAMP_COLORS.off, r = (s.size ?? GADGETS.parts.led.size[0]) / 2;
  const gesture = s.signal === 'off' ? 'steady' : s.gesture ?? 'steady';
  const defs = `<radialGradient id="${id}-lens" cx=".4" cy=".35" r=".65"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></radialGradient>`;
  const motion = gesture === 'steady' ? '' : ` class="animate-led-${gesture} reduced-motion:animate-none"`;
  const body = `<circle cx="${n(s.at[0])}" cy="${n(s.at[1])}" r="${n(r)}" fill="url(#${id}-lens)" stroke="rgba(0,0,0,.25)" stroke-width=".8" data-part="lamp" data-lamp="${s.signal}" data-gesture="${gesture}"${motion}/>`;
  return { defs, body };
}
