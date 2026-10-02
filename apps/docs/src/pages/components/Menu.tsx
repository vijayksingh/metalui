import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, ContextMenu, Cue, IconButton, Menu, MenuItem, MenuCheckboxItem, MenuSeparator, ToastProvider, useToast } from '@unlocalhosted/metalui';
import { DuplicateIcon, MoreIcon, PinIcon, LayoutIcon, ShareIcon, TrashIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/menu/menu.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/menu/menu.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalMenu.swift?raw';
import { Bench, Host, PageHeader, Rules, Section, SourceTabs, TokenTable } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { MenuXray } from '../../ui/xray/MenuXray';

/* The demo's corrections: the heading is the cue's provenance, the rows what it is not. */
function Corrections() {
  const toast = useToast();
  const [off, setOff] = React.useState<string[]>([]);
  const correct = (what: string) => {
    setOff((o) => [...o, what]);
    toast.show({ title: 'Correction remembered', sub: 'for this exact text', undo: () => setOff((o) => o.filter((x) => x !== what)) });
  };
  const on = (k: string) => !off.includes(k);
  return (
    <p className="type-content text-ink" data-testid="corrections">
      {'send the poster to Sam '}
      <ContextMenu heading="Date · rule · date parser" menu={<>
        <MenuItem onSelect={() => correct('date')}>Ignore “tomorrow 4pm”</MenuItem>
        <MenuItem onSelect={() => setOff([])} disabled={off.length === 0}>Reset Corrections</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<LayoutIcon size={14} />} onSelect={() => {}}>Gather Similar</MenuItem>
      </>}>
        {on('date') ? <Cue kind="date" resolved="TUE 30 SEP · 16:00">tomorrow 4pm</Cue> : <span>tomorrow 4pm</span>}
      </ContextMenu>
      {' for '}
      <ContextMenu heading="Amount · model 0.82" menu={<>
        <MenuItem onSelect={() => correct('amount')}>Not an Amount</MenuItem>
        <MenuItem onSelect={() => {}}>Ask the model again</MenuItem>
      </>}>
        {on('amount') ? <Cue kind="amount" resolved="$40.00">$40</Cue> : <span>$40</span>}
      </ContextMenu>
    </p>
  );
}

function ScopedMenus() {
  const [colorway, setColorway] = React.useState<'bone' | 'graphite'>('graphite');
  const [result, setResult] = React.useState('No action yet');
  const items = <MenuItem icon={<DuplicateIcon size={14} />} onSelect={() => setResult('Duplicated')}>Duplicate scoped note</MenuItem>;
  return <div data-testid="scoped-menu" data-mu-colorway={colorway} className="mu-stack gap-mu-related p-mu-space-4 rounded-mu-space-3 recipe-surface overflow-hidden">
    <Menu trigger={<Button cap="standard">Scoped actions</Button>}>{items}</Menu>
    <ContextMenu menu={items}><button type="button" className="type-ui text-ink" aria-label="Scoped context target">Right-click this note</button></ContextMenu>
    <Button cap="link" onClick={() => setColorway(colorway === 'graphite' ? 'bone' : 'graphite')}>Change host colorway</Button>
    <span className="meta" role="status">{result}</span>
  </div>;
}

function SettingsMenu() {
  const [guides, setGuides] = React.useState(false);
  const [selection, setSelection] = React.useState<'mixed' | 'all' | 'none'>('mixed');
  return <div data-testid="menu-settings" className="mu-stack gap-mu-related items-start">
    <Menu trigger={<Button>View settings</Button>}>
      <MenuCheckboxItem checked={guides} onCheckedChange={setGuides}>Show guides</MenuCheckboxItem>
      <MenuCheckboxItem checked={selection === 'all'} indeterminate={selection === 'mixed'} onCheckedChange={(on) => setSelection(on ? 'all' : 'none')}>Select all layers</MenuCheckboxItem>
      <MenuCheckboxItem checked disabled>Keep proportions</MenuCheckboxItem>
    </Menu>
    <span role="status" className="meta">{guides ? 'Guides visible' : 'Guides hidden'} · {selection === 'mixed' ? 'Some layers' : selection === 'all' ? 'All layers' : 'No layers'}</span>
  </div>;
}

