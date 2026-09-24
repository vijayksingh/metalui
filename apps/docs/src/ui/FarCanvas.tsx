import * as React from 'react';
import { BlockSilhouette, CodeCard, LinkCard, Region, SizeReadout, Slider, Swatch, type SilhouetteKind } from '@unlocalhosted/metalui';

/* The Block silhouette playground: a small canvas of real blocks with a zoom. Below 35 % (the
 * core's far-zoom threshold) every block is drawn as its silhouette instead; the swap happens
 * when you let go of the zoom, the way the canvas swaps on the camera commit. */

const THRESHOLD = 0.35;

interface Item { id: string; kind: SilhouetteKind; x: number; y: number; w: number; h: number; color?: string; label?: string; lines?: number }
const ITEMS: Item[] = [
  { id: 'r', kind: 'region', x: 20, y: 20, w: 520, h: 380, label: 'Poster' },
  { id: 't1', kind: 'text', x: 60, y: 90, w: 230, h: 66, lines: 3 },
  { id: 'c', kind: 'code', x: 60, y: 190, w: 250, h: 150, lines: 6 },
  { id: 's', kind: 'swatch', x: 350, y: 90, w: 76, h: 76, color: '#FF6B3D' },
  { id: 'l', kind: 'link', x: 330, y: 200, w: 250, h: 104, color: '#36406A' },
  { id: 't2', kind: 'text', x: 620, y: 60, w: 200, h: 44, lines: 2 },
  { id: 'i', kind: 'image', x: 620, y: 150, w: 200, h: 140, color: '#6D7F92' },
  { id: 'f', kind: 'file', x: 640, y: 320, w: 150, h: 60 },
];
const WORDS: Record<string, string> = { t1: 'print the poster on matte stock\nask about the paper weight\nsend the proof friday', t2: 'the grotesk wins\n#type' };
const CODE = "const poster = {\n  size: 'A2',\n  stock: 'matte',\n  weight: 170,\n};\nexport default poster;";

function Real({ it }: { it: Item }) {
  switch (it.kind) {
    case 'region': return <Region name={it.label ?? ''} rule="tags them #poster" width={it.w} height={it.h} />;
    case 'text': return <div className="type-content whitespace-pre-line text-ink">{WORDS[it.id]}</div>;
    case 'code': return <CodeCard code={CODE} lang="ts" />;
    case 'swatch': return <Swatch hex={it.color!} />;
    case 'link': return <LinkCard href="https://lanterns.photo/night-market" />;
    case 'image': return <div className="size-full rounded-card" style={{ background: 'linear-gradient(160deg, #9DB0C2, #4E5E70)' }} />;
    case 'file': return <div className="type-ui grid size-full place-items-center rounded-card bg-s-hi text-ink2 ring-1 ring-rule">poster-v3.pdf</div>;
  }
}

export function FarCanvas({ height = 380 }: { height?: number }) {
  const [zoom, setZoom] = React.useState(0.5);
  const [committed, setCommitted] = React.useState(0.5);
  const far = committed < THRESHOLD;
  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div className="snap-canvas" style={{ height }}>
        <div className="snap-world" style={{ transform: `translate(20px, 20px) scale(${zoom})` }}>
          {ITEMS.map((it) => (
            <div key={it.id} className="absolute" style={{ left: it.x, top: it.y, width: it.w, height: it.kind === 'region' || it.kind === 'image' || it.kind === 'file' ? it.h : undefined }}>
              {far ? <BlockSilhouette key="far" kind={it.kind} color={it.color} label={it.label} lines={it.lines} style={{ width: it.w, height: it.h }} /> : <div key="near" className="far-near"><Real it={it} /></div>}
            </div>
          ))}
        </div>
        <SizeReadout className="absolute bottom-12 right-12" value={`${Math.round(zoom * 100)} %`} />
      </div>
      <div style={{ width: 300, height: 36 }}>
        <Slider.Root value={Math.round(zoom * 100)} min={15} max={100} step={1} onValueChange={(v) => setZoom(v / 100)}>
          <Slider.Track />
          <Slider.Marks at={[(THRESHOLD * 100 - 15) / 85]} />
          <Slider.Knob aria-label="Zoom" />
        </Slider.Root>
      </div>
      <span className="eng">{far ? 'far · silhouettes' : 'near · real blocks'} · the mark on the slider is 35 %</span>
      <CommitOnRelease onRelease={() => setCommitted(zoom)} />
    </div>
  );
}

/** The swap waits for the zoom to settle, as the canvas waits for the camera commit. */
function CommitOnRelease({ onRelease }: { onRelease: () => void }) {
  React.useEffect(() => {
    const up = () => window.setTimeout(onRelease, 0);
    window.addEventListener('pointerup', up);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('keyup', up); };
  }, [onRelease]);
  return null;
}

/** Every kind twice: the real block, and its silhouette. */
export function KindPairs() {
  return (
    <div className="far-pairs">
      {ITEMS.filter((it) => it.kind !== 'region').concat([{ id: 'r2', kind: 'region', x: 0, y: 0, w: 260, h: 150, label: 'Poster' }]).map((it) => (
        <figure key={it.id} className="far-pair">
          <div className="far-cell"><div style={{ zoom: 0.45, width: it.w, height: it.kind === 'region' || it.kind === 'image' || it.kind === 'file' ? it.h : undefined }}><Real it={it.kind === 'region' ? { ...it, w: 260, h: 150 } : it} /></div></div>
          <div className="far-cell"><div style={{ zoom: 0.45 }}><BlockSilhouette kind={it.kind} color={it.color} label={it.label} lines={it.lines} style={{ width: it.w, height: it.h }} /></div></div>
          <figcaption className="eng">{it.kind}</figcaption>
        </figure>
      ))}
    </div>
  );
}
