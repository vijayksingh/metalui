import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Breadcrumbs, Button, type Crumb } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/breadcrumbs/breadcrumbs.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/breadcrumbs/breadcrumbs.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * ARRIVAL TUNER: the page's DialKit panel
 *
 *   spring   the spring a new crumb arrives on
 *   travel   how far it comes from
 *   max      how many levels before the middle folds
 * ───────────────────────────────────────────────────────── */

const TREE = ['Spaces', 'Travel', '2026', 'Lisbon', 'Day two', 'Photos', 'Tram 28'];

function Path({ max, label }: { max: number; label: string }) {
  const [depth, setDepth] = React.useState(3);
  const items: Crumb[] = TREE.slice(0, depth).map((name, i) => ({ id: TREE.slice(0, i + 1).join('/'), label: name, href: `#${i}` }));
  const go = (i: number) => setDepth(i + 1);
  return (
    <div className="grid justify-items-center gap-20">
      <Breadcrumbs
        aria-label={label}
        items={items}
        max={max}
        onNavigate={(c) => go(items.indexOf(c))}
        renderLink={(item, props) => <a {...props} onClick={(e) => { e.preventDefault(); go(items.indexOf(item)); }} />}
      />
      <Button onClick={() => setDepth((d) => Math.min(TREE.length, d + 1))} disabled={depth === TREE.length}>Open {TREE[depth] ?? 'nothing more'}</Button>
    </div>
  );
}

function ArrivalTuner() {
  const d = useDialKit('Crumb arrival', {
    spring: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    travel: [4, 0, 16],
    max: [4, 3, 7],
    slow: [1, 1, 10],
  });
  const vars = { ...springVars('settle', d.spring as SpringName, d.slow), '--mu-motion-step': `${d.travel}px` } as React.CSSProperties;
  return <div data-testid="crumb-arrival-tuner" style={vars}><Path max={Math.round(d.max)} label="Tuned path" /></div>;
}

export default function BreadcrumbsPage() {
  return (
    <ComponentPage
      title="Breadcrumbs"
      lede="Where you are, as a path you can climb. Open a level and it arrives from the right; click a level above and the path shortens. A long path folds its middle into a menu."
      play={{ lede: 'Open deeper levels, then climb back up, or open the folded middle.', caption: 'a path seven levels deep', node: <Path max={4} label="Breadcrumb" /> }}
      more={[{ id: 'arrival', title: 'Tune the arrival', lede: 'The Crumb arrival panel sets the spring a new level arrives on, how far it comes from, and when the middle folds.', node: <ArrivalTuner /> }]}
      usage={`<Breadcrumbs
  items={[
    { id: 'spaces', label: 'Spaces', href: '/spaces' },
    { id: 'travel', label: 'Travel', href: '/spaces/travel' },
    { id: 'lisbon', label: 'Lisbon' },
  ]}
  renderLink={(item, props) => <RouterLink to={item.href!} {...props} />}
/>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'BC4', title: 'A still path, one acting key', body: 'Shared right chevrons separate levels without playing. The shared more glyph belongs to the folded-level key.', origin: 'The icon set' },
        { id: 'BC1', title: 'You are the last crumb', body: 'The current level is plain text, never a link to itself.', origin: 'WAI breadcrumb pattern' },
        { id: 'BC2', title: 'Only changes move', body: 'A new level arrives from the right; the path is still on first view.', origin: 'Ours' },
        { id: 'BC3', title: 'Fold the middle', body: 'Keep where you started and where you are; the rest waits in a menu.', origin: 'Ours' },
      ]}
    />
  );
}
