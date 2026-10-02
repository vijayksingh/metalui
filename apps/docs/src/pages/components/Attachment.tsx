import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Attachment, Button, Select, type AttachmentUploadState } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalAttachment.swift?raw';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/attachment/attachment.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/attachment/attachment.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * LAND TUNER: the page's DialKit panel
 *
 *   land     the spring a new file lands on
 *   leave    the spring a removed file leaves on
 *   drop     how far above it lands from
 * ───────────────────────────────────────────────────────── */

interface Item { id: number; name: string; size: number; progress?: number; uploadState?: AttachmentUploadState; error?: string }
const NAMES = ['Tram map of Lisbon, annotated for the second day of the trip.pdf', 'Receipt.png', 'Itinerary.docx', 'Photos.zip'];

function Tray({ label }: { label: string }) {
  const [items, setItems] = React.useState<Item[]>([
    { id: 1, name: NAMES[0], size: 2_480_000 },
    { id: 2, name: 'Hotel booking.pdf', size: 31_000_000, uploadState: 'error', error: 'Too large, 25 MB at most' },
  ]);
  const next = React.useRef(3);
  const [leaveStarts, setLeaveStarts] = React.useState(0);
  const uploading = items.some((item) => item.progress != null);
  React.useEffect(() => {
    if (!uploading) return;
    const t = setInterval(() => setItems((all) => all.map((f) => (f.progress == null || f.progress >= 100 ? { ...f, progress: undefined, uploadState: f.uploadState === 'uploading' ? 'complete' : f.uploadState } : { ...f, progress: Math.min(100, f.progress + 20) }))), 400);
    return () => clearInterval(t);
  }, [uploading]);
  const add = () => {
    const id = next.current++;
    setItems((all) => [...all, { id, name: NAMES[id % NAMES.length], size: 400_000 + id * 180_000, progress: 0, uploadState: 'uploading' }]);
  };
  return (
    <div className="grid w-full min-w-0 gap-12" aria-label={label} role="region">
      {items.map((f) => (
        <Attachment
          key={f.id}
          name={f.name}
          size={f.size}
          progress={f.progress}
          uploadState={f.uploadState}
          error={f.error}
          onRetry={() => setItems((all) => all.map((x) => (x.id === f.id ? { ...x, error: undefined, size: 18_000_000, progress: 0, uploadState: 'uploading' } : x)))}
          onRemove={() => setItems((all) => all.filter((x) => x.id !== f.id))}
          onLeaveStart={() => setLeaveStarts((n) => n + 1)}
        />
      ))}
      <Button icon={<Icon name="attach" />} className="justify-self-start" onClick={add}>Attach a file</Button>
      <span role="status" className="type-meta text-ink3">{items.length} files · {leaveStarts} leave starts</span>
    </div>
  );
}

type ReceiptState = 'legacy' | 'cleared' | 'uploading' | 'complete' | 'error';
function UploadReceipt() {
  const [state, setState] = React.useState<ReceiptState>('legacy');
  return <div data-testid="attachment-receipt" className="mu-stack w-full max-w-attachment-max-width">
    <Select aria-label="Upload receipt" value={state} onValueChange={setState} options={[
      { value: 'legacy', label: 'Legacy progress' }, { value: 'cleared', label: 'Clear progress' },
      { value: 'uploading', label: 'Uploading at 100 %' }, { value: 'complete', label: 'Delivered' }, { value: 'error', label: 'Failed' },
    ]} />
    <Attachment name="Proof.pdf" size={240_000} progress={state === 'legacy' ? 40 : state === 'uploading' ? 100 : undefined}
      uploadState={state === 'legacy' || state === 'cleared' ? undefined : state}
      error={state === 'error' ? 'Connection lost; the file is still here' : undefined}
      onRetry={() => setState('uploading')} />
  </div>;
}

function LandTuner() {
  const d = useDialKit('Attachment land', {
    land: { type: 'select', options: SPRING_NAMES, default: 'object' },
    leave: { type: 'select', options: SPRING_NAMES, default: 'release' },
    drop: [6, 0, 24],
    slow: [1, 1, 10],
  });
  const vars = { ...springVars('object', d.land as SpringName, d.slow), ...springVars('release', d.leave as SpringName, d.slow), '--mu-motion-nest': `${d.drop}px` } as React.CSSProperties;
  return <div data-testid="attachment-land-tuner" className="flex justify-center" style={vars}><Tray label="Tuned attachments" /></div>;
}

export default function AttachmentPage() {
  return (
    <ComponentPage
      title="Attachment"
      lede="A file someone attached, as a small raised plate. A new one lands into place, its track fills while it uploads, a failed one says why and offers to try again, and a removed one steps down and fades before it goes. Its upload glyph becomes a check only when the host explicitly confirms completion."
      play={{ lede: 'Attach a file, try the failed one again, or remove one.', caption: 'a long name · a failed upload · new ones uploading', node: <div className="flex w-full max-w-attachment-max-width justify-center"><Tray label="Attachments" /></div> }}
      more={[{ id: 'receipt', title: 'The host confirms delivery', lede: 'Clearing legacy progress returns to idle; 100 % still uploads. Only uploadState="complete" acknowledges delivery. Retry returns to uploading until the host confirms or refuses it.', node: <UploadReceipt /> }, { id: 'land', title: 'Tune the land', lede: 'The Attachment land panel swaps the springs a file lands and leaves on, sets how far above it lands from, and stretches time.', node: <LandTuner /> }, { id: 'width', title: 'The list chooses its width', lede: 'The same plate fills a full-width list or a narrow composer. Errors keep their own line, with Try again below; the extension and remove key stay in view.', node: <div className="mu-stack"><div className="w-full"><Tray label="Wide attachments" /></div><div className="w-full max-w-attachment-min-width"><Tray label="Narrow attachments" /></div></div> }]}
      usage={`{files.map((f) => (
  <Attachment
    key={f.id}
    name={f.name}
    size={f.size}
    progress={f.progress}
    uploadState={f.uploadState}
    error={f.error}
    onRetry={() => retry(f)}
    onRemove={() => remove(f)}
  />
))}`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'swift', label: 'SwiftUI', code: swiftSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'AT1', title: 'It lands', body: 'A new file drops into place on the object spring: it was put there.', origin: 'Transitions T5b' },
        { id: 'AT2', title: 'Say why it failed', body: 'A few words and Try again, never just a red mark.', origin: 'Ours' },
        { id: 'AT3', title: 'Keep the extension', body: 'Long names cut in the middle so the type stays readable.', origin: 'Ours' },
      ]}
    />
  );
}
