import * as React from 'react';
import { useColorway } from '../app/colorway';
import { Bench } from './doc';

// Every SwiftUI capture the Swift test target writes (docs/captures/swift), by name and colorway.
const CAPTURES = import.meta.glob('../../../../docs/captures/swift/*.png', { eager: true, import: 'default' }) as Record<string, string>;

/** The SwiftUI twin of a specimen, rendered by ImageRenderer, in the page's colorway. */
export function SwiftCapture({ name, maxWidth = 760 }: { name: string; maxWidth?: number }) {
  const { colorway } = useColorway();
  const src = Object.entries(CAPTURES).find(([k]) => k.endsWith(`/${name}-${colorway}.png`))?.[1];
  return (
    <Bench tone="page" caption={`SwiftUI · ImageRenderer capture, ${colorway}`}>
      {src ? <Capture src={src} alt={`SwiftUI ${name} in ${colorway}`} maxWidth={maxWidth} /> : <span className="type-meta text-ink2">No capture yet: run the Swift captures.</span>}
    </Bench>
  );
}

/** Captures are rendered at 2×; show them at their point size, so the SwiftUI twin sits at the web's scale. */
function Capture({ src, alt, maxWidth }: { src: string; alt: string; maxWidth: number }) {
  const [w, setW] = React.useState<number | undefined>(undefined);
  return <img src={src} alt={alt} onLoad={(e) => setW(e.currentTarget.naturalWidth / 2)} className="h-auto max-w-full" style={{ width: w, maxWidth: Math.max(maxWidth, w ?? 0) }} />;
}
