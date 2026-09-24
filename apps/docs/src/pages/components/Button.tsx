import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, type ButtonCap } from '@unlocalhosted/metalui';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/button/button.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/button/button.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/button/button.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalButton.swift?raw';
import { ButtonDemo } from '../../demos/ButtonDemo';
import { Bench, Code, PageHeader, Rules, Section, TokenTable } from '../../ui/doc';

const TABS = [
  { id: 'react', label: 'React', code: reactSource },
  { id: 'css', label: 'CSS', code: cssSource },
  { id: 'swift', label: 'SwiftUI', code: swiftSource },
  { id: 'agent', label: 'Agent guide', code: agentGuide },
] as const;

const CAPS: ButtonCap[] = ['standard', 'primary', 'destructive'];
const PRESSED: Record<ButtonCap, React.CSSProperties> = {
  standard: { background: 'var(--mu-pressed-bg)', boxShadow: 'var(--mu-pressed-sh)' },
  primary: { background: 'var(--mu-primary-pressed-bg)', boxShadow: 'var(--mu-primary-pressed-sh)' },
  destructive: { background: 'var(--mu-destructive-pressed-bg)', boxShadow: 'var(--mu-destructive-pressed-sh)' },
};

export default function ButtonPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]['id']>('react');
  const d = useDialKit('Button', {
    content: {
      label: 'New Canvas',
      cap: { type: 'select', options: CAPS, default: 'primary' },
      icon: { type: 'select', options: ['none', 'share', 'duplicate', 'send-away', 'check'], default: 'none' },
      disabled: false,
    },
    geometry: {
      height: [32, 20, 44, 4],
      derivePadding: true,
      padding: [15, 6, 24, 1],
      gap: [6, 2, 12, 1],
    },
    press: {
      travel: [1, 0, 3, 0.5],
    },
  });

  const h = d.geometry.height;
  const iconSize = h <= 24 ? 12 : h <= 32 ? 14 : h <= 40 ? 16 : 20;
  const padding = d.geometry.derivePadding ? h / 2 - 1 : d.geometry.padding;
  const vars = {
    '--mu-button-h': `${h}px`,
    '--mu-button-px': `${padding}px`,
    '--mu-button-gap': `${d.geometry.gap}px`,
    '--mu-button-travel': `${d.press.travel}px`,
  } as React.CSSProperties;
  const code = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <PageHeader
        title="Button"
        lede="A press-in pill. While held it sinks 1 point and its shadow collapses into a well; released, it springs back. Three caps: standard soft-touch in the colorway, the dark primary cap, and the one red destructive cap. Built on Base UI Button."
      />

      <Section title="Playground" lede="Everything about this instance is a dial: content, geometry and press travel. With derive padding on, the padding follows the pill rule, h/2 − 1.">
        <Bench caption={`h${h} · pad ${padding} · icon ${iconSize} · travel ${d.press.travel}`}>
          <div style={vars}>
            <Button cap={d.content.cap as ButtonCap} disabled={d.content.disabled}>
              {d.content.icon !== 'none' && <Icon name={d.content.icon as IconName} size={iconSize} />}
              {d.content.label}
            </Button>
          </div>
        </Bench>
      </Section>

      <Section title="States" lede="Each cap at rest, pressed, focused and disabled. Hover brightens the label; icons inside play their hover pose from the whole button.">
        <Bench tone="page">
          <div className="grid grid-cols-[88px_repeat(4,auto)] items-center gap-x-24 gap-y-16">
            <span />
            {['Rest', 'Pressed', 'Focus', 'Disabled'].map((s) => (
              <span key={s} className="type-label engraved text-center">{s}</span>
            ))}
            {CAPS.map((cap) => (
              <React.Fragment key={cap}>
                <span className="type-label engraved">{cap}</span>
                <Button cap={cap}>Cancel</Button>
                <Button cap={cap} style={{ ...PRESSED[cap], transform: 'translateY(1px)' }} tabIndex={-1}>Cancel</Button>
                <Button cap={cap} style={{ outline: '2px solid var(--mu-focus)', outlineOffset: 2 }} tabIndex={-1}>Cancel</Button>
                <Button cap={cap} disabled>Cancel</Button>
              </React.Fragment>
            ))}
          </div>
        </Bench>
      </Section>

      <Section title="In use">
        <Bench>
          <ButtonDemo />
        </Bench>
      </Section>

      <Section title="Source" lede="The same Button three ways, plus the guide your coding agent reads.">
        <div className="flex flex-col gap-12">
          <div role="tablist" aria-label="Source" className="material-well inline-flex w-fit rounded-pill p-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={['type-ui h-28 cursor-pointer rounded-pill px-13 transition-[color,background,box-shadow] duration-200', tab === t.id ? 'material-thumb text-ink' : 'text-ink2 hover:text-ink'].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Code label={code.label} code={code.code} />
        </div>
      </Section>

      <Section title="API">
        <TokenTable
          head={['Prop', 'Type', 'Notes']}
          rows={[
            ['cap', "'standard' | 'primary' | 'destructive'", 'Default standard. At most one primary or destructive per group.'],
            ['disabled', 'boolean', 'Renders at 40% and skips icon motion.'],
            ['focusableWhenDisabled', 'boolean', 'From Base UI; keeps the button in the tab order.'],
            ['render', 'Base UI render prop', 'Render as a link or custom element (set nativeButton={false}).'],
          ]}
        />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'B1', title: 'One signal cap per group', body: 'Everything else is standard. Destructive is only for removing or discarding data.' },
            { id: 'B2', title: 'Icons lead, at the control’s icon size', body: '14 in a 32 button. The button is the icon’s trigger, so its hover pose and press play from the whole button.' },
            { id: 'B3', title: 'The press is feedback, not a result', body: 'Show the real outcome: a toast, a state change or an error. Never let the animation stand in for success.' },
          ]}
        />
      </Section>
    </>
  );
}
