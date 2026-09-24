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
      {src ? <img src={src} alt={`SwiftUI ${name} in ${colorway}`} className="h-auto w-full" style={{ maxWidth }} /> : <span className="type-meta text-ink2">No capture yet: run the Swift captures.</span>}
    </Bench>
  );
}
