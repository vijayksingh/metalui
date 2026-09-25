import { actor, ease, light, motion, pose, T } from '../motion.mjs';

/* ── IMAGE / the sun rises over the ridge in the frame ────────
 * Verb, object   look at a picture. The frame is the window; the sun is the one thing in the
 *                landscape that can move, and it moves the way a sun does: out from behind
 *                the ridge, up, and back down.
 * Invariant      the frame, the ridge line and its fill never move; the sun only ever travels
 *                behind the ridge (its mask) and inside the frame (its clip); it keeps its size.
 * Causal parts   cause: the sun, climbing from behind the ridge. Receiver: the sky inside the
 *                frame. Payoff: six short rays flare around it at the top of its climb.
 * Neighbours     not Weather/Sun (the frame and landscape hold the scene), not Upload (nothing
 *                leaves the frame), not a zoom (the frame keeps its size).
 * Forbidden      a frame breathe/pulse, the sun spinning, a whole-icon bounce.
 *
 *    0ms  rest, the sun half behind the ridge
 *  180ms  it dips 1.2 behind the ridge (anticipate)
 *  440ms  climbs up and a little left to 3.8 above rest (strike, decelerating)
 *  470ms  rays flare around it, peak at 530ms, widen and fade by 780ms
 *  560ms  settles back .3 from the peak and holds
 *  760ms  sets, sliding back down behind the ridge
 * 1100ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1100;
const UP = { x: -0.7, y: -3.8 };

export const act = {
  defs: `<clipPath id="&-in"><rect x="3.6" y="5.1" width="16.8" height="13.8" rx="2.6"/></clipPath><mask id="&-sky" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><path d="M2 18.4 8.4 12a1.3 1.3 0 0 1 1.84 0L14.3 16l2-1.9a1.3 1.3 0 0 1 1.8 0L22 17.8V24H2Z" fill="#000" stroke="#000" stroke-width="3.9" stroke-linejoin="round"/></mask>`,
  body: `<rect x="2.8" y="4.3" width="18.4" height="15.4" rx="3.4"/><g clip-path="url(#&-in)"><g mask="url(#&-sky)"><circle class="s" data-part="sun" cx="16.9" cy="11.9" r="1.85"/><path class="ac" data-part="rays" opacity="0" d="M19.2 8.3h1M17.75 10.81l.5.87M14.85 10.81l-.5.87M13.4 8.3h-1M14.85 5.79l-.5-.87M17.75 5.79l.5-.87" style="stroke-width:calc(var(--sw) * .7)"/></g><path class="d" d="M2 18.4 8.4 12a1.3 1.3 0 0 1 1.84 0L14.3 16l2-1.9a1.3 1.3 0 0 1 1.8 0L22 17.8V24H2Z"/></g><path d="M3.4 17 8.4 12a1.3 1.3 0 0 1 1.84 0L14.3 16l2-1.9a1.3 1.3 0 0 1 1.8 0l2.6 2.5"/>`,
  study: motion(D, 'The sun dips behind the ridge, climbs into the sky with a flare of rays, and sets again.', ['Dip', 'Rise', 'Set'], [
    actor('sun', '16.9px 11.9px', [
      pose(0, T(), ease.smooth),
      pose(180, T({ x: 0.2, y: 1.2 }), ease.strike),
      pose(440, T(UP), ease.smooth),
      pose(560, T({ x: -0.62, y: -3.5 }), ease.smooth),
      pose(760, T({ x: -0.6, y: -3.45 }), ease.smooth),
      pose(D, T()),
    ]),
    actor('rays', '16.3px 8.3px', [
      light(0, 0, 'scale(.6)'), light(460, 0, 'scale(.6)', ease.settle),
      light(530, 0.9, 'scale(1)', ease.smooth), light(780, 0, 'scale(1.3)'), light(D, 0, 'scale(.6)'),
    ]),
  ]),
  shape: 'Landscape keyline. Sun is masked by the ridge (fill + 1u gap), so it can rise from behind it. Motion (study): the sun dips 1.2 behind the ridge, climbs 3.8 into the sky, six short rays flare around it at the top (inside the frame clip, behind the ridge like the sun), and it sets back behind the ridge.',
};
