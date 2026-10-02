import * as React from 'react';
import { Button, SelectionFrame, ToolStrip, MenuItem, Switcher, type ToolStripItem, type ToolStripSelection, type ToolStripVerbSets } from '@unlocalhosted/metalui';
import { TaskIcon, DocumentIcon, GroupIcon, RegionIcon, ShareIcon, SendAwayIcon, CaptureIcon, DuplicateIcon, LinkIcon, TextIcon, MoreIcon, ImageIcon } from '@unlocalhosted/metalui/icons';
import { useDialKit } from 'dialkit';
import reactSource from '../../../../../packages/metalui/src/blocks/tool-strip/tool-strip.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/blocks/tool-strip/tool-strip.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Blocks/MetalToolStrip.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { UsageSection, useOwnCss } from '../../ui/Usage';

const NODES = [{ id: 'text', kind: 'text', name: 'A studio note', icon: <TextIcon />, content: 'Collect the field recordings. Find a quiet place to listen.' }, { id: 'image', kind: 'image', name: 'An image', icon: <ImageIcon />, content: 'A soft morning on the hills' }, { id: 'link', kind: 'link', name: 'A link', icon: <LinkIcon />, content: 'Studio reference · example.org' }];
function Canvas() {
  const tuning = useDialKit('Tool strip', { 'Visible verbs': [5, 2, 10, 1] });
  const [selection, setSelection] = React.useState<ToolStripSelection[]>([]);
  const [said, setSaid] = React.useState('Click a block. Shift-click adds another kind.');
  const [busy, setBusy] = React.useState(false);
  const [pan, setPan] = React.useState<'centre' | 'left' | 'right'>('centre');
  const [zoom, setZoom] = React.useState(1);
  const canvas = React.useRef<HTMLDivElement>(null);
  const nodes = React.useRef(new Map<string, HTMLButtonElement>());
  const [anchor, setAnchor] = React.useState<{ x: number; y: number; width: number; height: number }>();
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useLayoutEffect(() => {
    const place = () => {
      const boxes = selection.flatMap(({ id }) => { const box = nodes.current.get(id)?.getBoundingClientRect(); return box ? [box] : []; });
      if (!boxes.length) { setAnchor(undefined); return; }
      const x = Math.min(...boxes.map((box) => box.left)), y = Math.min(...boxes.map((box) => box.top));
      setAnchor({ x, y, width: Math.max(...boxes.map((box) => box.right)) - x, height: Math.max(...boxes.map((box) => box.bottom)) - y });
    };
    place();
    let frame = requestAnimationFrame(place);
    const resize = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(place); }); if (canvas.current) resize.observe(canvas.current);
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
  }, [selection, pan, zoom]);
  const action = (label: string) => () => setSaid(`${label} · ${selection.length} selected`);
  const shared: ToolStripItem[] = [{ id: 'gather', order: 8, label: 'Gather', icon: <GroupIcon />, onSelect: action('Gathered') }, { id: 'export', order: 9, label: 'Export', icon: <ShareIcon />, menu: <><MenuItem onSelect={action('Exported Markdown')}>Markdown</MenuItem><MenuItem onSelect={action('Exported plain text')}>Plain text</MenuItem></> }, { id: 'rename', order: 10, label: 'Rename', icon: <TextIcon />, singleOnly: true, onSelect: action('Renamed') }, { id: 'remove', order: 11, label: 'Send away', icon: <SendAwayIcon />, destructive: true, irreversible: true, onSelect: () => { setSaid(`Sent away ${selection.length} blocks`); setSelection([]); } }];
  const verbs: ToolStripVerbSets = {
    text: [{ id: 'tasks', order: 0, label: 'Tasks', icon: <TaskIcon />, onSelect: action('Made tasks') }, { id: 'summarise', order: 1, label: 'Summarise', icon: <DocumentIcon />, busy, onSelect: () => { setBusy(true); setSaid('Summarising'); clearTimeout(timer.current); timer.current = setTimeout(() => { setBusy(false); setSaid('Summary ready'); }, 1500); } }, { id: 'region', order: 2, label: 'Region', icon: <RegionIcon />, onSelect: action('Made a region') }, ...shared],
    image: [{ id: 'lift', order: 3, label: 'Lift subject', icon: <CaptureIcon />, onSelect: action('Lifted subject') }, { id: 'copy', order: 4, label: 'Copy', icon: <DuplicateIcon />, onSelect: action('Copied') }, { id: 'crop', order: 5, label: 'Crop', icon: <RegionIcon />, disabledReason: 'This image is locked', onSelect: action('Cropped') }, ...shared],
    link: [{ id: 'open', order: 6, label: 'Open', icon: <LinkIcon />, onSelect: action('Opened reference') }, { id: 'copy-link', order: 7, label: 'Copy link', icon: <DuplicateIcon />, onSelect: action('Copied link') }, ...shared],
  };
  return <div className="mu-stack gap-mu-group w-full">
    <div className="mu-cluster gap-mu-related"><Button icon={<GroupIcon />} onClick={() => setSelection(NODES.map(({ id, kind }) => ({ id, kind })))}>Select all</Button><Button onClick={() => setSelection([])}>Clear selection</Button><Switcher aria-label="Canvas pan" value={pan} onValueChange={setPan} size="compact" options={[{ value: 'left', label: 'Left' }, { value: 'centre', label: 'Centre' }, { value: 'right', label: 'Right' }]} /><Button onClick={() => setZoom((value) => value === 1 ? 1.2 : 1)}>Zoom</Button></div>
    <div ref={canvas} role="group" aria-label="Selection canvas" className="relative mu-stack gap-mu-group px-mu-space-24 py-mu-space-64 rounded-card recipe-surface-raise-lite overflow-hidden">
      <div className="mu-auto-grid gap-mu-group transition-none" style={{ transform: `translateX(${pan === 'left' ? '-24px' : pan === 'right' ? '24px' : '0px'}) scale(${zoom})`, transformOrigin: 'center' }}>
        {NODES.map((node) => <button key={node.id} ref={(element) => { if (element) nodes.current.set(node.id, element); else nodes.current.delete(node.id); }} type="button" aria-label={node.name} aria-pressed={selection.some(({ id }) => id === node.id)} className="mu-stack gap-mu-related relative p-mu-space-20 rounded-card recipe-surface-raise text-left text-ink" onClick={(event) => setSelection((current) => event.shiftKey ? current.some(({ id }) => id === node.id) ? current.filter(({ id }) => id !== node.id) : [...current, { id: node.id, kind: node.kind }] : [{ id: node.id, kind: node.kind }])}>
          <span className="mu-cluster gap-mu-related type-ui">{node.icon}{node.name}</span><span className="type-content">{node.content}</span>{selection.some(({ id }) => id === node.id) && <SelectionFrame state="selected" radius={24} entrance={false} />}
        </button>)}
      </div>
    </div>
    {anchor && <ToolStrip label={`${selection.length} blocks`} selection={selection} verbSets={verbs} anchor={anchor} boundary={canvas.current ?? undefined} maxVisible={tuning['Visible verbs']} />}
    <output aria-live="polite" aria-label="Selection result" className="type-readout text-ink2">{said}</output>
  </div>;
}
export default function ToolStripPage() {
  const ownCss = useOwnCss(cssSource);
  return <><PageHeader title="Tool strip" lede="Click a text block, image or link to reveal its actions. A mixed selection keeps the actions its kinds share; their order stays familiar. The graphite strip follows the selection, flips at the canvas edge and puts overflow behind More." />
    <Section title="Over a selection" lede="Shift-click adds blocks. Crop explains its locked state; Summarise works in its key. Hold Send away to confirm the irreversible demo action."><Bench className="w-full"><Canvas /></Bench><SwiftCapture name="tool-strip" maxWidth={560} /></Section>
    <UsageSection agent={agentGuide} /><Section title="Source"><SourceTabs tabs={[{ id: 'react', label: 'React', code: reactSource }, { id: 'css', label: 'CSS', code: ownCss }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'agent', label: 'Agent guide', code: agentGuide }]} /></Section>
    <Section title="Rules"><Rules rules={[{ id: 'T1', title: 'Only for a click selection', body: 'A selection made by finishing is quiet; never while dragging, resizing, in the past or with the palette open.', origin: 'DS-31' }, { id: 'T2', title: 'Every verb says what it did', body: 'The host owns the selection and results. Use Undo for reversible changes; require a hold only when the action is irreversible.', origin: 'reference brief' }, { id: 'T3', title: 'One destructive verb, last', body: 'After More and the engraved separator, in warm red. Disabled actions remain focusable to explain why.', origin: 'DS-33' }]} /></Section></>;
}
