import * as React from 'react';
import { useDialKit } from 'dialkit';
import { BoardIcon, DocumentIcon, DownloadIcon, LayoutIcon, RedoIcon, SelectIcon, UndoIcon } from '@unlocalhosted/metalui/icons';
import { Menubar, MenuItem, MenuSeparator } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/menubar/menubar.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalMenubar.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/menubar/menubar.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * GLIDE TUNER: the page's DialKit panel
 *
 *   spring   the spring the highlight glides between keys on
 *   slow     stretch it to watch the glide across
 * The plates are portalled, so the tuned spring rides on the document while this tuner is here.
 * ───────────────────────────────────────────────────────── */

function Bar({ onDid, label }: { onDid: (s: string) => void; label: string }) {
  return (
    <Menubar aria-label={label}>
      <Menubar.Menu label="File">
        <MenuItem icon={<BoardIcon size={14} />} shortcut="⌘N" onSelect={() => onDid('New canvas')}>New canvas</MenuItem>
        <MenuItem icon={<DocumentIcon size={14} />} shortcut="⌘O" onSelect={() => onDid('Open…')}>Open…</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<DownloadIcon size={14} />} shortcut="⇧⌘E" onSelect={() => onDid('Export…')}>Export…</MenuItem>
      </Menubar.Menu>
      <Menubar.Menu label="Edit">
        <MenuItem icon={<UndoIcon size={14} />} shortcut="⌘Z" onSelect={() => onDid('Undo')}>Undo</MenuItem>
        <MenuItem icon={<RedoIcon size={14} />} shortcut="⇧⌘Z" onSelect={() => onDid('Redo')}>Redo</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<SelectIcon size={14} />} shortcut="⌘A" onSelect={() => onDid('Select all')}>Select all</MenuItem>
      </Menubar.Menu>
      <Menubar.Menu label="View">
        <MenuItem icon={<LayoutIcon size={14} />} shortcut="⌘'" onSelect={() => onDid('Show the grid')}>Show the grid</MenuItem>
        <MenuItem shortcut="⌘0" onSelect={() => onDid('Actual size')}>Actual size</MenuItem>
      </Menubar.Menu>
      <Menubar.Menu label="Arrange" disabled>
        <MenuItem>Nothing selected</MenuItem>
      </Menubar.Menu>
    </Menubar>
  );
}

function GlideTuner() {
  const d = useDialKit('Menubar glide', {
    spring: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    slow: [1, 1, 10],
  });
  const vars = springVars('settle', d.spring as SpringName, d.slow) as React.CSSProperties;
  return <div data-testid="menubar-glide-tuner" style={vars}><Bar onDid={() => {}} label="Tuned menu bar" /></div>;
}

export default function MenubarPage() {
  const [did, setDid] = React.useState<string | null>(null);
  return (
    <ComponentPage
      title="Menubar"
      lede="An app's commands under a few words across the top. Open one menu, then move across: one highlight glides between the words and the next menu opens at once, as a native menu bar does."
      play={{ lede: 'Open File, then move the pointer (or ← →) across to Edit and View.', caption: did ?? 'file · edit · view · a disabled menu', node: <div className="flex min-h-[220px] items-start justify-center pt-8"><Bar onDid={setDid} label="App" /></div> }}
      more={[{ id: 'glide', title: 'Tune the glide', lede: 'The Menubar glide panel swaps the highlight\'s spring and stretches time.', node: <GlideTuner /> }]}
      usage={`<Menubar aria-label="App">
  <Menubar.Menu label="File">
    <MenuItem icon={<BoardIcon size={14} />} shortcut="⌘N" onSelect={newCanvas}>New canvas</MenuItem>
    <MenuSeparator />
    <MenuItem icon={<DownloadIcon size={14} />} shortcut="⇧⌘E" onSelect={exportAs}>Export…</MenuItem>
  </Menubar.Menu>
  <Menubar.Menu label="Edit">
    <MenuItem icon={<UndoIcon size={14} />} shortcut="⌘Z" onSelect={undo}>Undo</MenuItem>
  </Menubar.Menu>
</Menubar>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'swift', label: 'SwiftUI', code: swiftSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'MB1', title: 'Across is instant', body: 'With a menu open, moving across opens the next menu at once; only the highlight glides.', origin: 'Native menu bars' },
        { id: 'MB2', title: 'Few words', body: 'File, Edit, View: short, familiar, most used first.', origin: 'Ours' },
        { id: 'MB3', title: 'Shortcuts live here', body: 'The bar is where people learn the keys; show them.', origin: 'Ours' },
      ]}
    />
  );
}
