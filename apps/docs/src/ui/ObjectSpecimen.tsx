import { Attachment, Avatar, BlockSilhouette, Card, CodeCard, Connector, Day, Folder, LinkCard, Table, Weather } from '@unlocalhosted/metalui';
import { SpecimenWindow } from './PlaceSpecimen';

export const OBJECT_CAPTIONS: Record<string, string> = {
  attachment: 'Keep a file’s name, size, upload state, and remove action together.',
  avatar: 'Recognize a person and see whether they’re available.',
  'block-silhouette': 'Keep blocks recognizable when the canvas is zoomed far out.',
  card: 'Give a note or collection a body, a title, and a little context.',
  'code-card': 'Keep code readable on a glass screen, with language and syntax cues.',
  connector: 'Join two objects and show how one relates to the other.',
  day: 'See the date, the year’s progress, and the next page to tear off.',
  folder: 'Collect related objects in a pocket that shows what’s inside.',
  'link-card': 'Turn a saved URL into a recognizable preview.',
  table: 'Compare records in rows, then sort or select them.',
  weather: 'Read current conditions and the forecast from one small window.',
};

function Scene({ name }: { name: string }) {
  switch (name) {
    case 'attachment': return <div className="mu-stack gap-mu-related" style={{ width: 320 }}><Attachment name="Tram map.pdf" size={240000} /><Attachment name="Itinerary.docx" size={86000} /></div>;
    case 'avatar': return <div className="mu-cluster gap-mu-group">{['Ana Rocha', 'Chen Wei', 'Dara Lin'].map((person, i) => <div key={person} className="mu-stack gap-mu-related items-center"><Avatar name={person} size="large" presence={i === 0 ? 'live' : undefined} /><span className="type-meta text-ink2">{person}</span></div>)}</div>;
    case 'block-silhouette': return <div className="mu-cluster gap-mu-group"><BlockSilhouette kind="text" lines={5} style={{ width: 100, height: 64 }} /><BlockSilhouette kind="code" lines={4} style={{ width: 100, height: 80 }} /><BlockSilhouette kind="region" label="Travel" style={{ width: 100, height: 110 }} /></div>;
    case 'card': return <Card style={{ width: 280 }}><Card.Title>Trip to Lisbon</Card.Title><Card.Description>14 notes, 3 photos, a tram map.</Card.Description><Card.Footer>Updated this morning</Card.Footer></Card>;
    case 'code-card': return <CodeCard code={'const trip = {\n  city: "Lisbon",\n  days: 5,\n};'} lang="ts" />;
    case 'connector': return <div className="snap-canvas" style={{ width: 360, height: 180 }}><span className="place-note" style={{ position: 'absolute', left: 12, top: 60 }}>Idea</span><span className="place-note" style={{ position: 'absolute', right: 12, top: 60 }}>Plan</span><Connector from={{ x: 80, y: 86, attached: true }} to={{ x: 280, y: 86, attached: true }} label="leads to" /></div>;
    case 'day': return <Day.Root date={new Date(2026, 9, 5)} animate={false}><Day.Page clock={false} seconds={false} /><Day.Year /><Day.Line /></Day.Root>;
    case 'folder': return <Folder name="Lisbon trip" count={3} peeks={[{ id: 'map' }, { id: 'ticket' }, { id: 'notes' }]} />;
    case 'link-card': return <LinkCard href="https://metalui.dev" preview={{ title: 'MetalUI · Soft Hardware', description: 'Interfaces with a little weight.' }} />;
    case 'table': return <div style={{ width: 360 }}><Table caption="Trip notes" columns={[{ key: 'place', header: 'Place' }, { key: 'days', header: 'Days', align: 'end' }, { key: 'notes', header: 'Notes', align: 'end' }]} rows={[{ place: 'Lisbon', days: 5, notes: 14 }, { place: 'Porto', days: 2, notes: 6 }]} rowKey={row => row.place} /></div>;
    case 'weather': return <Weather place="Lisbon" hour={9} sky="clear" condition="Sunny" temp={22} live={null} animate={false} hours={[9, 12, 15, 18, 21, 24].map(hour => ({ label: hour === 9 ? 'Now' : `${hour % 24}`, hour, kind: 'clear', temp: hour < 18 ? 22 : 18 }))} days={['Today', 'Tue', 'Wed', 'Thu', 'Fri'].map(name => ({ name, kind: 'clear', low: 16, high: 24 }))} />;
    default: return null;
  }
}

export function ObjectSpecimen({ name }: { name: string }) {
  return <SpecimenWindow height={name === 'day' || name === 'weather' ? 560 : 240}><Scene name={name} /></SpecimenWindow>;
}
