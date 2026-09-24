import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, CommandPalette, Kbd, type CommandPaletteItem } from '@unlocalhosted/metalui';
import { CalendarIcon, DocumentIcon, DrawIcon, MeIcon, RegionIcon, SearchIcon, SeedIcon, TagIcon, TaskIcon, TrashIcon, UndoIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/command-palette/command-palette.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/command-palette/command-palette.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/command-palette/command-palette.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalCommandPalette.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs, TokenTable } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

/* The medium demo's rows: lens suggestions, fragments that match, then actions. */
const LENSES = ['open tasks', 'this week', 'today', 'me', '#poster', '#studio', 'done', 'yesterday', 'links', 'colors'];
const FRAGMENTS = [
  { id: 'f1', text: 'the font on the train poster was a condensed grotesk', at: '8:52' },
  { id: 'f2', text: 'poster refs from the studio', at: '9:10' },
  { id: 'f3', text: 'send the poster to Sam tomorrow 4pm', at: '11:04' },
];
const lensIcon = (q: string) =>
  q === 'me' ? <MeIcon size={14} /> : q.startsWith('#') ? <TagIcon size={14} /> : /week|today|yesterday/.test(q) ? <CalendarIcon size={14} /> : /task|done/.test(q) ? <TaskIcon size={14} /> : <SearchIcon size={14} />;

function rows(q: string): CommandPaletteItem[] {
  const ql = q.trim().toLowerCase();
  const out: CommandPaletteItem[] = [];
  if (ql) out.push({ id: `lens:${ql}`, section: 'LENS', label: `See “${q.trim()}”`, icon: <SearchIcon size={14} />, hint: ql.split(' ').length > 2 ? 'JEV' : 'RULES' });
  LENSES.filter((l) => !ql || l.includes(ql)).slice(0, ql ? 4 : 10).forEach((l) => l !== ql && out.push({ id: `lens-${l}`, section: 'LENSES', label: l, icon: lensIcon(l) }));
  if (ql) FRAGMENTS.filter((f) => f.text.includes(ql)).forEach((f) => out.push({ id: f.id, section: 'FRAGMENTS', label: f.text, icon: <DocumentIcon size={14} />, hint: <><span className="mu-palette-eng mu-type-label">{f.at}</span><Kbd size="small">↩</Kbd></> }));
  const acts: CommandPaletteItem[] = [
    { id: 'me', section: 'ACTIONS', label: 'Me · Trends From What You Wrote', icon: <MeIcon size={14} />, hint: <Kbd size="small">M</Kbd> },
    { id: 'seed', section: 'ACTIONS', label: 'Seed a Sample Day', icon: <SeedIcon size={14} /> },
    { id: 'region', section: 'ACTIONS', label: 'New Region', icon: <RegionIcon size={14} />, hint: <Kbd size="small">R</Kbd> },
    { id: 'ink', section: 'ACTIONS', label: 'Ink', icon: <DrawIcon size={14} />, hint: <Kbd size="small">P</Kbd> },
    { id: 'undo', section: 'ACTIONS', label: 'Undo', icon: <UndoIcon size={14} />, hint: <Kbd size="small">⌘Z</Kbd> },
    { id: 'clear', section: 'ACTIONS', label: 'Clear Canvas', icon: <TrashIcon size={14} />, danger: true },
  ];
  out.push(...acts.filter((a) => !ql || a.label.toLowerCase().includes(ql)));
  return out;
}

export default function CommandPalettePage() {
  const d = useDialKit('Command palette', { open: false, query: 'poster', jev: true });
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [ran, setRan] = React.useState<string>('–');
  React.useEffect(() => {
    if (d.open) { setQ(d.query); setOpen(true); }
  }, [d.open, d.query]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setQ(''); setOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <PageHeader
        title="Command palette"
        lede="⌘K: ask the canvas a question or run anything by name. One field, sections of rows (a lens for what you typed, suggested lenses, fragments that match, actions), a raised selected row, and a footer that says which keys work and where the answers come from. Built on Base UI Dialog around an inline Base UI Combobox."
      />
      <Section title="Playground" lede="Open it with the button or ⌘K. Type: the first row is always the lens for your words. Arrows or hover move the selection; ↩ runs, ⇧↩ pins, ⎋ closes. The dial opens it with a query already typed (as the demo does from a tag).">
        <Bench caption={`last run · ${ran}`} className="min-h-[200px]">
          <div className="flex items-center gap-16">
            <Button onClick={() => { setQ(''); setOpen(true); }}>Lenses and actions <Kbd size="small">⌘K</Kbd></Button>
          </div>
        </Bench>
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          query={q}
          onQueryChange={setQ}
          items={rows(q)}
          filter={false}
          icon={<SearchIcon size={15} />}
          status={d.jev ? 'NATURAL LANGUAGE VIA JEV' : 'JEV OFFLINE · KEYWORDS ONLY'}
          onRun={(item, { pin }) => setRan(`${item.label}${pin ? ' · pinned' : ''}`)}
        />
        <SwiftCapture name="command-palette" maxWidth={600} />
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
          head={['Prop', 'Type', 'Notes']}
          rows={[
            ['open, onOpenChange', 'boolean', 'Controlled. ⎋ and the scrim close.'],
            ['items', 'CommandPaletteItem[]', 'id, label, section, icon?, hint?, keywords?, danger?. Sections adjacent.'],
            ['onRun', '(item, { pin }) => void', '↩ and a click run; ⇧↩ runs pinned. Closes first.'],
            ['query, onQueryChange', 'string', 'Controlled query, for rows that depend on it.'],
            ['filter', 'boolean', 'Default true: every word against label and keywords. false: the host filters.'],
            ['status', 'string', 'Right of the footer: where answers come from.'],
            ['pinnable', 'boolean', 'Default true: ⇧↩ and its footer key.'],
          ]}
        />
      </Section>
      <Section title="Rules">
        <Rules rules={[
          { id: 'P1', title: 'Every key is discoverable here', body: 'A row whose action has a key shows it. The palette is where people learn the keys.', origin: 'Kamui 04 §3' },
          { id: 'P2', title: 'Say where answers come from', body: 'The footer names Jev or says it is offline; a lens row says RULES or JEV.', origin: 'Kamui 03 §5' },
          { id: 'P3', title: 'Selection is instant', body: 'Rows are scanned, not watched: the raised cap and its bar jump, and hover moves them.', origin: 'MetalUI M6' },
          { id: 'P4', title: 'Destructive is red, and undoable', body: 'The palette runs it at once; the result carries Undo in a toast.', origin: 'Kamui 04 §12' },
        ]} />
      </Section>
    </>
  );
}
