import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Attachment, Button, EmptyState } from '@unlocalhosted/metalui';
import { CommentDemo } from '../../ui/comment/CommentDemo';
import swiftExample from '../../../../../swift/Examples/MetalCommentExample.swift?raw';
import { AttachIcon, NoteIcon, RegionIcon } from '@unlocalhosted/metalui/icons';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/empty-state/empty-state.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/empty-state/empty-state.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * ARRIVAL TUNER: the page's DialKit panel
 *
 *   spring   the spring the empty state rises on
 *   rise     how far below it starts
 *   empty    clear the place to watch it arrive
 * ───────────────────────────────────────────────────────── */

const FILES = ['Tram map.pdf', 'Receipt.png', 'Itinerary.docx'];

function Place({ label }: { label: string }) {
  const [files, setFiles] = React.useState(FILES);
  return (
    <div role="region" aria-label={label} className="grid w-full max-w-[360px] gap-12">
      {files.length === 0 ? (
        <EmptyState
          icon={<RegionIcon size={24} />}
          title="No files in this region"
          description="Drop files onto the region, or attach them from here."
          action={<Button cap="primary" icon={<AttachIcon />} onClick={() => setFiles(FILES)}>Attach files</Button>}
        />
      ) : files.map((f) => <Attachment key={f} name={f} size={1_200_000} onRemove={() => setFiles((all) => all.filter((x) => x !== f))} />)}
    </div>
  );
}

function ArrivalTuner() {
  const d = useDialKit('Empty arrival', {
    spring: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    rise: [6, 0, 24],
    slow: [1, 1, 10],
  });
  const vars = { ...springVars('settle', d.spring as SpringName, d.slow), '--mu-motion-nest': `${d.rise}px` } as React.CSSProperties;
  return <div data-testid="empty-arrival-tuner" className="flex w-full justify-center" style={vars}><Place label="Tuned region" /></div>;
}

export default function EmptyStatePage() {
  return (
    <ComponentPage
      title="Empty state"
      lede="A place with nothing in it yet. It says what would be here and how to start, with the one action that starts it, and it rises in when the last thing leaves rather than snapping."
      play={{ lede: 'Remove the files one by one and watch the empty state arrive; attach them again. Comment opens an editor: Enter adds a line; Command/Control + Enter posts. Escape cancels an unlocked draft. Failure keeps its text; a landed result closes the editor and offers Undo.', caption: 'a region of files · and a compact one', node: (
        <div className="grid w-full justify-items-center gap-32">
          <Place label="Region files" />
          <div className="w-full max-w-[360px]"><CommentDemo /></div>
        </div>
      ) }}
      more={[{ id: 'arrival', title: 'Tune the arrival', lede: 'The Empty arrival panel swaps the spring the empty state rises on, sets how far below it starts, and stretches time.', node: <ArrivalTuner /> }]}
      usage={`{notes.length === 0 ? (
  <EmptyState
    icon={<NoteIcon size={24} />}
    title="No notes yet"
    description="Write anywhere on the canvas to start one."
    action={<Button cap="primary" icon={<NoteIcon />} onClick={newNote}>New note</Button>}
  />
) : notes.map((n) => <Note key={n.id} {...n} />)}`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'swift', label: 'SwiftUI comment host', code: swiftExample },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'ES1', title: 'Say how to start', body: 'What would be here, and the one action that begins it.', origin: 'Ours' },
        { id: 'ES2', title: 'It arrives, it does not snap', body: 'When the last thing leaves, the empty state rises in on the settle spring.', origin: 'Transitions T9' },
        { id: 'ES3', title: 'Not an error, not loading', body: 'Errors say what went wrong; loading shows a skeleton.', origin: 'Ours' },
      ]}
    />
  );
}
