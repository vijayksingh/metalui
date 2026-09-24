// Morph glyphs: state icons that transform into each other instead of swapping.
//
// Every glyph is at most four strokes, each a 3-point polyline on the 24 grid,
// drawn with the icon set's 1.7 stroke and round caps. Sharing that skeleton is
// what lets any glyph become any other.
//   - Glyphs in a rotation group are one shape at different angles; between them
//     the shape turns like a dial into a detent (part spring, slight overshoot).
//   - Across groups the strokes move point by point (settle spring, no overshoot).
//   - A stroke the target does not need retracts into the nearest joint of the
//     target; a stroke the source did not have grows out of the nearest joint of
//     the source. Nothing vanishes into, or appears from, empty space.
// Idea after Benji Taylor's "Morphing icons with Claude"; the joint rule, the
// springs and the glyph drawings are MetalUI's.

export type Point = [number, number];
export type Stroke = [Point, Point, Point];

export interface MorphGlyph {
  /** Up to four strokes; index matters: the same index morphs into the same index. */
  strokes: (Stroke | null)[];
  /** Glyphs in the same group share strokes and differ only by angle. */
  group?: string;
  /** Rotation in degrees about the center (12, 12). */
  angle?: number;
}

const line = (x1: number, y1: number, x2: number, y2: number): Stroke => [[x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2], [x2, y2]];

// Index conventions keep related glyphs aligned, so the same index becomes the same part:
//   0  the first stroke: a head, a check, the bottom bar, the right-hand bar, the vertical
//   1  the middle: menu's middle bar (the one that leaves for close)
//   2  the main line: a shaft, the horizontal, the top bar, the left-hand bar
//   3  an extra: a tray, the back sheet
// Point order matters too: a stroke keeps its direction, or it folds through itself.
// The vertical runs bottom-up, so as close it becomes "/" and menu's bottom bar can tilt into it.
const PLUS: (Stroke | null)[] = [line(12, 19, 12, 5), null, line(5, 12, 19, 12), null];
const CHEVRON: (Stroke | null)[] = [[[9, 5], [16, 12], [9, 19]], null, null, null];
const ARROW: (Stroke | null)[] = [[[13, 6], [19, 12], [13, 18]], null, line(5, 12, 19, 12), null];

export const MORPH_GLYPHS = {
  plus: { strokes: PLUS, group: 'cross', angle: 0 },
  close: { strokes: PLUS, group: 'cross', angle: 45 },
  minus: { strokes: [null, null, line(5, 12, 19, 12), null] },
  menu: { strokes: [line(5, 17, 19, 17), line(5, 12, 19, 12), line(5, 7, 19, 7), null] },
  equals: { strokes: [line(5, 15, 19, 15), null, line(5, 9, 19, 9), null] },
  check: { strokes: [[[5, 12.5], [9.5, 17], [19, 7]], null, null, null] },
  'chevron-right': { strokes: CHEVRON, group: 'chevron', angle: 0 },
  'chevron-down': { strokes: CHEVRON, group: 'chevron', angle: 90 },
  'chevron-left': { strokes: CHEVRON, group: 'chevron', angle: 180 },
  'chevron-up': { strokes: CHEVRON, group: 'chevron', angle: 270 },
  'arrow-right': { strokes: ARROW, group: 'arrow', angle: 0 },
  'arrow-down': { strokes: ARROW, group: 'arrow', angle: 90 },
  'arrow-left': { strokes: ARROW, group: 'arrow', angle: 180 },
  'arrow-up': { strokes: ARROW, group: 'arrow', angle: 270 },
  play: { strokes: [[[8, 5], [18, 12], [8, 19]], null, [[8, 19], [8, 12], [8, 5]], null] },
  pause: { strokes: [line(15, 5, 15, 19), null, line(9, 19, 9, 5), null] },
  copy: { strokes: [[[9, 20], [9, 9], [20, 9]], null, [[20, 9], [20, 20], [9, 20]], [[4, 15], [4, 4], [15, 4]]] },
  download: { strokes: [[[7, 10], [12, 15], [17, 10]], null, line(12, 4, 12, 15), line(5, 20, 19, 20)] },
  upload: { strokes: [[[7, 9], [12, 4], [17, 9]], null, line(12, 4, 12, 15), line(5, 20, 19, 20)] },
} satisfies Record<string, MorphGlyph>;

export type MorphGlyphName = keyof typeof MORPH_GLYPHS;
export const MORPH_GLYPH_NAMES = Object.keys(MORPH_GLYPHS) as MorphGlyphName[];

// ---------- frames and interpolation ----------

/** A drawable state: four strokes (each with opacity) and an angle. */
export interface MorphFrame {
  strokes: { points: Stroke; opacity: number }[];
  angle: number;
}

const SLOTS = 4;
const CENTER: Point = [12, 12];

const midpoint = (s: Stroke): Point => s[1];
const collapsed = (p: Point): Stroke => [[p[0], p[1]], [p[0], p[1]], [p[0], p[1]]];

