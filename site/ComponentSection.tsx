import * as React from 'react';
import { Button } from '../components/button/button';
import { CheckIcon, DuplicateIcon } from '../src/icons';
import type { ComponentEntry } from './registry';

const TABS = [
  { id: 'react', label: 'React' },
  { id: 'css', label: 'CSS' },
  { id: 'swift', label: 'SwiftUI' },
  { id: 'agent', label: 'Agent' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const COPIED_MS = 1400;

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <Button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <CheckIcon size={16} /> : <DuplicateIcon size={16} />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </Button>
  );
}

export function ComponentSection({ entry }: { entry: ComponentEntry }) {
  const { meta, Demo, sources } = entry;
  const [tab, setTab] = React.useState<Tab>('react');
  const code = sources[tab];
  const install = {
    npm: 'npm install @unlocalhosted/metalui',
    shadcn: `npx shadcn@latest add https://metalui.dev/r/${meta.name}.json`,
    swift: '.package(url: "https://github.com/vijayksingh/metalui", from: "0.1.0")',
  };

  return (
    <article className="comp" id={meta.name} aria-labelledby={`${meta.name}-title`}>
      <div className="comp-h">
        <h3 id={`${meta.name}-title`}>{meta.title}</h3>
        <p>{meta.description}</p>
      </div>

      <div className="stages">
        <div className="stage" data-mu-colorway="bone">
          <Demo />
          <div className="cap">{meta.sheet.replace('KAMUI', 'MU')} · {meta.title} · Bone</div>
        </div>
        <div className="stage dark" data-mu-colorway="graphite">
          <Demo />
          <div className="cap">{meta.sheet.replace('KAMUI', 'MU')} · {meta.title} · Graphite</div>
        </div>
      </div>

      <dl className="install">
        {Object.entries(install).map(([k, v]) => (
          <div key={k}>
            <dt className="eng">{k}</dt>
            <dd><code>{v}</code></dd>
          </div>
        ))}
      </dl>

      <div className="code">
        <div className="code-bar">
          <div className="tabs" role="tablist" aria-label={`${meta.title} source`}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className="tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <CopyButton
            text={code}
            label={tab === 'agent' ? 'Copy for agent' : tab === 'swift' ? 'Copy SwiftUI' : tab === 'css' ? 'Copy CSS' : 'Copy JSX'}
          />
        </div>
        <pre role="tabpanel" tabIndex={0}><code>{code}</code></pre>
      </div>
    </article>
  );
}
