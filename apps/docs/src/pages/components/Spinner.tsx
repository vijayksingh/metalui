import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Card, Field, Led, Progress, Row, Skeleton, Spinner, useWaiting, type WaitingState } from '@unlocalhosted/metalui';
import { Icon, MorphIcon } from '@unlocalhosted/metalui/icons';
import { SaveGlyph } from '../../ui/async/SaveGlyph';
import { useAwake } from '../../../../../packages/metalui/src/motion/awake';
import reactSource from '../../../../../packages/metalui/src/components/spinner/spinner.tsx?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalSpinner.swift?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/spinner/spinner.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* PLACEMENT STORYBOARD (docs/WAITING.md)
 * Request: busy only its host, announce once; keep existing footprint during400ms arrival.
 * Presented: small glyph arc / matching large shapes / trailing field arc / background lamp.
 * Count known: real completed batches become Progress, not an elapsed-time estimate.
 * Result: minimum300ms before check/error. Typing cancels a stale search; unrelated work stays free.
 * Long10s: one useful explanation, never ticking elapsed words. Reduce Motion: no travel/sheens.
 */
type Policy = { latency: number; showDelay: number; minVisible: number; longAfter: number; fail: boolean };
const PARTS = ['Image', 'Caption', 'Metadata', 'Preview'];

