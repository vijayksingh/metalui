import * as React from 'react';
import { Button, LinkCard, type LinkPreview } from '@unlocalhosted/metalui';
import { LinkCardXray } from '../../ui/xray/LinkCardXray';
import reactSource from '../../../../../packages/metalui/src/blocks/link-card/link-card.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalGlassFace.swift?raw';
import agentSource from '../../../../../packages/metalui/src/blocks/link-card/link-card.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

// A still image and icon drawn inline, so the docs never fetch from another site.
const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="260"><defs><radialGradient id="g" cx="70%" cy="30%" r="70%"><stop offset="0" stop-color="#F5B36B"/><stop offset=".5" stop-color="#B0463A"/><stop offset="1" stop-color="#2A1A22"/></radialGradient></defs><rect width="500" height="260" fill="url(#g)"/><g fill="#FFD9A0" opacity=".85"><circle cx="90" cy="70" r="6"/><circle cx="160" cy="50" r="5"/><circle cx="240" cy="80" r="7"/><circle cx="330" cy="60" r="5"/><circle cx="410" cy="90" r="6"/></g></svg>')}`;
const ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="11" fill="#F5B36B"/><circle cx="12" cy="12" r="5" fill="#2A1A22"/></svg>')}`;
const FOUND: LinkPreview = { title: 'Lanterns over the night market, one evening in Taipei', image: IMAGE, icon: ICON };

function PreviewDemo() {
  const [state, setState] = React.useState<'plain' | 'loading' | 'loaded'>('plain');
  const load = () => { setState('loading'); window.setTimeout(() => setState('loaded'), 900); };
  return (
    <div className="flex flex-col items-center gap-14">
      <LinkCard href="https://lanterns.photo/night-market" preview={state === 'loaded' ? FOUND : null} />
      <Button onClick={state === 'loaded' ? () => setState('plain') : load} disabled={state === 'loading'}>{state === 'loaded' ? 'Clear the preview' : state === 'loading' ? 'Asking the server…' : 'Load the preview'}</Button>
    </div>
  );
}

export default function LinkCardPage() {
  return (
    <ComponentPage
      title={"Link card"}
      lede={"A link as a small piece of dark glass: the site's name on a screen tinted by that site, a LINK tag and one OPEN button. Only OPEN opens the link."}
      play={{ lede: "Each site gets its own colour from its name. Click OPEN to open the link in a new tab. Load the preview on the right: the page's title and picture fade in and the card grows to fit.", node: (
          <div className="flex flex-wrap justify-center gap-20">
            <LinkCard href="https://lanterns.photo/night-market" />
            <LinkCard href="https://github.com/unlocalhosted/metalui" />
            <PreviewDemo />
          </div>
        ) }}
      xray={<LinkCardXray />}
      sources={[
        { id: 'react', label: "React", code: reactSource },
        { id: 'css', label: "CSS", code: cssSource },
        { id: 'swift', label: "SwiftUI", code: swiftSource },
        { id: 'agent', label: "Agent guide", code: agentSource },
      ]}
      rules={[
        { id: "LC1", title: "Only OPEN opens", body: "The card itself is not a link, so you can move or select it without leaving the page.", origin: 'Ours' },
        { id: "LC2", title: "Same site, same colour", body: "The screen's colour comes from the site's name, so you learn sites by colour.", origin: 'Ours' },
        { id: "LC3", title: "Not for links in text", body: "A link inside a sentence is a small host pill, not a card.", origin: 'Ours' },
      ]}
    />
  );
}
