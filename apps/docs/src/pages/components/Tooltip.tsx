import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Toolbar, ToolButton, ToolbarSeparator, Tooltip, TooltipProvider } from '@unlocalhosted/metalui';
import { CloseIcon, PinIcon, RegionIcon, SelectIcon, TextIcon, UndoIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/tooltip/tooltip.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/tooltip/tooltip.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/tooltip/tooltip.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalTooltip.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

function IconButton({ label, children, ...props }: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} className="mu-icon-trigger grid size-28 cursor-pointer place-items-center rounded-full text-ink2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mu-focus)]" {...props}>
      {children}
    </button>
  );
}

export default function TooltipPage() {
  const d = useDialKit('Tooltip', { pinned: false, side: { type: 'select', options: ['top', 'bottom'], default: 'top' } });
  const [tool, setTool] = React.useState('select');
  const side = d.side as 'top' | 'bottom';
  return (
    <>
      <PageHeader title="Tooltip" lede="Every icon-only control names itself and its key, one hover away: a graphite chip in the label role, the key dimmed after a middle dot. It shows after 120 ms; within one group the next trigger shows at once. Information, never an action. Built on Base UI Tooltip." />
      <Section title="Playground" lede="Hover or tab across the controls. Once one tooltip shows, the next shows at once. Dial: pin the tooltips open for a still, or put them below.">
        <Bench caption={`${side} · 120 ms · gap 10`} className="min-h-[220px]">
          <div className="flex items-center gap-40">
            <Toolbar aria-label="Tools" variant="graphite">
              <ToolButton label="Select" shortcut="V" icon={<SelectIcon size={16} />} pressed={tool === 'select'} onPressedChange={() => setTool('select')} />
              <ToolButton label="Write" shortcut="T" icon={<TextIcon size={16} />} pressed={tool === 'write'} onPressedChange={() => setTool('write')} />
              <ToolButton label="Region" shortcut="R" icon={<RegionIcon size={16} />} pressed={tool === 'region'} onPressedChange={() => setTool('region')} />
              <ToolbarSeparator />
              <ToolButton label="Undo" shortcut="⌘Z" icon={<UndoIcon size={16} />} onClick={() => {}} />
            </Toolbar>
            <TooltipProvider>
              <div className="flex items-center gap-4" data-testid="loose">
                <Tooltip label="Pin as a region" shortcut="⇧↩" side={side} open={d.pinned || undefined}>
                  <IconButton label="Pin as a region"><PinIcon size={16} /></IconButton>
                </Tooltip>
                <Tooltip label="Close" shortcut="⎋" side={side}>
                  <IconButton label="Close"><CloseIcon size={16} /></IconButton>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </Bench>
        <SwiftCapture name="tooltip" maxWidth={300} />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: reactSource },
          { id: 'css', label: 'CSS', code: cssSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
      <Section title="Rules">
        <Rules rules={[
          { id: 'T1', title: 'Every icon-only control has one', body: 'Its name and its key, and its own accessible name besides: the tooltip is visual.', origin: 'Kamui 04 (preamble)' },
          { id: 'T2', title: 'One line, name then key', body: 'SELECT · V. No sentences. Where a cue came from is the provenance tooltip, not this.', origin: 'Kamui 04 §2, 03 §5' },
          { id: 'T3', title: 'Never an action', body: 'The pointer passes through it and it holds nothing to click; anything to act on is a menu or popover.', origin: 'Kamui 04 §18' },
        ]} />
      </Section>
    </>
  );
}
