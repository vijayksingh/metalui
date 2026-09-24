import { CodeCard } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/blocks/code-card/code-card.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/blocks/code-card/code-card.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

const TS = "const poster = {\n  size: 'A2',\n  stock: \"matte\", // not gloss\n  weight: 170,\n};\nexport default poster;";
const DIFF = "--- a/poster.ts\n+++ b/poster.ts\n const poster = {\n-  stock: 'gloss',\n+  stock: 'matte',\n   weight: 170,\n };";

export default function CodeCardPage() {
  return (
    <ComponentPage
      title="Code card"
      lede="A code fence on the canvas: numbered, tinted lines in a small dark glass card. A diff fence tints whole lines: green for added, red for removed."
      play={{ lede: 'Left: a fence tagged ts. Right: a fence tagged diff, where each line is marked added, removed or unchanged.', caption: 'code · diff', node: (
        <div className="flex flex-wrap items-start justify-center gap-20">
          <CodeCard code={TS} lang="ts" />
          <CodeCard code={DIFF} lang="diff" />
        </div>
      ) }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'CC1', title: 'The fence is the text', body: 'What you see is the code as written; ↩ edits it raw. Nothing here is a separate editor.', origin: 'Ours' },
        { id: 'CC2', title: 'Diff lines come from the core', body: 'The core marks each line of a diff fence added, removed or unchanged, so both apps tint the same lines.', origin: 'Ours' },
        { id: 'CC3', title: 'Eighteen lines at most', body: 'Longer code shows its first 18 lines; the tag still counts them all.', origin: 'Reference design' },
      ]}
    />
  );
}
