import * as React from 'react';
import { Link } from 'react-router';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs, type Rule } from './doc';

/* ─────────────────────────────────────────────────────────
 * BLOCK PAGE · the component page's shape, for a working screen
 *
 *   head        title and one plain line
 *   playground  the live block with sample data, and what to try
 *   usage       the shadcn command, where the file lands, the smallest use, and the parts it is made of
 *   more        the block's own sections (its DialKit panel)
 *   source      the block's file
 *   rules       what it is for and not for, and what a builder must keep (keys, access, motion,
 *               layout); each rule says where it comes from, as component rules do
 * A block is copied into a project (by the registry), not imported: it composes components into one job.
 * ───────────────────────────────────────────────────────── */

export interface BlockPageProps {
  title: string;
  lede: React.ReactNode;
  play: { lede: string; caption?: string; node: React.ReactNode };
  /** Where the registry puts the file in a project, and the smallest use of it. */
  usage: { file: string; code: string };
  /** The registry item that installs it (metalui.dev/r/<registry>.json). */
  registry: string;
  /** The MetalUI parts it composes, each linking to its page. */
  madeOf: { label: string; to: string }[];
  more?: { id: string; title: string; lede?: string; node: React.ReactNode }[];
  source: string;
  rules: Rule[];
}

export function BlockPage({ title, lede, play, usage, registry, madeOf, more, source, rules }: BlockPageProps) {
  return (
    <>
      <PageHeader title={title} lede={lede} tags={[{ label: 'Block', led: 'blue' }, { label: 'React', led: 'green' }, { label: 'SwiftUI not yet', led: 'off' }]} />
      <Section title="Playground" lede={play.lede}>
        <Bench caption={play.caption} className="wide">{play.node}</Bench>
      </Section>
      <Section id="usage" title="Usage" lede={<>One command copies the block into your project and adds @unlocalhosted/metalui if you don&rsquo;t have it. It lands at <code className="break-all">{usage.file}</code>; then use it.</>}>
        <div className="grid gap-16">
          <Code code={`npx shadcn@latest add https://metalui.dev/r/${registry}.json`} label="install" lang="bash" />
          <Code code={usage.code} label="example.tsx" lang="tsx" />
          <p className="m-0 type-doc-prose">Layout follows the copied block’s width. Keep its <code>@container/block</code> root and name block breakpoints, for example <code>@md/block:grid-cols-2</code>. A nested panel may use its own name, such as <code>@container/panel</code> with <code>@md/panel</code>; unnamed queries can accidentally answer a nearer container.</p>
          <div className="grid gap-8">
            <span className="eng">made of</span>
            <ul className="m-0 flex list-none flex-wrap gap-8 p-0">
              {madeOf.map((b) => (
                <li key={b.to + b.label}>
                  <Link to={b.to} className="inline-flex h-28 items-center rounded-pill px-12 type-ui text-ink no-underline recipe-button hover:text-ink focus-visible:focus-ring">{b.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
      {more?.map((m) => <Section key={m.id} id={m.id} title={m.title} lede={m.lede}>{m.node}</Section>)}
      <Section title="Source">
        <SourceTabs tabs={[{ id: 'react', label: 'React', code: source }]} />
      </Section>
      <Section title="Rules">
        <Rules rules={rules} />
      </Section>
    </>
  );
}
