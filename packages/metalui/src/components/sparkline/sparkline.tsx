'use client';

import * as React from 'react';
import './sparkline.css';

/* SPARKLINE: a small series plot. A line with gaps where a day has no value, a dot per value, the
 * last one in the intent green, a dashed baseline at the average. Dots can act (focus their source). */

export interface SparklinePoint {
  value: number;
  /** A tooltip for the dot: "WED 24 SEP · 6.5". */
  title?: string;
  /** Called when the dot is clicked. */
  onSelect?: () => void;
}

export interface SparklineProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'points'> {
  /** One entry per slot (a day); null leaves a gap. */
  points: (SparklinePoint | null)[];
  /** The drawing's own coordinate width and height (it scales to its box). */
  width?: number;
  height?: number;
  /** mini: the small plot of a pinned summary. */
  size?: 'regular' | 'mini';
}

export function Sparkline({ points, width = 300, height, size = 'regular', className, ...props }: SparklineProps) {
  const h = height ?? (size === 'mini' ? 24 : 40);
  const vals = points.filter(Boolean).map((p) => p!.value);
  const cls = className ? `mu-sparkline ${className}` : 'mu-sparkline';
  if (!vals.length) return <svg aria-hidden data-size={size} className={cls} viewBox={`0 0 ${width} ${h}`} {...props} />;
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (hi - lo < 1e-6) {
    lo -= 1;
    hi += 1;
  }
  const pad = 4;
  const X = (i: number) => (points.length > 1 ? (i / (points.length - 1)) * width : width / 2);
  const Y = (v: number) => h - pad - ((v - lo) / (hi - lo)) * (h - pad * 2);
  let d = '';
  let pen = false;
  points.forEach((p, i) => {
    if (!p) return void (pen = false);
    d += `${pen ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.value).toFixed(1)}`;
    pen = true;
  });
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const dots = points.map((p, i) => [p, i] as const).filter(([p]) => p) as [SparklinePoint, number][];
  return (
    <svg data-size={size} className={cls} viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="none" {...props}>
      <line className="mu-sparkline-base" x1="0" x2={width} y1={Y(avg).toFixed(1)} y2={Y(avg).toFixed(1)} />
      <path className="mu-sparkline-line" d={d} />
      {dots.map(([p, i], k) => (
        <circle
          key={i}
          className="mu-sparkline-dot"
          data-last={k === dots.length - 1 ? '' : undefined}
          cx={X(i).toFixed(1)}
          cy={Y(p.value).toFixed(1)}
          role={p.onSelect ? 'button' : undefined}
          aria-label={p.onSelect ? p.title : undefined}
          onClick={p.onSelect}
        >
          {p.title && <title>{p.title}</title>}
        </circle>
      ))}
    </svg>
  );
}
