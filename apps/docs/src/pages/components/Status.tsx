import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Led, Select, StatusBadge, Switch, type LedKind, type StatusTone, type StatusSurface } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/status/status.tsx?raw';
import ledSource from '../../../../../packages/metalui/src/components/led/led.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/status/status.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalStatus.swift?raw';
import colorReport from '../../../../../docs/STATUS-COLORS.md?raw';
import { STATUS_VISION, filterMatrix } from '../../lib/status-colors';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { StatusXray } from '../../ui/xray/StatusXray';

/* STATUS STORYBOARD: words identify every state; one lamp owns an opaque socket.
 * Live/linked: steady. Waiting: inner lens breathes until the state changes.
 * Failure: blink twice once, then hold. Off: dark socket. Reduced: all still.
 * Tone/material changes never animate blur or color. Solid wins; quiet requires a controlled ground.
 */
const KINDS: LedKind[] = ['live', 'waiting', 'failed', 'link', 'off'];
const WORDS: Record<LedKind, string> = { live: 'Sync live', waiting: 'Sync waiting', failed: 'Sync failed', link: 'Sync linked', off: 'Sync off' };
const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="240"><rect width="720" height="240" fill="#182c43"/><circle cx="550" cy="35" r="110" fill="#dfa345"/><path d="M0 190 220 20 440 200 640 65 720 150V240H0Z" fill="#326e80"/><path d="M0 240 300 130 540 240Z" fill="#090e19"/></svg>')}`;

function SurfaceProof() {
  const [kind, setKind] = React.useState<LedKind>('live');
  const [reduceTransparency, setTransparency] = React.useState(false);
  const [reduceMotion, setMotion] = React.useState(false);
  const [vision, setVision] = React.useState<keyof typeof STATUS_VISION>('normal');
  const d = useDialKit('Status material', {
    tone: { type: 'select', options: ['default', 'quiet', 'strong'], default: 'default' },
    surface: { type: 'select', options: ['solid', 'transparent', 'frosted'], default: 'solid' },
    solid: false,
  });
  const filter = React.useId().replace(/:/g, '');
  return <div className="mu-stack gap-mu-group" data-testid="status-surfaces"
    data-mu-motion={reduceMotion ? 'reduce' : undefined} data-mu-transparency={reduceTransparency ? 'reduce' : undefined}>
    <div className="mu-cluster gap-mu-related">
      <Select aria-label="Sync state" value={kind} onValueChange={setKind} options={KINDS.map(k => ({ value: k, label: WORDS[k] }))} />
      <Select aria-label="Color vision preview" value={vision} onValueChange={setVision} options={Object.keys(STATUS_VISION).map(k => ({ value: k as keyof typeof STATUS_VISION, label: k }))} />
      <label className="mu-cluster gap-mu-related type-ui text-ink2"><Switch checked={reduceTransparency} onCheckedChange={setTransparency} aria-label="Reduce transparency" /><span>Reduce transparency</span></label>
      <label className="mu-cluster gap-mu-related type-ui text-ink2"><Switch checked={reduceMotion} onCheckedChange={setMotion} aria-label="Reduce motion" /><span>Reduce motion</span></label>
    </div>
    <svg width="0" height="0" aria-hidden><defs><filter id={filter} colorInterpolationFilters="linearRGB"><feColorMatrix type="matrix" values={filterMatrix(STATUS_VISION[vision])} /></filter></defs></svg>
    <div className="mu-stack gap-mu-group" data-testid="status-proof" data-vision={vision} style={{ filter: vision === 'normal' ? undefined : `url(#${filter})` }}>
      <div className="mu-cluster gap-mu-related p-mu-space-20" data-testid="status-ground">
        <StatusBadge led={kind} tone={d.tone as StatusTone} surface={d.surface as StatusSurface} solid={d.solid} hint={kind === 'failed' ? 'Check the connection, then retry sync.' : undefined}>{WORDS[kind]}</StatusBadge>
        <span className="type-doc-body text-ink2">Controlled ground · choose tone and surface in DialKit.</span>
      </div>
      <div className="relative isolate overflow-hidden rounded-xl p-mu-space-32" data-testid="status-image">
        <img src={IMAGE} alt="Authored landscape with bright and dark image regions" className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="mu-cluster gap-mu-related">
          <StatusBadge led={kind}>Opaque · {WORDS[kind]}</StatusBadge>
          <StatusBadge led={kind} surface="transparent">Transparent · {WORDS[kind]}</StatusBadge>
          <StatusBadge led={kind} surface="frosted">Frosted · {WORDS[kind]}</StatusBadge>
          <StatusBadge led={kind} surface="frosted" solid>Solid override · {WORDS[kind]}</StatusBadge>
        </div>
      </div>
      <div className="mu-stack gap-mu-related rounded-xl material-frost-plate p-mu-space-20" data-testid="status-frost-parent">
        <div className="mu-cluster gap-mu-related">
          <StatusBadge led={kind}>On frost · {WORDS[kind]}</StatusBadge>
          <StatusBadge led={kind} tone="strong">Strong · {WORDS[kind]}</StatusBadge>
          <StatusBadge led={kind} tone="quiet">Quiet · {WORDS[kind]}</StatusBadge>
        </div>
      </div>
      <div className="mu-cluster gap-mu-related p-mu-space-20">
        {KINDS.map(k => <StatusBadge key={k} led={k} surface="frosted">{WORDS[k]}</StatusBadge>)}
      </div>
    </div>
    <p className="type-doc-body text-ink2">The preview applies Machado full-severity linear RGB matrices. It helps compare inks; it cannot represent every person's vision. Words stay explicit, even with motion reduced. Quiet badges belong on a controlled ground.</p>
  </div>;
}

