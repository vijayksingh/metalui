import * as React from 'react';
import { LinkCard } from '@unlocalhosted/metalui';
import { LinkCardXray } from '../../ui/xray/LinkCardXray';
import reactSource from '../../../../../packages/metalui/src/blocks/link-card/link-card.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalGlassFace.swift?raw';
import agentSource from '../../../../../packages/metalui/src/blocks/link-card/link-card.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

export default function LinkCardPage() {
  return (
    <ComponentPage
      title={"Link card"}
      lede={"A link as a small piece of dark glass: the site's name on a screen tinted by that site, a LINK tag and one OPEN button. Only OPEN opens the link."}
      play={{ lede: "Each site gets its own colour from its name. Click OPEN to open the link in a new tab.", node: (
          <div className="flex flex-wrap justify-center gap-20">
            <LinkCard href="https://lanterns.photo/night-market" />
            <LinkCard href="https://github.com/unlocalhosted/metalui" />
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