// A network fixture with four counted responses. Production replaces this with the actual operation.
function useRequest(policy: Policy, verb: string) {
  const [state, setState] = React.useState<WaitingState>('idle');
  const [completed, setCompleted] = React.useState(0);
  const [status, setStatus] = React.useState('');
  const running = React.useRef(false);
  const generation = React.useRef(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const root = React.useRef<HTMLDivElement>(null);
  const [watch, awake] = useAwake();
  const presentation = useWaiting(state, root, policy);
  const cancel = React.useCallback(() => {
    generation.current++; timers.current.forEach(clearTimeout); timers.current = []; running.current = false;
    setState('idle'); setStatus(''); setCompleted(0);
  }, []);
  React.useEffect(() => () => { generation.current++; timers.current.forEach(clearTimeout); }, []);
  const run = (counted = false) => {
    if (running.current) return;
    generation.current++; const request = generation.current;
    timers.current.forEach(clearTimeout); timers.current = []; running.current = true;
    setState('waiting'); setCompleted(0); setStatus(`${verb} started`);
    const count = counted ? PARTS.length : 1;
    for (let i = 1; i <= count; i++) timers.current.push(setTimeout(() => {
      if (generation.current !== request) return;
      setCompleted(i);
      if (i === count) {
        running.current = false;
        setState(policy.fail ? 'error' : 'done');
        setStatus(policy.fail ? `${verb} failed. Try again.` : `${verb} complete`);
      }
    }, policy.latency * i / count));
  };
  const ref = React.useCallback((node: HTMLDivElement | null) => { root.current = node; watch(node); }, [watch]);
  return { state, completed, status, run, cancel, ref, awake, ...presentation };
}
type Work = ReturnType<typeof useRequest>;
function Announcement({ work }: { work: Work }) { return <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{work.status}</span>; }
function Host({ work, name, children }: { work: Work; name: string; children: React.ReactNode }) {
  return <><div ref={work.ref} data-testid={`waiting-${name}`} data-phase={work.phase} aria-busy={name === 'action' ? undefined : work.state === 'waiting'}
    style={{ '--mu-waiting-play-state': work.awake ? 'running' : 'paused', '--mu-r-skeleton-self-delay': '0ms' } as React.CSSProperties} className="mu-stack gap-mu-related">
    {children}
  </div>{name !== 'action' && <Announcement work={work} />}</>;
}
function Slot({ work, glyph = 'document' }: { work: Work; glyph?: 'document' | 'search' }) {
  return <span className="relative inline-grid size-spinner-size text-ink2" aria-hidden>
    <MorphIcon name={work.phase === 'done' ? 'check' : work.phase === 'error' ? 'sync-error' : glyph} size={16}
      className={work.phase === 'waiting' ? 'invisible' : work.phase === 'done' ? 'waiting-check-fade' : ''} />
    {work.phase === 'waiting' && <Spinner className="absolute inset-0" showDelay={0} minVisible={0} announce={false} />}
  </span>;
}
function Placements() {
  const d = useDialKit('Waiting policy', {
    latency: [2400, 100, 14000], showDelay: [400, 0, 1200], minVisible: [300, 0, 1200],
    longAfter: [10000, 1000, 12000], fail: false,
  });
  const policy: Policy = { ...d };
  const action = useRequest(policy, 'Save'); const item = useRequest(policy, 'Upload');
  const card = useRequest(policy, 'Preview'); const field = useRequest(policy, 'Search');
  const route = useRequest(policy, 'View'); const sync = useRequest(policy, 'Sync');
  const [query, setQuery] = React.useState('subject'); const [edits, setEdits] = React.useState(0);
  const vars = { '--mu-waiting-show-delay': `${d.showDelay}ms`, '--mu-waiting-minimum-visible': `${d.minVisible}ms`, '--mu-waiting-long-after': `${d.longAfter}ms` } as React.CSSProperties;
  const pending = (work: Work) => work.state === 'waiting' || work.phase === 'waiting';
  const words = (work: Work, normal: string, still: string) => work.long ? still : normal;
  return <div data-testid="waiting-placements" style={vars} className="mu-auto-grid gap-mu-section w-full">
    <Host work={action} name="action">
      <h3 className="type-title m-0 text-ink">Action</h3>
      <div className="mu-cluster gap-mu-related">
        <Button cap="primary" state={action.state} icon={<SaveGlyph state={action.phase} />} waitingLabel="Saving…" doneLabel="Saved" errorLabel="Try again"
          showDelay={d.showDelay} minVisible={d.minVisible} onClick={() => action.run()}>Save</Button>
        <Button size="compact" icon={<Icon name="save" />} onClick={() => { action.cancel(); action.run(); }} disabled={pending(action)}>Save again</Button>
      </div>
      <p className="type-meta m-0 text-ink2">{action.long ? 'Still saving… waiting for the server to accept the change.' : 'The key carries the wait. Its width and the cap’s ink stay.'}</p>
    </Host>
    <Host work={item} name="item">
      <h3 className="type-title m-0 text-ink">Small item</h3>
      <Row variant="panel" className="recipe-well-field" >
        <Row.Lead><Slot work={item} /></Row.Lead><Row.Text className={pending(item) ? 'text-ink2' : 'text-ink'}>subject.png</Row.Text>
        <Row.Trail><Button cap="strip" disabled={pending(item)} onClick={() => item.run()}>{item.phase === 'error' ? 'Try again' : 'Upload'}</Button></Row.Trail>
      </Row>
      <p className="type-meta m-0 text-ink2">{item.phase === 'done' ? 'Uploaded. The check fades back into the item.' : item.phase === 'error' ? 'Upload failed. The item stays here for retry.' : words(item, 'Only this item dims and refuses another upload.', 'Still uploading… the connection is taking longer.')}</p>
    </Host>
    <Host work={card} name="card">
      <h3 className="type-title m-0 text-ink">Large item</h3>
      <Card>
        <div className="mu-stack gap-mu-related">
          <div className="h-card-media rounded-skeleton-radius recipe-well-field flex items-center justify-center">{card.phase === 'waiting' ? <Skeleton height="100%" /> : <Icon name="image" size={32} />}</div>
          <div className="type-title">{card.phase === 'waiting' ? <Skeleton height="1lh" width="72%" /> : <Card.Title>Subject preview</Card.Title>}</div>
          <div className="type-body" style={{ minHeight: '2lh' }}>{card.phase === 'waiting' ? <Skeleton height="2lh" /> : <Card.Description>{card.phase === 'error' ? 'Preview failed. Your image is still safe.' : card.phase === 'done' ? 'Image, caption, metadata and preview received.' : 'The image and text reserve their final places.'}</Card.Description>}</div>
          <p className="type-meta text-ink2 m-0" style={{ minHeight: '2lh' }}>{card.phase === 'waiting' ? words(card, 'Building the preview…', 'Still building… waiting for the final preview batch.') : 'Four response batches; progress is their completed count.'}</p>
          <div style={{ visibility: card.phase === 'idle' ? 'hidden' : 'visible' }}><Progress label="Preview batches" value={card.completed} max={PARTS.length} showValue /></div>
        </div>
        <Card.Footer><Button size="compact" disabled={pending(card)} onClick={() => card.run(true)}>{card.phase === 'error' ? 'Try again' : 'Build preview'}</Button></Card.Footer>
      </Card>
    </Host>
    <Host work={field} name="field">
      <h3 className="type-title m-0 text-ink">Field</h3>
      <form onSubmit={(event) => { event.preventDefault(); if (query.trim()) field.run(); }} className="mu-stack gap-mu-related">
        <Field size="regular"><Field.Icon><Icon name="search" /></Field.Icon><Field.Input aria-label="Search subjects" value={query}
          onChange={(event) => { field.cancel(); setQuery(event.target.value); }} /><Field.Trail>
            {field.state === 'waiting' || field.phase === 'waiting' ? <Slot work={field} glyph="search" /> : <Button cap="strip" iconOnly aria-label="Clear search" icon={<Icon name="close" />} disabled={!query} onClick={() => { field.cancel(); setQuery(''); }} />}
        </Field.Trail></Field>
        <div className="mu-cluster gap-mu-related"><Button size="compact" type="submit" disabled={pending(field) || !query.trim()}>{field.phase === 'error' ? 'Try again' : 'Search'}</Button><span className="type-meta text-ink2">{field.phase === 'done' ? `Found “${query}”` : field.phase === 'error' ? 'Search failed' : words(field, 'Type freely. Enter searches; editing cancels stale work.', 'Still searching… the index has not replied yet.')}</span></div>
      </form>
    </Host>
    <Host work={route} name="place">
      <h3 className="type-title m-0 text-ink">Whole place</h3>
      <div className="recipe-well-field rounded-surface-radius-card p-mu-space-16 mu-stack gap-mu-related">
        <div style={{ visibility: route.phase === 'waiting' ? 'visible' : 'hidden' }}><Progress aria-label="Incoming view batches" value={route.completed} max={PARTS.length} style={{ '--mu-r-progress-self-height': 'var(--mu-r-rule-self-thickness)' } as React.CSSProperties} /></div>
        <h4 className="type-ui text-ink m-0">{route.phase === 'waiting' ? <Skeleton height="1lh" width="72%" /> : route.phase === 'done' ? 'Library view' : 'Current view'}</h4>
        {PARTS.map((part) => <Row key={part}><Row.Lead>{route.phase === 'waiting' ? <Skeleton.Circle size={16} /> : <Icon name="document" size={16} />}</Row.Lead><Row.Text>{route.phase === 'waiting' ? <Skeleton height="1lh" /> : part}</Row.Text></Row>)}
        <p className="type-meta text-ink2 m-0" style={{ minHeight: '2lh' }}>{route.phase === 'waiting' ? words(route, 'Opening the library…', 'Still opening… waiting for the last view response.') : route.phase === 'error' ? 'The view could not load. Try again.' : 'Structure stays here while the next view arrives.'}</p>
      </div>
      <Button size="compact" disabled={pending(route)} onClick={() => route.run(true)}>{route.phase === 'error' ? 'Try again' : 'Open library'}</Button>
    </Host>
    <Host work={sync} name="background">
      <h3 className="type-title m-0 text-ink">Background</h3>
      <div className="mu-cluster gap-mu-related type-ui text-ink"><Led kind={sync.phase === 'waiting' ? 'waiting' : sync.phase === 'error' ? 'failed' : 'live'} gesture={sync.phase === 'waiting' ? 'breathe' : sync.phase === 'error' ? 'blink2' : 'steady'} />
        <span>{sync.phase === 'waiting' ? words(sync, 'Syncing…', 'Still syncing… changes are safe on this device.') : sync.phase === 'error' ? 'Sync failed · changes kept locally' : sync.phase === 'done' ? 'Sync live · changes saved' : 'Sync live'}</span>
      </div>
      <div className="mu-cluster gap-mu-related"><Button size="compact" disabled={pending(sync)} onClick={() => sync.run()}>{sync.phase === 'error' ? 'Try again' : 'Sync now'}</Button><Button size="compact" onClick={() => setEdits((n) => n + 1)}>Keep editing</Button></div>
      <p className="type-meta text-ink2 m-0">{edits} local edits. Background sync blocks no other action.</p>
    </Host>
  </div>;
}
export default function SpinnerPage() {
  return <ComponentPage title="Spinner" lede="Waiting belongs to the thing doing the work. Small slots use their own ink; large things keep their shape; background work leaves you free."
    play={{ wide: true, lede: 'Try each placement. DialKit controls simulated response latency, presentation timing and failure; preview/view progress counts four completed response batches.', caption: 'One timing policy · six real hosts', node: <Placements /> }}
    more={[{ id: 'waiting-policy', title: 'One waiting policy', lede: '400ms before showing work, at least 300ms once shown. Fast requests go straight to the result. At 10s explain what remains once.', node: <p className="type-body text-ink2">Known amounts use Progress. Mark actual work busy immediately and announce start and outcome once. Large shapes stop their sheen under Reduce Motion; arcs stand still and pulse. Offscreen or hidden work stops its visual clock. Search editing cancels stale replies.</p> }]}
    usage={`const ref = useRef<HTMLDivElement>(null);
const { phase, long } = useWaiting(state, ref);
<div ref={ref} aria-busy={state === 'waiting'}>
  {phase === 'waiting' && <Spinner announce={false} showDelay={0} minVisible={0} />}
  <span role="status">{message}</span>
</div>`}
    sources={[{ id: 'react', label: 'React', code: reactSource }, { id: 'css', label: 'CSS', code: cssSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'agent', label: 'Agent guide', code: agentSource }]}
    rules={[{ id: 'SP1', title: 'The host carries the wait', body: 'Glyph slot for a small thing; matching shape for a large thing; lamp for background work.', origin: 'Ours' }, { id: 'SP2', title: 'Progress comes from work', body: 'Use actual completed amounts; never turn elapsed time into a percentage.', origin: 'Ours' }, { id: 'SP3', title: 'Keep the place usable', body: 'Refuse only the action already running. Search still permits typing; background sync still permits editing.', origin: 'Ours' }]} />;
}
