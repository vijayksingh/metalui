import * as React from 'react';
import { Bench, PageHeader, Rules, Section, SourceTabs, type Rule } from './doc';
import { SwiftCapture } from './SwiftCapture';

/* ─────────────────────────────────────────────────────────
 * COMPONENT PAGE · the shape every component page shares
 *
 *   head        title and one plain line
 *   playground  the real thing to try, and what to try
 *   x-ray       what it is made of
 *   source      React, CSS, SwiftUI (or a note that there is none yet), agent guide
 *   rules       what to do and not do with it
 * ───────────────────────────────────────────────────────── */

export interface ComponentPageProps {
  title: string;
  lede: React.ReactNode;
  /** wide: the playground is a scene things move across (a folder filling up), not one specimen. */
  play: { lede: string; caption?: string; node: React.ReactNode; wide?: boolean; on?: 'well' | 'table' | 'canvas' };
  xray?: React.ReactNode;
  /** More sections between the X-ray and the source. */
  more?: { id: string; title: string; lede?: string; node: React.ReactNode }[];
  /** The name of its SwiftUI capture, when it has one. */
  capture?: string;
  sources: { id: 'react' | 'css' | 'swift' | 'agent'; label: string; code: string }[];
  rules: Rule[];
}

export function ComponentPage({ title, lede, play, xray, more, capture, sources, rules }: ComponentPageProps) {
  const hasSwift = sources.some((s) => s.id === 'swift');
  return (
    <>
      <PageHeader title={title} lede={lede} tags={[{ label: 'React', led: 'green' }, { label: hasSwift ? 'SwiftUI' : 'SwiftUI not yet', led: hasSwift ? 'green' : 'off' }]} />
      <Section title="Playground" lede={play.lede}>
        <Bench caption={play.caption} on={play.on} className={play.wide ? 'wide' : undefined}>{play.node}</Bench>
        {capture && <SwiftCapture name={capture} maxWidth={520} />}
      </Section>
      {xray && (
        <Section id="x-ray" title="X-ray" lede="See what it is made of. Click an icon to learn about one part and change it.">
          {xray}
        </Section>
      )}
      {more?.map((m) => <Section key={m.id} id={m.id} title={m.title} lede={m.lede}>{m.node}</Section>)}
      <Section title="Source">
        <SourceTabs tabs={sources} />
      </Section>
      <Section title="Rules">
        <Rules rules={rules} />
      </Section>
    </>
  );
}