export default function StatusPage() {
  return <>
    <PageHeader title="LED and status badge" lede="A readable state in words, beside a lamp sunk into its own opaque socket. Live and linked hold steady; waiting breathes; failure double-blinks once; off stays dark. Every badge owns an opaque plate by default, so a frosted parent or an image cannot swallow it." />
    <Section title="LEDs and badges" lede="The same five states and words on web and Swift. The socket stays opaque while the inner lens dims.">
      <Bench caption="8px lens · 1px socket · readable shared sans words">
        <div className="mu-stack items-center gap-mu-group" data-testid="status-states">
          <div className="mu-cluster gap-mu-group justify-center">{KINDS.map(k => <figure key={k} className="mu-stack items-center gap-mu-related"><Led kind={k} /><figcaption className="type-doc-body text-ink2">{WORDS[k]}</figcaption></figure>)}</div>
          <div className="mu-cluster gap-mu-related justify-center">{KINDS.map(k => <StatusBadge key={k} led={k}>{WORDS[k]}</StatusBadge>)}</div>
        </div>
      </Bench>
      <SwiftCapture name="status" maxWidth={760} />
    </Section>
    <Section title="Ground, tone and transparency" lede="Default is opaque. Transparent means the existing strong frost fill without blur; frosted adds the shared backdrop. Solid overrides either; Reduce Transparency removes blur and selects the opaque twin. Strong is a tinted opaque plate; quiet is words and lamp only.">
      <Bench caption="real status parts over an image and a frosted parent · DialKit material controls"><SurfaceProof /></Bench>
      <SwiftCapture name="status-surfaces" maxWidth={760} />
    </Section>
    <Section id="x-ray" title="X-ray" lede="Handle the real badge to change the lamp, words and plate."><StatusXray /></Section>
    <Section title="Source and color evidence"><SourceTabs tabs={[
      { id: 'react', label: 'React', code: reactSource }, { id: 'led', label: 'LED', code: ledSource },
      { id: 'css', label: 'CSS', code: cssSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource },
      { id: 'agent', label: 'Agent guide', code: agentGuide }, { id: 'color', label: 'Color evidence', code: colorReport },
    ]} /></Section>
    <Section title="Rules"><Rules rules={[
      { id: 'D1', title: 'Words name the state', body: 'Color and gesture supplement readable words. Reduced motion retains every meaning.' },
      { id: 'D2', title: 'Own the ground', body: 'The dark socket separates the lens. Default and strong badges stay opaque on any parent; quiet requires a controlled ground.' },
      { id: 'D3', title: 'Not pressable', body: 'A hint explains a fixing command on hover and focus. A separate action executes it.' },
    ]} /></Section>
  </>;
}