/** Rotates a point about the center; used to find joints in drawn (rotated) space. */
function rotate([x, y]: Point, deg: number): Point {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [CENTER[0] + (x - CENTER[0]) * c - (y - CENTER[1]) * s, CENTER[1] + (x - CENTER[0]) * s + (y - CENTER[1]) * c];
}

/** The joint of `frame` nearest to `p` (both in drawn space), or the center if it has none. */
function nearestJoint(frame: MorphFrame, p: Point): Point {
  let best: Point = CENTER, bestD = Infinity;
  for (const s of frame.strokes) {
    if (s.opacity < 0.01) continue;
    for (const q of s.points) {
      const r = rotate(q, frame.angle);
      const d = (r[0] - p[0]) ** 2 + (r[1] - p[1]) ** 2;
      if (d < bestD) { bestD = d; best = r; }
    }
  }
  return best;
}

export function frameOf(name: MorphGlyphName): MorphFrame {
  const g: MorphGlyph = MORPH_GLYPHS[name];
  return {
    angle: g.angle ?? 0,
    strokes: Array.from({ length: SLOTS }, (_, i) => {
      const s = g.strokes[i];
      return s ? { points: s, opacity: 1 } : { points: collapsed(CENTER), opacity: 0 };
    }),
  };
}

export interface MorphPlan {
  from: MorphFrame;
  to: MorphFrame;
  /** "turn" rotates one shape (part spring); "morph" moves strokes (settle spring). */
  kind: 'turn' | 'morph';
}

/**
 * Plans a morph from the current drawn frame to a glyph: unused strokes retract
 * into the target's nearest joint, new strokes grow from the source's nearest joint.
 */
export function plan(current: MorphFrame, currentName: MorphGlyphName | null, target: MorphGlyphName): MorphPlan {
  const canonical = frameOf(target);
  const gFrom = currentName ? (MORPH_GLYPHS[currentName] as MorphGlyph) : undefined;
  const gTo = MORPH_GLYPHS[target] as MorphGlyph;

  // One shape at another angle: turn it, the short way round, like a dial.
  if (gFrom?.group && gFrom.group === gTo.group) {
    const delta = ((((canonical.angle - current.angle) % 360) + 540) % 360) - 180;
    return {
      kind: 'turn',
      from: { angle: current.angle, strokes: current.strokes.map((s) => ({ ...s })) },
      to: { angle: current.angle + delta, strokes: canonical.strokes.map((s) => ({ ...s })) },
    };
  }

  // Different shapes: move strokes in drawn space, so no rotation mixes into the morph.
  const from = drawn(current);
  const to = drawn(canonical);
  const end: MorphFrame = { angle: 0, strokes: [] };
  for (let i = 0; i < SLOTS; i++) {
    const a = from.strokes[i], b = to.strokes[i];
    const aOn = a.opacity > 0.01, bOn = b.opacity > 0.01;
    if (aOn && bOn) end.strokes.push(b);
    else if (aOn) end.strokes.push({ points: collapsed(nearestJoint(to, midpoint(a.points))), opacity: 0 });
    else if (bOn) {
      from.strokes[i] = { points: collapsed(nearestJoint(from, midpoint(b.points))), opacity: 0 };
      end.strokes.push(b);
    } else end.strokes.push({ points: collapsed(CENTER), opacity: 0 });
  }
  return { from, to: end, kind: 'morph' };
}

/** A frame with its rotation baked into its points (angle 0). */
function drawn(frame: MorphFrame): MorphFrame {
  return {
    angle: 0,
    strokes: frame.strokes.map((s) => ({ points: s.points.map((p) => rotate(p, frame.angle)) as Stroke, opacity: s.opacity })),
  };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** The frame at progress p (0..1; springs may briefly exceed 1). */
export function at(planned: MorphPlan, p: number): MorphFrame {
  const lerp = (x: number, y: number) => x + (y - x) * p;
  const pt = (a: Point, b: Point): Point => [lerp(a[0], b[0]), lerp(a[1], b[1])];
  return {
    angle: lerp(planned.from.angle, planned.to.angle),
    strokes: planned.from.strokes.map((s, i) => {
      const t = planned.to.strokes[i];
      return {
        points: [pt(s.points[0], t.points[0]), pt(s.points[1], t.points[1]), pt(s.points[2], t.points[2])] as Stroke,
        // A retracting stroke is gone by halfway; a growing one appears after it, so the
        // midpoint never shows both the old and the new structure at once.
        opacity: t.opacity < s.opacity
          ? s.opacity + (t.opacity - s.opacity) * clamp(p * 2)
          : s.opacity + (t.opacity - s.opacity) * clamp(p * 2 - 1),
      };
    }),
  };
}

/** Damped spring progress (mass 1) at time t seconds. */
export function springAt(k: number, c: number, t: number) {
  const w0 = Math.sqrt(k), z = c / (2 * Math.sqrt(k));
  if (z >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
}
