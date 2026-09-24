import type { SnapGuide } from '@unlocalhosted/metalui';

/* A small stand-in for the core's snap_move and guides, for the docs only: the apps get both
 * from the shared core. Edges and centres of the moving box snap to the other boxes' within a
 * threshold in screen points; every alignment that holds after the snap becomes a guide. */

export interface Box { id: string; x: number; y: number; w: number; h: number }

const xs = (b: Box) => [b.x, b.x + b.w / 2, b.x + b.w] as const;
const ys = (b: Box) => [b.y, b.y + b.h / 2, b.y + b.h] as const;

export function snapMove(moving: Box, others: Box[], threshold: number, scale: number): { box: Box; guides: SnapGuide[] } {
  const t = threshold / scale;
  let dx = 0, dy = 0, bx = Infinity, by = Infinity;
  // edges line up with edges, centres with centres
  const same = (i: number, j: number) => (i === 1) === (j === 1);
  for (const o of others) {
    xs(moving).forEach((a, i) => xs(o).forEach((b, j) => { const d = b - a; if (same(i, j) && Math.abs(d) < Math.abs(bx) && Math.abs(d) <= t) bx = d; }));
    ys(moving).forEach((a, i) => ys(o).forEach((b, j) => { const d = b - a; if (same(i, j) && Math.abs(d) < Math.abs(by) && Math.abs(d) <= t) by = d; }));
  }
  if (bx !== Infinity) dx = bx;
  if (by !== Infinity) dy = by;
  const box = { ...moving, x: moving.x + dx, y: moving.y + dy };
  const guides: SnapGuide[] = [];
  const eps = 0.01;
  xs(box).forEach((a, i) => {
    const hits = others.filter((o) => xs(o).some((b, j) => (i === 1) === (j === 1) && Math.abs(b - a) < eps));
    if (!hits.length) return;
    const all = [box, ...hits];
    guides.push({ axis: 'vertical', position: a, start: Math.min(...all.map((b) => b.y)), end: Math.max(...all.map((b) => b.y + b.h)), kind: i === 1 ? 'center' : 'edge' });
  });
  ys(box).forEach((a, i) => {
    const hits = others.filter((o) => ys(o).some((b, j) => (i === 1) === (j === 1) && Math.abs(b - a) < eps));
    if (!hits.length) return;
    const all = [box, ...hits];
    guides.push({ axis: 'horizontal', position: a, start: Math.min(...all.map((b) => b.x)), end: Math.max(...all.map((b) => b.x + b.w)), kind: i === 1 ? 'center' : 'edge' });
  });
  return { box, guides };
}