export default function MenuPage() {
  const d = useDialKit('Menu', { heading: true });
  const [ran, setRan] = React.useState('–');
  return (
    <ToastProvider>
      <PageHeader title="Menu and correction popover" lede="A frosted plate of rows, denser than the palette. From a trigger it opens 6 below; from a right-click it opens at the pointer, and that is the correction popover: right-click a cue to say what it is not. Pointer and keyboard share one highlighted row. Built on Base UI Menu and Context Menu." />
      <Section title="Correction popover" lede="Right-click a cue (or focus it and press ⇧F10). The heading is where the cue came from; choose a correction and the cue lets go, with Undo in a toast.">
        <Bench caption="right-click a cue">
          <Host>
            <Corrections />
          </Host>
        </Bench>
      </Section>
      <Section title="From a trigger" lede="Click, or focus and press ↓ / ↩. Arrows and type-ahead move the highlight; hover moves the same highlight.">
        <Bench caption={`last chosen · ${ran}`} className="min-h-[300px] items-start">
          <Host action={
            <Menu heading={d.heading ? 'Block · note' : undefined} trigger={<IconButton variant="ghost" label="More" icon={<MoreIcon size={16} />} />}>
              <MenuItem icon={<DuplicateIcon size={14} />} shortcut="⌘D" onSelect={() => setRan('Duplicate')}>Duplicate</MenuItem>
              <MenuItem icon={<PinIcon size={14} />} shortcut="⇧P" onSelect={() => setRan('Pin')}>Pin</MenuItem>
              <MenuItem icon={<ShareIcon size={14} />} disabled>Share</MenuItem>
              <MenuSeparator />
              <MenuItem icon={<TrashIcon size={14} />} shortcut="⌫" danger onSelect={() => setRan('Delete')}>Delete</MenuItem>
            </Menu>
          } />
        </Bench>
        <SwiftCapture name="menu" maxWidth={500} />
      </Section>
      <Section id="check-items" title="Settings stay open" lede="A setting keeps its row under your hand. The shared pen draws and withdraws the tick; a partially selected parent bends its dash into the tick. Disabled settings remain reachable to explain the held choice, and Escape returns to the trigger.">
        <Bench><SettingsMenu /></Bench>
      </Section>
      <Section id="portal" title="A scoped host" lede="Trigger and context menus carry their host’s colorway outside clipped parents and follow changes while open. Native menus inherit the SwiftUI colorway environment.">
        <ScopedMenus />
      </Section>
      <Section id="x-ray" title="X-ray" lede="See what the menu is made of. Click an icon to learn about one part and change it.">
        <MenuXray />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: reactSource },
          { id: 'css', label: 'CSS', code: cssSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
      <Section title="API">
        <TokenTable
          head={['Component', 'Props', 'Notes']}
          rows={[
            ['Menu', 'trigger, heading?, side?, align?, open?, onOpenChange?', '6 from the trigger.'],
            ['ContextMenu', 'menu, heading?, children (the target)', 'At the pointer: the correction popover.'],
            ['MenuItem', 'onSelect, icon?, shortcut?, danger?, disabled?', '30 tall; Title Case.'],
            ['MenuCheckboxItem', 'checked?, defaultChecked?, onCheckedChange?, indeterminate?, disabled?, closeOnClick?, shortcut?', '14 glyph; stays open by default.'],
            ['MenuSeparator', '–', 'An engraved rule.'],
          ]}
        />
      </Section>
      <Section title="Rules">
        <Rules rules={[
          { id: 'M1', title: 'Corrections win, and are remembered', body: 'For that exact text. A toast with Undo follows every correction.', origin: 'Reference design 03 §5' },
          { id: 'M2', title: 'Say what it acts on', body: 'A correction popover’s heading is the cue’s provenance: RULE, MODEL 0.82, YOU.', origin: 'Reference design 04 §8' },
          { id: 'M3', title: 'One highlight', body: 'Pointer and keyboard share one highlighted row; it is instant.', origin: 'Reference design 04 §18' },
          { id: 'M4', title: 'It nests', body: 'Radius 18 with padding 6 makes rows of radius 12.', origin: 'FOUNDATIONS containers' },
        ]} />
      </Section>
    </ToastProvider>
  );
}
