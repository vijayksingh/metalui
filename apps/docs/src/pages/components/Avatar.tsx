import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Avatar, AvatarGroup } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/avatar/avatar.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/avatar/avatar.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * STACK TUNER: the page's DialKit panel
 *
 *   spread   how far apart the discs move when the group is hovered
 *   spring   the spring they spread on
 *   overlap  how much they overlap at rest
 * ───────────────────────────────────────────────────────── */

/** A soft two-tone portrait, drawn here so the page needs no photos from elsewhere. */
const portrait = (a: string, b: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="rgba(255,255,255,.55)"/><path d="M12 60c3-12 11-18 20-18s17 6 20 18z" fill="rgba(255,255,255,.55)"/></svg>`)}`;

const PEOPLE = [
  { name: 'Ana Rocha', src: portrait('#E8B9A0', '#B77B63'), presence: 'live' as const },
  { name: 'Ben Okafor', src: portrait('#A7C6E8', '#5F84B6') },
  { name: 'Chen Wei', presence: 'waiting' as const },
  { name: 'Dara Lin', src: 'https://invalid.example/broken.png' },
  { name: 'Eli Park' },
  { name: 'Fay Moss' },
  { name: 'Gus Hale' },
];

function Examples({ label }: { label: string }) {
  return (
    <div className="grid justify-items-center gap-24">
      <div className="flex items-center gap-16">
        <Avatar name="Ana Rocha" src={PEOPLE[0].src} size="large" presence="live" />
        <Avatar name="Chen Wei" presence="waiting" />
        <Avatar name="Dara Lin" src="https://invalid.example/broken.png" />
        <Avatar name="Eli Park" size="small" />
      </div>
      <AvatarGroup aria-label={label} people={PEOPLE} max={5} />
    </div>
  );
}

function StackTuner() {
  const d = useDialKit('Avatar stack', {
    spread: [4, 0, 16],
    spring: { type: 'select', options: SPRING_NAMES, default: 'object' },
    overlap: [8, 0, 16],
  });
  const vars = { ...springVars('object', d.spring as SpringName), '--mu-r-avatar-group-spread': `${d.spread}px`, '--mu-r-avatar-group-overlap': `${d.overlap}px` } as React.CSSProperties;
  return <div data-testid="avatar-stack-tuner" className="flex justify-center" style={vars}><AvatarGroup aria-label="Tuned people" people={PEOPLE} max={5} /></div>;
}

function AccessibleIdentity() {
  return (
    <div className="mu-stack gap-mu-group">
      <div className="mu-cluster">
        <Avatar name="A Rocha" aria-label="Ana Rocha, host, here" presence="live" />
        <p className="type-doc-prose">A Rocha supplies AR; the accessible label says “Ana Rocha, host, here”.</p>
      </div>
      <div className="mu-cluster" data-testid="avatar-decorative-example">
        <Avatar name="Ben Okafor" aria-label="" />
        <span className="type-doc-prose">Ben Okafor</span>
      </div>
      <div className="mu-cluster">
        <AvatarGroup aria-label="Meeting hosts" people={[
          { name: 'A Rocha', 'aria-label': 'Ana Rocha, host', src: 'https://invalid.example/broken.png' },
          { name: 'B Okafor', 'aria-label': 'Ben Okafor, co-host' },
        ]} />
        <p className="type-doc-prose">Each group member can have its own label, including when a photo fails.</p>
      </div>
    </div>
  );
}

export default function AvatarPage() {
  return (
    <ComponentPage
      title="Avatar"
      lede="A person as a small raised disc: their initials first, then their photo fading in once it loads. Presence is a lamp at the corner. A group overlaps, and spreads apart when you hover it, like a stack opening."
      play={{ lede: 'Hover the group to spread it.', caption: 'large · away · broken photo · small · a group of seven', node: <Examples label="Shared with" /> }}
      more={[
        { id: 'identity', title: 'Accessible identity', lede: 'Name supplies the initials. An optional aria-label replaces the complete accessible label; include presence when relevant. An empty label makes the disc decorative when nearby text already identifies the person.', node: <AccessibleIdentity /> },
        { id: 'stack', title: 'Tune the stack', lede: 'The Avatar stack panel sets how far the discs spread, the spring they spread on, and how much they overlap.', node: <StackTuner /> },
      ]}
      usage={`<Avatar name="Ana Rocha" src={ana.photo} presence="live" />

<Avatar name="A Rocha" aria-label="Ana Rocha, host, here" presence="live" />

{/* Nearby text already identifies the person. */}
<Avatar name="Ben Okafor" aria-label="" />
<span>Ben Okafor</span>

<AvatarGroup aria-label="Shared with" people={[
  { name: 'Ana Rocha', src: ana.photo },
  { name: 'Ben Okafor' },
  { name: 'Chen Wei' },
]} />`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'AV1', title: 'Initials first', body: 'The disc is never empty: initials show until the photo loads, and stay if it fails.', origin: 'Ours' },
        { id: 'AV2', title: 'A stack opens', body: 'Hovered, a group spreads apart on the object spring so each person is seen.', origin: 'Ours' },
        { id: 'AV3', title: 'Presence in words too', body: 'The lamp shows presence; the default label says it. Include it in custom labels or nearby text, too.', origin: 'Ours' },
      ]}
    />
  );
}
