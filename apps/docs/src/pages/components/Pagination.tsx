import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Pagination } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/pagination/pagination.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/pagination/pagination.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * GLIDE TUNER: the page's DialKit panel
 *
 *   spring    the spring the current-page thumb glides on
 *   count     how many pages
 *   siblings  pages shown on each side of the current one
 * ───────────────────────────────────────────────────────── */

function Results({ count, siblings, label }: { count: number; siblings: number; label: string }) {
  const [page, setPage] = React.useState(3);
  return (
    <div className="grid justify-items-center gap-12">
      <Pagination aria-label={label} page={Math.min(page, count)} count={count} siblings={siblings} onPageChange={setPage} />
      <span className="type-meta text-ink3">Page {Math.min(page, count)} of {count}</span>
    </div>
  );
}

function GlideTuner() {
  const d = useDialKit('Page glide', {
    spring: { type: 'select', options: SPRING_NAMES, default: 'part' },
    count: [12, 1, 40],
    siblings: [1, 0, 3],
    slow: [1, 1, 10],
  });
  const vars = springVars('part', d.spring as SpringName, d.slow) as React.CSSProperties;
  return <div data-testid="page-glide-tuner" style={vars}><Results count={Math.round(d.count)} siblings={Math.round(d.siblings)} label="Tuned pages" /></div>;
}

export default function PaginationPage() {
  return (
    <ComponentPage
      title="Pagination"
      lede="Moving through pages of results. The current page is the switcher's raised thumb, and it glides to the page you choose; a long run keeps the ends and the neighbours and folds the rest into quiet gaps."
      play={{ lede: 'Choose pages, or step with the arrows.', caption: 'twelve pages', node: <Results count={12} siblings={1} label="Pagination" /> }}
      more={[{ id: 'glide', title: 'Tune the glide', lede: 'The Page glide panel swaps the thumb\'s spring, sets how many pages there are and how many neighbours show, and stretches time.', node: <GlideTuner /> }]}
      usage={`const [page, setPage] = React.useState(1);

<Pagination page={page} count={12} onPageChange={setPage} />`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'PG1', title: 'The thumb travels', body: 'The current page is a part on a track; it glides to the new page on the part spring.', origin: 'The switcher' },
        { id: 'PG2', title: 'Ends and neighbours', body: 'Keep the first and last pages and the current one\'s neighbours; fold the rest.', origin: 'Ours' },
        { id: 'PG4', title: 'One directional glyph', body: 'Previous and next use the shared chevron at quarter turns. End keys are disabled and stay still; reduced motion keeps both glyphs whole.', origin: 'The icon grammar' },
        { id: 'PG3', title: 'Say where you are', body: '"Page 3 of 12" near the keys when it matters.', origin: 'Ours' },
      ]}
    />
  );
}
