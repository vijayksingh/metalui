import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Sidebar } from '@unlocalhosted/metalui';
import { BoardIcon, NoteIcon, PinIcon, RegionIcon, SearchIcon, ShareIcon, TrashIcon } from '@unlocalhosted/metalui/icons';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/sidebar/sidebar.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalSidebar.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/sidebar/sidebar.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * COLLAPSE TUNER: the page's DialKit panel
 *
 *   width    the spring the width settles on
 *   glide    the spring the current place's highlight glides on
 *   collapse fold it to a rail and back
 * ───────────────────────────────────────────────────────── */

const PLACES = [
  { section: 'Spaces', items: [{ id: 'board', label: 'Board', icon: <BoardIcon size={16} /> }, { id: 'notes', label: 'Notes', icon: <NoteIcon size={16} /> }, { id: 'regions', label: 'Regions', icon: <RegionIcon size={16} /> }] },
  { section: 'Kept', items: [{ id: 'pinned', label: 'Pinned', icon: <PinIcon size={16} /> }, { id: 'shared', label: 'Shared with me', icon: <ShareIcon size={16} /> }, { id: 'trash', label: 'Trash', icon: <TrashIcon size={16} /> }] },
];

function App({ label, collapsed, onCollapsed }: { label: string; collapsed?: boolean; onCollapsed?: (c: boolean) => void }) {
  const [here, setHere] = React.useState('notes');
  const [own, setOwn] = React.useState(false);
  const folded = collapsed ?? own;
  const setFolded = onCollapsed ?? setOwn;
  const title = PLACES.flatMap((s) => s.items).find((i) => i.id === here)?.label;
  return (
    <div className="flex h-[380px] w-full max-w-[720px] overflow-hidden rounded-card recipe-well-field">
      <Sidebar aria-label={label} collapsed={folded}>
        <Sidebar.Header>
          <Sidebar.Item icon={<SearchIcon size={16} />} href="#search" onClick={(e) => e.preventDefault()}>Search</Sidebar.Item>
        </Sidebar.Header>
        {PLACES.map((s) => (
          <Sidebar.Section key={s.section} title={s.section}>
            {s.items.map((i) => (
              <Sidebar.Item key={i.id} icon={i.icon} href={`#${i.id}`} active={here === i.id} onClick={(e) => { e.preventDefault(); setHere(i.id); }}>{i.label}</Sidebar.Item>
            ))}
          </Sidebar.Section>
        ))}
        <Sidebar.Footer>
          <Sidebar.Toggle collapsed={folded} onCollapsedChange={setFolded} />
        </Sidebar.Footer>
      </Sidebar>
      <main className="grid flex-1 content-start gap-8 p-24">
        <p className="m-0 type-title text-ink">{title}</p>
        <p className="m-0 type-body text-ink2">The place you chose opens here.</p>
      </main>
    </div>
  );
}

function CollapseTuner() {
  const [folded, setFolded] = React.useState(false);
  const d = useDialKit('Sidebar collapse', {
    width: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    slow: [1, 1, 10],
    collapse: { type: 'action', label: 'Collapse / expand' },
  }, {
    onAction: (action) => { if (action === 'collapse') setFolded((f) => !f); },
  });
  return <div data-testid="sidebar-collapse-tuner" className="flex w-full justify-center" style={springVars('settle', d.width as SpringName, d.slow) as React.CSSProperties}><App label="Tuned spaces" collapsed={folded} onCollapsed={setFolded} /></div>;
}

export default function SidebarPage() {
  return (
    <ComponentPage
      title="Sidebar"
      lede="An app's side place for moving between places. One highlight glides to the place you choose; collapse it and the words fade first, then it settles to a rail of glyphs that keep their names as tooltips."
      play={{ lede: 'Choose places, then collapse it with the button at the bottom.', caption: 'two sections · a header and a footer', wide: true, node: <div className="flex w-full justify-center"><App label="Spaces" /></div> }}
      more={[{ id: 'collapse', title: 'Tune the collapse', lede: 'The Sidebar collapse panel swaps the spring the width and highlight settle on, stretches time, and folds it.', node: <CollapseTuner /> }]}
      usage={`<Sidebar aria-label="Spaces" collapsed={collapsed}>
  <Sidebar.Section title="Spaces">
    <Sidebar.Item icon={<NoteIcon size={16} />} href="/notes" active>Notes</Sidebar.Item>
    <Sidebar.Item icon={<BoardIcon size={16} />} href="/board">Board</Sidebar.Item>
  </Sidebar.Section>
  <Sidebar.Footer>
    <Sidebar.Toggle collapsed={collapsed} onCollapsedChange={setCollapsed} />
  </Sidebar.Footer>
</Sidebar>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'swift', label: 'SwiftUI', code: swiftSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'SB1', title: 'Words leave first', body: 'Collapsing, the words fade before the width moves; expanding, the width comes first. Text never squeezes.', origin: 'Ours' },
        { id: 'SB2', title: 'One highlight travels', body: 'The current place\'s highlight glides to the next, on the settle spring.', origin: 'The sliding indicator' },
        { id: 'SB3', title: 'The rail keeps names', body: 'Every item in the rail keeps its name and tooltip. Only the link or toggle takes focus; its glyph never adds a Tab stop.', origin: 'Ours' },
      ]}
    />
  );
}
