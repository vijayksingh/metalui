import * as React from 'react';
import { Button, connectWebKitHaptics } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/snap-guides/snap-guides.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/snap-guides/snap-guides.agent.md?raw';
import bridgeSource from '../../../../../swift/Sources/MetalUI/Foundation/MetalHapticWebViewBridge.swift?raw';
import hapticSource from '../../../../../packages/metalui/src/motion/haptic.ts?raw';
import { ComponentPage } from '../../ui/ComponentPage';
import { SnapCanvas } from '../../ui/SnapCanvas';
import { SnapGuidesXray } from '../../ui/xray/SnapGuidesXray';

function WebViewTransport() {
  const cleanup = React.useRef<(() => void) | null>(null);
  const [status, setStatus] = React.useState('Connect only inside a Mac web-view host.');
  React.useEffect(() => () => cleanup.current?.(), []);
  return <div className="mu-stack gap-mu-related items-center">
    <div className="mu-cluster gap-mu-related">
      <Button size="compact" onClick={() => {
        cleanup.current?.();
        cleanup.current = connectWebKitHaptics();
        setStatus(cleanup.current ? 'Native haptic transport connected.' : 'No WKWebView transport in this browser.');
      }}>Connect web-view haptics</Button>
      <Button size="compact" onClick={() => { cleanup.current?.(); cleanup.current = null; setStatus('Native transport disconnected.'); }}>Disconnect haptics</Button>
    </div>
    <span role="status" className="type-meta text-ink2">{status}</span>
  </div>;
}

export default function SnapGuidesPage() {
  return (
    <ComponentPage
      title="Snap guides"
      lede="The thin green lines that appear while you drag something into line with its neighbours. They show you what it snapped to, and they disappear when you let go."
      play={{ lede: 'Drag the note near the others. Hold ⌘ to drag without snapping. Change the zoom: the lines stay the same thickness.', caption: 'solid for edges · dashed for centres', node: <SnapCanvas /> }}
      xray={<SnapGuidesXray />}
      more={[{ id: 'native-haptics', title: 'A Mac web-view host', lede: 'A native app opts into the trackpad bridge. Connect its transport, then catch a line in the playground. Desktop browsers report their available path.', node: <WebViewTransport /> }]}
      sources={[
        { id: 'react', label: 'React', code: `${reactSource}\n\n${hapticSource}` },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'swift', label: 'WKWebView bridge', code: bridgeSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'SN1', title: 'A guide explains a snap', body: 'Only draw the lines the snap actually used. Never a grid, never a ruler.', origin: 'Ours' },
        { id: 'SN2', title: 'With the snap, never after', body: 'Guides move in the same frame as the snap. They fade only when you let go.', origin: 'Native reference' },
        { id: 'SN3', title: 'The same on screen at every zoom', body: 'One point wide, a 3 / 3 dash, 8 pt past both ends, at 25 % and at 300 %.', origin: 'Native reference' },
        { id: 'SN4', title: '⌘ turns it off', body: 'Holding ⌘ drags freely: no snap, no guides.', origin: 'Native reference' },
      ]}
    />
  );
}
