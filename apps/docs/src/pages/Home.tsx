import { Link } from 'react-router';
import { Button } from '@unlocalhosted/metalui';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import { Bench, Code, PageHeader, Section } from '../ui/doc';

const TOOLS: { name: IconName; label: string }[] = [
  { name: 'select', label: 'Select' },
  { name: 'note', label: 'Note' },
  { name: 'image', label: 'Image' },
  { name: 'link', label: 'Link' },
  { name: 'draw', label: 'Draw' },
  { name: 'tidy', label: 'Tidy' },
];

const PLACES = [
  { to: '/foundations', title: 'Foundations', body: 'The rules the objects are built from: ink, type, a ×6 radius ladder, a 4-point spacing base, control heights, five elevation levels, springs and transitions.', meta: '9 pages' },
  { to: '/components/button', title: 'Components', body: 'Base UI primitives dressed in Soft Hardware. Each ships as React, SwiftUI and an agent guide. They land one at a time, each reviewed against the object sheet.', meta: '1 · Button' },
  { to: '/icons', title: 'Icons', body: 'Monoline and duotone glyphs on a 24 grid. Each one has its own hover pose and press animation.', meta: '31 glyphs' },
];

export default function Home() {
  return (
    <>
      <PageHeader
        title="MetalUI"
        lede="Interface controls that behave like small, well-made objects: bone and graphite soft-touch plastic, smoked glass and knurled metal. Buttons press in and spring back. Every component ships as React on Base UI and as SwiftUI, with a guide for coding agents."
      />

      <Bench caption="Soft Hardware · a strip of tools and three caps">
        <div className="flex flex-col items-center gap-32">
          <div role="toolbar" aria-label="Tools" className="material-raised flex items-center gap-6 rounded-pill p-6">
            {TOOLS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                aria-label={t.label}
                aria-pressed={i === 0}
                className="mu-icon-trigger relative grid size-36 cursor-pointer place-items-center rounded-pill text-icon transition-[transform,background,box-shadow] duration-200 hover:text-ink material-cap aria-pressed:translate-y-px aria-pressed:text-ink aria-pressed:material-pressed active:translate-y-px active:material-pressed"
              >
                <Icon name={t.name} size={16} />
                {i === 0 && <span aria-hidden className="absolute right-6 top-6 size-4 rounded-full bg-[image:var(--mu-led-green)] shadow-[0_0_0_.5px_rgba(0,0,0,.3)]" />}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Button cap="primary">New Canvas</Button>
            <Button>Cancel</Button>
            <Button cap="destructive">Delete</Button>
          </div>
        </div>
      </Bench>

      <div className="h-64" />

      <Section title="Where to go">
        <ul className="flex flex-col">
          {PLACES.map((p) => (
            <li key={p.to} className="border-b border-[var(--mu-rule)] last:border-0">
              <Link to={p.to} className="group grid grid-cols-[1fr_auto] items-baseline gap-16 py-20 text-ink no-underline">
                <span className="flex flex-col gap-6">
                  <span className="type-title group-hover:underline">{p.title}</span>
                  <span className="prose-body max-w-[64ch] text-ink2">{p.body}</span>
                </span>
                <span className="type-readout text-ink2">{p.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Install" lede="React components come from npm, or you can copy their source into your project with the shadcn CLI. SwiftUI comes from the Swift package.">
        <div className="flex max-w-[640px] flex-col gap-16">
          <Code label="npm" code={'npm install @unlocalhosted/metalui'} />
          <Code label="shadcn" code={'npx shadcn@latest add \\\n  https://metalui.dev/r/button.json'} />
          <Code label="SwiftPM" code={'.package(\n  url: "https://github.com/vijayksingh/metalui",\n  from: "0.1.0"\n)'} />
        </div>
      </Section>

      <Section title="Status" lede="Alpha. The foundations are proposed and waiting for review. Button and all 31 icons are built. Everything else lands one component at a time, each checked against the Soft Hardware object sheet in both colorways." />
    </>
  );
}
