import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Table, type TableColumn } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/table/table.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/table/table.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * TRAVEL TUNER: the page's DialKit panel
 *
 *   travel   the spring rows travel to their new places on when sorted
 *   slow     stretch it to follow each row
 * ───────────────────────────────────────────────────────── */

interface Trip { id: string; place: string; days: number; notes: number; month: string }
const TRIPS: Trip[] = [
  { id: 'lis', place: 'Lisbon', days: 5, notes: 14, month: 'Sep' },
  { id: 'por', place: 'Porto', days: 2, notes: 6, month: 'Oct' },
  { id: 'kyo', place: 'Kyoto', days: 9, notes: 31, month: 'Apr' },
  { id: 'osl', place: 'Oslo', days: 3, notes: 4, month: 'Jan' },
  { id: 'mex', place: 'Mexico City', days: 7, notes: 22, month: 'Nov' },
];
const COLUMNS: TableColumn<Trip>[] = [
  { key: 'place', header: 'Place', sortBy: (t) => t.place },
  { key: 'month', header: 'Month' },
  { key: 'days', header: 'Days', sortBy: (t) => t.days, align: 'end' },
  { key: 'notes', header: 'Notes', sortBy: (t) => t.notes, align: 'end' },
];

function Trips({ caption, empty }: { caption: string; empty?: boolean }) {
  const [selected, setSelected] = React.useState(new Set<string>(['kyo']));
  return (
    <div className="w-full max-w-[560px]">
      <Table caption={caption} columns={COLUMNS} rows={empty ? [] : TRIPS} rowKey={(t) => t.id} rowLabel={(t) => t.place} selected={selected} onSelectedChange={setSelected} defaultSort={{ key: 'place', direction: 'ascending' }} empty="No trips yet. Start one from a region." />
    </div>
  );
}

function TravelTuner() {
  const d = useDialKit('Table travel', {
    travel: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    slow: [1, 1, 10],
  });
  return <div data-testid="table-travel-tuner" className="flex w-full justify-center" style={springVars('settle', d.travel as SpringName, d.slow) as React.CSSProperties}><Trips caption="Tuned trips" /></div>;
}

export default function TablePage() {
  return (
    <ComponentPage
      title="Table"
      lede="Rows of things, read across and compared down. Sort by a column and every row travels to its new place, so you can follow it; choose rows with the checkbox."
      play={{ lede: 'Sort by Days or Notes (twice to reverse), and choose rows.', caption: 'five trips · one chosen · and an empty table', wide: true, node: (
        <div className="grid w-full justify-items-center gap-32">
          <Trips caption="Trips" />
          <Trips caption="Archived trips" empty />
        </div>
      ) }}
      more={[{ id: 'travel', title: 'Tune the travel', lede: 'The Table travel panel swaps the spring rows travel on when sorted, and stretches time.', node: <TravelTuner /> }]}
      usage={`<Table
  caption="Trips"
  columns={[
    { key: 'place', header: 'Place', sortBy: (t) => t.place },
    { key: 'days', header: 'Days', sortBy: (t) => t.days, align: 'end' },
  ]}
  rows={trips}
  rowKey={(t) => t.id}
  selected={selected}
  onSelectedChange={setSelected}
/>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'TB4', title: 'Shared selection and direction', body: 'Sort direction morphs the shared arrow on settle. Select-all draws the shared dash when some rows are chosen.', origin: 'The icon set' },
        { id: 'TB1', title: 'Rows travel when sorted', body: 'Each row moves from where it was to where it now belongs, so the eye can follow it.', origin: 'Ours' },
        { id: 'TB2', title: 'Numbers line up', body: 'Right-aligned with tabular figures.', origin: 'Ours' },
        { id: 'TB3', title: 'Say when it is empty', body: 'One quiet line saying what would be here and how to start.', origin: 'Ours' },
      ]}
    />
  );
}
