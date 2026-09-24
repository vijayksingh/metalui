import * as React from 'react';
import { useLocation } from 'react-router';
import { Button, SwapIcon, SwapText } from '@unlocalhosted/metalui';
import { CheckIcon, DuplicateIcon, NoteIcon } from '@unlocalhosted/metalui/icons';
import { pageMarkdown } from '../lib/pageMarkdown';

/** Page title and lede. No kicker above the title: the title carries itself. */
export function PageHeader({ title, lede, children }: { title: string; lede: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="mb-48 flex flex-col gap-16">
      <div className="flex flex-wrap items-start justify-between gap-16">
        <h1 className="page-title text-ink">{title}</h1>
        <CopyPageButton />
      </div>
      <p className="page-lede max-w-[62ch] text-ink2">{lede}</p>
      {children}
    </header>
  );
}

export function Section({ title, lede, children, id }: { title: string; lede?: React.ReactNode; children?: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-64 flex scroll-mt-80 flex-col gap-20">
      <div className="flex flex-col gap-8">
        <h2 className="type-display text-ink">{title}</h2>
        {lede && <p className="prose-body max-w-[66ch] text-ink2">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * A bench: the tray a specimen sits in, with its engraved caption.
 * Tray = well material, r24, content inset 16 (⅔ r).
 */
export function Bench({
  caption,
  children,
  className = '',
  style,
  tone = 'well',
}: {
  caption?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tone?: 'well' | 'page';
}) {
  return (
    <figure className="flex flex-col gap-12">
      <div
        style={style}
        data-md="skip"
        className={[
          'relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-card p-32',
          tone === 'well' ? 'material-well' : 'border border-dashed border-[var(--mu-rule)]',
          className,
        ].join(' ')}
      >
        {children}
      </div>
      {caption && <figcaption className="type-label engraved px-4">{caption}</figcaption>}
    </figure>
  );
}

/** Numbered rules: id readout on the left, statement on the right. */
export function Rules({ rules }: { rules: { id: string; title: string; body: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[56px_1fr] gap-x-16 gap-y-20">
      {rules.map((r) => (
        <React.Fragment key={r.id}>
          <dt className="type-readout pt-2 text-ink2">{r.id}</dt>
          <dd className="flex flex-col gap-4">
            <span className="type-title text-ink">{r.title}</span>
            <span className="prose-body max-w-[64ch] text-ink2">{r.body}</span>
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/** A token table: name, value, use. Values in readout type. */
export function TokenTable({ rows, head = ['Token', 'Value', 'Used for'] }: { rows: React.ReactNode[][]; head?: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="type-label engraved border-b border-[var(--mu-rule)] pb-8 pr-16 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-[var(--mu-rule)] last:border-0">
              {cells.map((c, j) => (
                <td key={j} className={['py-10 pr-16 align-baseline', j === 0 ? 'type-readout whitespace-nowrap text-ink' : j === 1 ? 'type-readout text-ink2' : 'prose-body text-ink2'].join(' ')}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const COPIED_MS = 1400;

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
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
        } catch {}
      }}
    >
      <SwapIcon swapKey={copied ? 'done' : 'idle'}>{copied ? <CheckIcon size={14} /> : <DuplicateIcon size={14} />}</SwapIcon>
      <span aria-live="polite"><SwapText value={copied ? 'Copied' : label} /></span>
    </Button>
  );
}

const COPIED_PAGE_MS = 1600;

/**
 * Copies the whole page as Markdown for coding agents: headings, prose, rules,
 * tables, code and specimen captions, with dial values as currently tuned.
 */
export function CopyPageButton() {
  const { pathname } = useLocation();
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_PAGE_MS);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <Button
      aria-label="Copy this page as Markdown for agents"
      onClick={async () => {
        const main = document.querySelector('main');
        if (!main) return;
        try {
          await navigator.clipboard.writeText(pageMarkdown(main, pathname));
          setCopied(true);
        } catch {}
      }}
    >
      <SwapIcon swapKey={copied ? 'done' : 'idle'}>{copied ? <CheckIcon size={14} /> : <NoteIcon size={14} />}</SwapIcon>
      <span aria-live="polite"><SwapText value={copied ? 'Copied for agents' : 'Copy page'} /></span>
    </Button>
  );
}

export function Code({ code, label }: { code: string; label?: string }) {
  return (
    <div className="material-raised rounded-card p-6">
      <div data-md="skip" className="flex items-center justify-between gap-12 px-10 pb-6 pt-4">
        <span className="type-label engraved">{label ?? 'Code'}</span>
        <CopyButton text={code} />
      </div>
      <pre data-label={label} className="type-code material-well max-h-[440px] overflow-auto rounded-plate p-16 text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Copies the current dial values as JSON; wire to a DialKit action. */
export async function copyJSON(value: unknown) {
  try {
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
  } catch {}
}
