import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Progress, type ProgressState, type ProgressShape } from '@unlocalhosted/metalui';
import { UndoIcon, CloseIcon, PauseIcon, MorphIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/progress/progress.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalProgress.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/progress/progress.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';
import { SwiftCapture } from '../../ui/SwiftCapture';

function Export() {
  const [value, setValue] = React.useState(40);
  const [state, setState] = React.useState<ProgressState>('idle');
  React.useEffect(() => {
    if (state !== 'running') return;
    const timer = setInterval(() => setValue(value => Math.min(100, value + 10)), 300);
    return () => clearInterval(timer);
  }, [state]);
  React.useEffect(() => { if (value >= 100 && state === 'running') setState('complete'); }, [value, state]);
  const reset = () => { setState('idle'); setValue(0); };
  const run = () => { setValue(0); setState('running'); };
  const active = state === 'running';
  const label = state === 'failed' ? 'Export failed' : state === 'paused' ? 'Export paused' : state === 'cancelled' ? 'Export cancelled' : 'Exporting 12 photos';
  return <div className="mu-stack gap-mu-group w-full max-w-mu-measure" aria-label="Export progress" data-testid="export-progress">
    <Progress value={value} state={state} label={label} completeLabel="Exported" showValue detail={`${Math.round(value * 12 / 100)} of 12 · ${state === 'running' ? 'about 3 s' : state}`} />
    <div className="mu-cluster gap-mu-related">
      <Button onClick={active ? () => { setState('cancelled'); setValue(0); } : state === 'paused' ? () => setState('running') : run}><span className="sr-only">{active ? 'Cancel' : state === 'paused' ? 'Resume' : state === 'failed' ? 'Try again' : 'Run export'}</span><MorphIcon name={active ? 'close' : state === 'paused' ? 'play' : state === 'failed' ? 'sync-error' : 'share'} className="size-button-self-glyph" /><span aria-hidden>{active ? 'Cancel' : state === 'paused' ? 'Resume' : state === 'failed' ? 'Try again' : 'Run export'}</span></Button>
      <Button onClick={reset}><UndoIcon />Reset</Button>
      {active && <Button onClick={() => setState('paused')}><PauseIcon />Pause</Button>}
      {active && <Button onClick={() => setState('failed')}><CloseIcon />Simulate failure</Button>}
    </div>
    <span role="status" className="sr-only">{state === 'complete' ? 'Export complete' : state === 'failed' ? 'Export failed. Try again.' : state === 'paused' ? 'Export paused' : state === 'cancelled' ? 'Export cancelled' : state === 'running' ? 'Export started' : 'Export reset'}</span>
  </div>;
}
function Variations() {
  const d = useDialKit('Progress', {
    value: [45, 0, 100, 1],
    state: { type: 'select', options: ['running', 'paused', 'failed', 'complete', 'cancelled'], default: 'running' },
    size: { type: 'select', options: ['compact', 'regular'], default: 'regular' },
  });
  const state = d.state as ProgressState;
  const value = state === 'complete' ? 100 : state === 'cancelled' ? 0 : d.value;
  return <div className="mu-stack gap-mu-group w-full" aria-label="Progress variations">
    <div className="mu-auto-grid gap-mu-group">{(['bar', 'slim', 'ring', 'segmented', 'buffered'] as ProgressShape[]).map(shape => <div key={shape} className="mu-stack gap-mu-related"><span className="type-label text-ink3">{shape}</span><Progress aria-label={`${shape} export`} label={shape === 'slim' ? undefined : `${shape} export`} completeLabel="Exported" value={value} state={state} shape={shape} size={d.size as 'compact' | 'regular'} buffer={Math.min(100, value + 25)} segments={4} showValue detail={shape === 'segmented' ? `Step ${Math.min(4, Math.ceil(value / 25))} of 4` : '8 of 12 · about 20 s'} /></div>)}</div>
    <div className="mu-auto-grid gap-mu-group">{(['idle', 'running', 'paused', 'failed', 'cancelled', 'complete'] as ProgressState[]).map(state => <Progress key={state} label={`${state} export`} completeLabel="Exported" aria-label={`${state} export`} value={state === 'complete' ? 100 : state === 'cancelled' || state === 'idle' ? 0 : 60} state={state} showValue />)}</div>
    <Progress value={null} label="Unknown active sync" />
    <Progress value={null} state="paused" label="Unknown paused sync" shape="ring" />
  </div>;
}
export default function ProgressPage() {
  return <ComponentPage title="Progress" lede="How far a task has come, with known amounts, honest unknown waits and explicit end states. Bars, rings, steps and buffering use one task contract."
    play={{ lede: 'Run an export. Pause and resume, fail and retry, or cancel. Reset drains to empty and turns the value back to zero.', node: <Export /> }}
    more={[{ id: 'variations', title: 'Shapes, sizes and states', lede: 'The Progress panel scrubs the amount, changes size and flips state. Unknown work waits only while active and on screen.', node: <Variations /> }, { id: 'swift-states', title: 'SwiftUI states', node: <SwiftCapture name="progress" maxWidth={680} /> }]}
    sources={[{ id: 'react', label: 'React', code: reactSource }, { id: 'css', label: 'CSS', code: cssSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'agent', label: 'Agent guide', code: agentSource }]}
    rules={[{ id: 'PR1', title: 'The host reports the amount', body: 'Known fill follows the value and never predicts work. Reset and cancellation drain on release.', origin: 'Ours' }, { id: 'PR2', title: 'State names the consequence', body: 'Completion, failure and pause use words alongside their glyphs. Retry and Resume stay with the task.', origin: 'Ours' }, { id: 'PR3', title: 'Unknown is honest', body: 'Unknown work has no percentage; it waits only while active and visible, and breathes under reduced motion.', origin: 'Ours' }]}
  />;
}
