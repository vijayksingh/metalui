import { DotDisplay, Kbd, Led, Row, Skeleton, Swatch, Well } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { SpecimenWindow } from './PlaceSpecimen';
import { SpatialFieldFoundation } from './SpatialFieldFoundation';

export const PART_CAPTIONS: Record<string, string> = {
  'dot-display': 'Build a small pixel face from a grid of lit and unlit dots.',
  kbd: 'Show a keyboard shortcut as keys with a physical edge.',
  led: 'Pair a small lamp with words that explain its status.',
  row: 'Arrange a leading glyph, a label, and trailing detail as one line.',
  skeleton: 'Hold the shape of content while it is being loaded.',
  'spatial-field': 'Let a quiet dot field yield around objects and reinforce a target region.',
  swatch: 'Give a color its own glossy chip, with the value engraved on it.',
};
const dots = Array.from({ length: 21 * 13 }, (_, i) => {
  const x = i % 21, y = Math.floor(i / 21);
  return (x - 5) ** 2 + (y - 5) ** 2 < 10 ? 2 : y >= 10 ? 1 : 0;
});
function Scene({ name }: { name: string }) {
  switch (name) {
    case 'dot-display': return <Well variant="field" radius="row" className="overflow-hidden"><DotDisplay className="part-dot-display" cols={21} rows={13} dots={dots} inks={['off', 'hz', 'sun']} /></Well>;
    case 'kbd': return <div className="mu-stack gap-mu-group items-center"><div className="mu-cluster gap-mu-space-8"><Kbd>⌘</Kbd><Kbd>K</Kbd></div><span className="type-meta text-ink2">Search the system</span></div>;
    case 'led': return <div className="mu-cluster gap-mu-group">{(['live', 'waiting', 'failed', 'off'] as const).map(kind => <div key={kind} className="mu-stack gap-mu-related items-center"><Led kind={kind} gesture="steady" /><span className="type-meta text-ink2">{kind === 'live' ? 'Connected' : kind === 'waiting' ? 'Waiting' : kind === 'failed' ? 'Failed' : 'Offline'}</span></div>)}</div>;
    case 'row': return <div className="mu-stack gap-mu-space-8" style={{ width: 320 }}><Row variant="panel"><Row.Lead><Icon name="note" animate={false} /></Row.Lead><Row.Text>Trip plan</Row.Text><Row.Trail>14 notes</Row.Trail></Row><Row variant="panel" selected><Row.Lead><Icon name="document" animate={false} /></Row.Lead><Row.Text>Tram map</Row.Text><Row.Trail>PDF</Row.Trail></Row></div>;
    case 'skeleton': return <div className="place-note mu-stack gap-mu-related" style={{ width: 280 }}><div className="mu-cluster gap-mu-related"><Skeleton.Circle size={32} /><Skeleton width={160} /></div><Skeleton.Text lines={3} /></div>;
    case 'spatial-field': return <SpatialFieldFoundation state="target" />;
    case 'swatch': return <div className="mu-cluster gap-mu-group">{['#FF6B3D', '#35C77A', '#3D7BFF'].map(hex => <Swatch key={hex} hex={hex} />)}</div>;
    default: return null;
  }
}
export function PartSpecimen({ name }: { name: string }) {
  return <SpecimenWindow width={name === 'spatial-field' ? 660 : 400}><Scene name={name} /></SpecimenWindow>;
}
