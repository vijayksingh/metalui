import * as React from 'react';
import { Button, DropZone, EmptyState, LensBar, MemoryScrubber, PastBanner, Region, Sidebar, SplitPane } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';

export const PLACE_CAPTIONS: Record<string, string> = {
  'drop-zone': 'Drop files here or choose them from your device.',
  'empty-state': 'Explain what belongs here and give one action to get started.',
  'lens-bar': 'Ask a question, see what matches, and change the view.',
  'memory-scrubber': 'Scrub through earlier versions of the canvas, then return to now.',
  'past-banner': 'Show that you’re viewing the past, with a clear way back to now.',
  region: 'Give related objects a boundary, a name, and a shared rule.',
  sidebar: 'Move between app sections while keeping your place.',
  'split-pane': 'Keep two views side by side, with a divider you can resize.',
};
const noop = () => {};
const START = new Date(2026, 8, 21).getTime();
const END = new Date(2026, 8, 27, 18).getTime();
const PAST = new Date(2026, 8, 23, 9, 20).getTime();
const MARKS = [START + 3600000, PAST, PAST + 86400000, END - 3600000];

function Note({ past = false }: { past?: boolean }) {
  return <div className="place-note mu-stack gap-mu-related">
    <strong>Trip plan</strong>
    <span>{past ? '09:20 · Train to Lisbon' : '10:40 · Train to Lisbon'}</span>
    <span className="place-note-meta">{past ? 'Wednesday’s version' : 'Tickets, maps, and a packing list'}</span>
  </div>;
}
function NoteList() {
  return <div className="place-note-list mu-stack gap-mu-space-8"><span className="place-note-selected">Trip plan</span><span>Packing list</span><span>Receipts</span></div>;
}
function Scene({ name }: { name: string }) {
  switch (name) {
    case 'drop-zone': return <div className="place-drop"><DropZone glyph="document" title="Drop trip files here" description="Tickets, PDFs, and photos" accept="image/*,application/pdf" onFiles={noop} /></div>;
    case 'empty-state': return <EmptyState icon={<Icon name="note" animate={false} />} title="No notes yet" description="Keep your trip plans in one place." action={<Button size="compact">Create a note</Button>} />;
    case 'lens-bar': return <div className="place-lens mu-stack gap-mu-group">
      <LensBar query="Lisbon" count={2} source="local" modes={['place', 'list']} mode="place" onClose={noop} glyphs={{ lens: <Icon name="search" size={14} animate={false} />, close: <Icon name="close" size={14} animate={false} /> }} />
      <div className="place-matches mu-cluster gap-mu-related"><span className="place-note place-match">Lisbon tram map</span><span className="place-note place-match">Lisbon tickets</span><span className="place-unmatched">Porto receipts</span></div>
    </div>;
    case 'memory-scrubber': return <div className="place-history mu-stack gap-mu-group"><Note past /><MemoryScrubber start={START} end={END} value={PAST} onValueChange={noop} marks={MARKS} format={() => 'WED · 09:20'} glyph={<Icon name="clock" size={10} animate={false} />} /></div>;
    case 'past-banner': return <div className="place-past mu-stack gap-mu-group"><PastBanner moment="Wed · 09:20" onBack={noop} /><Note past /></div>;
    case 'region': return <div className="place-region"><Region name="Travel" rule="keeps trip notes" count={2} width={344} height={196} /><div className="place-region-contents mu-cluster gap-mu-related"><span className="place-note">Tram map</span><span className="place-note">Tickets</span></div></div>;
    case 'sidebar': return <div className="place-workspace">
      <Sidebar aria-label="Travel notebook"><Sidebar.Header><span className="type-label engraved">Notebook</span></Sidebar.Header><Sidebar.Section title="Spaces"><Sidebar.Item icon={<Icon name="note" animate={false} />} active href="#notes">Notes</Sidebar.Item><Sidebar.Item icon={<Icon name="document" animate={false} />} href="#files">Files</Sidebar.Item><Sidebar.Item icon={<Icon name="pin" animate={false} />} href="#saved">Saved</Sidebar.Item></Sidebar.Section></Sidebar>
      <div className="place-workspace-content mu-stack gap-mu-related"><strong>Notes</strong><span>Trip plan</span><span>Packing list</span><span>Receipts</span></div>
    </div>;
    case 'split-pane': return <div className="place-workspace"><SplitPane label="Resize the notes" size={36} min={20} max={70}><NoteList /><div className="place-workspace-content"><Note /></div></SplitPane></div>;
    default: return null;
  }
}

/** Real components at their recipe dimensions. Scale the entire scene to its window. */
export function PlaceSpecimen({ name }: { name: string }) {
  return <SpecimenWindow><Scene name={name} /></SpecimenWindow>;
}

/** A dormant specimen scales as one object, keeping its control recipe dimensions. */
export function SpecimenWindow({ children, width = 400, height = 240 }: { children: React.ReactNode; width?: number; height?: number }) {
  const viewport = React.useRef<HTMLDivElement>(null);
  const scene = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const view = viewport.current, content = scene.current;
    if (!view || !content) return;
    const resize = () => { content.style.transform = `scale(${Math.min(1, view.clientWidth / width, view.clientHeight / height)})`; };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(view);
    return () => observer.disconnect();
  }, [width, height]);
  return <div className="place-preview" ref={viewport} aria-hidden="true" inert><div className="place-scene library-specimen" ref={scene} style={{ width, height }}>{children}</div></div>;
}
