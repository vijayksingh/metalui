import * as React from 'react';
import { useDialKit } from 'dialkit';
import {
  Fan,
  Switcher,
  inkColor,
  type FanOption,
  type Ink,
  type InkWidth,
} from '@unlocalhosted/metalui';
import { SelectIcon, TextIcon, RegionIcon, PenIcon, DrawIcon, MarkerIcon, LineIcon, ArrowIcon, RectangleIcon, EllipseIcon, EraserIcon, MoreIcon, ImageIcon, TaskIcon, DocumentIcon, GroupIcon, ShareIcon, SendAwayIcon, CaptureIcon, DuplicateIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/fan/fan.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/fan/fan.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalFan.swift?raw';
import { ComponentPage } from '../../ui/ComponentPage';
import { SwiftCapture } from '../../ui/SwiftCapture';

type Tool = 'select' | 'write' | 'region' | 'pen' | 'pencil' | 'marker' | 'line' | 'arrow' | 'rectangle' | 'ellipse' | 'eraser';
const TOOLS: FanOption<Tool>[] = [
  { value: 'select', label: 'Select', shortcut: 'V', icon: <SelectIcon size={16} /> },
  { value: 'write', label: 'Write', shortcut: 'T', icon: <TextIcon size={16} /> },
  { value: 'region', label: 'Region', shortcut: '⌥-drag', icon: <RegionIcon size={16} /> },
  { value: 'pen', label: 'Pen', shortcut: 'P', icon: <PenIcon size={16} /> },
  { value: 'pencil', label: 'Pencil', shortcut: 'N', icon: <DrawIcon size={16} /> },
  { value: 'marker', label: 'Marker', shortcut: 'M', icon: <MarkerIcon size={16} /> },
  { value: 'line', label: 'Line', shortcut: 'L', icon: <LineIcon size={16} /> },
  { value: 'arrow', label: 'Arrow', shortcut: 'A', icon: <ArrowIcon size={16} /> },
  { value: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <RectangleIcon size={16} /> },
  { value: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: <EllipseIcon size={16} /> },
  { value: 'eraser', label: 'Eraser', shortcut: 'E', icon: <EraserIcon size={16} /> },
];
const INKING: Tool[] = ['pen', 'pencil', 'marker', 'line', 'arrow', 'rectangle', 'ellipse'];
type Selection = 'none' | 'text' | 'image';

function Play() {
  const tuning = useDialKit('Fan', { 'Centre grid': false });
  const [tool, setTool] = React.useState<Tool>('select');
  const [ink, setInk] = React.useState<Ink>('ink');
  const [width, setWidth] = React.useState<InkWidth>('regular');
  const [selection, setSelection] = React.useState<Selection>('none');
  const inking = INKING.includes(tool);
  const [action, setAction] = React.useState('Choose a tool or selection');
  const label = inking ? 'Ink' : selection === 'text' ? 'Text' : selection === 'image' ? 'Image' : tool === 'write' ? 'Write' : 'Canvas';
  return (
    <div className="mu-stack items-center gap-mu-section w-full">
      <Switcher size="compact" aria-label="Pretend selection" value={selection} onValueChange={setSelection} options={[{ value: 'none', label: 'Nothing selected' }, { value: 'text', label: 'A text block' }, { value: 'image', label: 'An image' }]} />
      <div className="mu-stack items-center justify-end gap-mu-related w-full" style={{ minHeight: 'calc(var(--mu-space-64) * 4)' }}>
        <p className="type-label text-ink3">{inking ? `Draw with ${ink} ink and a ${width} stroke` : action}</p>
        <Fan aria-label="Canvas tools">
          <Fan.Label label={label}>{inking ? <DrawIcon /> : selection === 'image' ? <ImageIcon /> : selection === 'text' ? <TextIcon /> : <RegionIcon />}</Fan.Label>
          <Fan.Picker label="Tool" direction={tuning['Centre grid'] ? 'both' : 'up'} value={tool} options={TOOLS} onValueChange={setTool} />
          {inking ? (
            <Fan.Tray label="Ink" icon={<DrawIcon />}>
              <div className="mu-stack gap-mu-related">
                <Fan.Ink value={ink} onValueChange={setInk} />
                <Fan.Width value={width} onValueChange={setWidth} ink={ink} />
              </div>
            </Fan.Tray>
          ) : selection === 'text' ? (
            <Fan.Tray label="Text actions" icon={<MoreIcon size={16} />}>
              <Fan.Action label="Tasks" icon={<TaskIcon />} onClick={() => setAction('Tasks')} />
              <Fan.Action label="Summarise" icon={<DocumentIcon />} onClick={() => setAction('Summarise')} />
              <Fan.Action label="Gather" icon={<GroupIcon />} onClick={() => setAction('Gather')} />
              <Fan.Action label="Region" icon={<RegionIcon />} onClick={() => setAction('Region')} />
              <Fan.Action label="Export" icon={<ShareIcon />} onClick={() => setAction('Export')} />
              <Fan.Action label="Send away" icon={<SendAwayIcon />} onClick={() => setAction('Send away')} />
            </Fan.Tray>
          ) : selection === 'image' ? (
            <Fan.Tray label="Image actions" icon={<ImageIcon size={16} />}>
              <Fan.Action label="Lift subject" icon={<CaptureIcon />} onClick={() => setAction('Lift subject')} />
              <Fan.Action label="Copy" icon={<DuplicateIcon />} onClick={() => setAction('Copy')} />
              <Fan.Action label="Gather" icon={<GroupIcon />} onClick={() => setAction('Gather')} />
              <Fan.Action label="Export" icon={<ShareIcon />} onClick={() => setAction('Export')} />
              <Fan.Action label="Send away" icon={<SendAwayIcon />} onClick={() => setAction('Send away')} />
            </Fan.Tray>
          ) : null}
        </Fan>
      </div>
      {inking && <svg aria-label={`${ink} ${width} ink sample`} role="img" viewBox="0 0 240 48" className="w-full h-mu-space-64"><path d="M20 24 Q60 4 100 24 T180 24 L220 24" fill="none" stroke={inkColor(ink)} strokeWidth={`var(--mu-r-draw-width-${width})`} strokeLinecap="round" /></svg>}
    </div>
  );
}

function Both() {
  const [tool, setTool] = React.useState<Tool>('write');
  return (
    <Fan aria-label="Modes">
      <Fan.Label>Writing</Fan.Label>
      <Fan.Picker label="Mode" direction="both" value={tool} options={TOOLS} onValueChange={setTool} />
    </Fan>
  );
}

export default function FanPage() {
  return (
    <ComponentPage
      title="Fan"
      lede="A small control bar whose cells open in place. It shows only the current state; the current choice fans its siblings out, and the options cap stretches into more controls."
      play={{ on: 'table', lede: 'Press the tool to unfold the grouped tool grid. Arrows move across rows and columns. Pick a pen: the drawing glyph names the ink tray; named latched colours and stroke widths change the sample below. Pick Select, then choose A text block: the tray holds its actions. Escape or a press outside folds whatever is open.', node: <Play /> }}
      capture="fan-rest"
      more={[{ id: 'both-ways', title: 'Both ways', lede: 'Centred on its cap, above and below: for a bar in the middle of a surface.', node: <div className="py-mu-space-64 flex justify-center"><Both /></div> },
        { id: 'swift-states', title: 'SwiftUI states', lede: 'Same tool fan and contextual trays rendered headlessly from the SwiftUI twin. Reduce Motion keeps each tool in its open slot.', node: <div className="grid gap-6"><SwiftCapture name="fan-picker" maxWidth={680} /><SwiftCapture name="fan-picker-reduced" maxWidth={680} /><SwiftCapture name="fan-ink" maxWidth={680} /><SwiftCapture name="fan-text" maxWidth={680} /></div> }]}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'swift', label: 'SwiftUI', code: swiftSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'FN1', title: 'Open in place', body: 'Grouped choices unfold in a compact grid from the cap you pressed, and more controls stretch out of the options cap. Never a dropdown menu.', origin: 'Owner, 2026-09-26' },
        { id: 'FN2', title: 'One open', body: 'Opening a cell folds any other. Escape or a press outside folds it, and focus returns to its cap.', origin: 'Fan' },
        { id: 'FN3', title: 'The moment decides', body: 'The label and the tray follow what you are doing: drawing shows inks and widths; a selection shows its own actions first.', origin: 'The old toolbar' },
      ]}
    />
  );
}
