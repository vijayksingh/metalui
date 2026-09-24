import * as React from 'react';
import { useLocation } from 'react-router';
import { Button, Segmented, SwapText } from '@unlocalhosted/metalui';
import { MorphIcon } from '@unlocalhosted/metalui/icons';
import { pageMarkdown } from '../lib/pageMarkdown';
import { highlight, langOf, type Lang } from '../lib/highlight';

/* ─────────────────────────────────────────────────────────
 * THE PAGE KIT
 *
 *   column     prose on the measure (640); a stage may bleed to the stage width (760)
 *   PageHeader title (type-doc-title) · lede · meta lines (trail, spec)
 *   Section    heading with a hairline to the right edge · optional lede
 *   Stage      a light object sized to its specimen · optional control bar inside its bottom edge
 *              · a small, sentence-case caption centred below
 *   Tag        a small mono chip that names a specimen inside a stage
 *   Code       a quiet code object: file name, optional tabs, copy, highlighted lines
 *   CodeScreen the code-screen (glass face) for the one usage snippet at the top of a page
 *   Table      hairline rows, sentence-case heads
 * ───────────────────────────────────────────────────────── */

/** Page title, lede, and the meta lines under them (layer trail, spec line). */
export function PageHeader({ title, lede, children }: { title: string; lede: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header id="head" className="mb-48 flex scroll-mt-80 flex-col">
      <div className="flex items-start justify-between gap-16">
        <h1 className="type-doc-title text-balance text-ink">{title}</h1>
        <CopyPageButton />
      </div>
      <p className="type-doc-lede mt-8 max-w-measure text-pretty text-ink2">{lede}</p>
      {children && <div className="mt-20 flex flex-col gap-6">{children}</div>}
    </header>
  );
}

/** A section: its heading runs a hairline to the column's edge; the lede sits on the measure. */
export function Section({ title, lede, children, id }: { title: string; lede?: React.ReactNode; children?: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-64 flex scroll-mt-80 flex-col gap-20 first:mt-0">
      <div className="flex flex-col gap-8">
        <h2 className="type-doc-heading flex items-center gap-16 text-ink">
          <span className="shrink-0">{title}</span>
          <span aria-hidden className="h-1 flex-1 bg-rule" />
        </h2>
        {lede && <p className="type-doc-prose max-w-measure text-pretty text-ink2">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

/** Running prose on the measure. */
export function Prose({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`type-doc-prose max-w-measure text-pretty text-ink2 ${className}`}>{children}</p>;
}

/** Inline code in prose and tables. */
export function C({ children }: { children: React.ReactNode }) {
  return <code className="type-doc-code rounded-key bg-s-lo px-4 py-1 text-ink ring-1 ring-rule">{children}</code>;
}

/** A small mono chip naming a specimen inside a stage: "flat fill", "recipe". */
export function Tag({ children, tone = 'quiet' }: { children: React.ReactNode; tone?: 'quiet' | 'lit' }) {
  return (
    <span className={['type-readout inline-flex h-20 items-center rounded-pill px-8 ring-1', tone === 'lit' ? 'bg-s-hi text-ink ring-rule' : 'text-ink3 ring-rule'].join(' ')}>
      {children}
    </span>
  );
}

export interface StageProps {
  /** What to notice, in one sentence. Sentence case; starts with a verb. */
  caption?: React.ReactNode;
  /** One line on what the decision costs; shown under the caption. */
  cost?: React.ReactNode;
  /** Controls in the stage's bottom edge: a Segmented, a Slider, a compact Button. */
  bar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** stage: the light object. dark: the specimen needs a graphite surface (strip caps). */
  tone?: 'stage' | 'dark';
  /** Let the stage run wider than the measure on large screens (default true). */
  bleed?: boolean;
  stageRef?: React.Ref<HTMLDivElement>;
}

/** A light object on the page that holds a specimen. Sized to its content; never a slab. */
export function Stage({ caption, cost, bar, children, className = '', style, tone = 'stage', bleed = true, stageRef }: StageProps) {
  return (
    <figure className={['flex flex-col gap-12', bleed ? 'lg:-mx-60' : ''].join(' ')}>
      <div
        data-md="skip"
        data-mu-colorway={tone === 'dark' ? 'graphite' : undefined}
        className="material-stage overflow-hidden rounded-plate"
      >
        <div ref={stageRef} style={style} className={['relative flex items-center justify-center px-20 py-32 sm:px-40 sm:py-40', className].join(' ')}>
          {children}
        </div>
        {bar && <div className="flex flex-wrap items-center justify-between gap-12 border-t border-rule bg-stage-bar px-12 py-8">{bar}</div>}
      </div>
      {(caption || cost) && (
        <figcaption className="type-doc-caption mx-auto flex max-w-measure flex-col gap-2 px-8 text-center text-balance text-ink3">
          {caption && <span>{caption}</span>}
          {cost && <span><span className="font-medium text-ink2">Cost:</span> {cost}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** The older name, kept so every page takes the new stage. `tone="page"` is the same stage. */
export function Bench({ caption, children, className, style, tone }: { caption?: string; children: React.ReactNode; className?: string; style?: React.CSSProperties; tone?: 'well' | 'page' }) {
  void tone;
  return <Stage caption={caption && sentence(caption)} className={className} style={style}>{children}</Stage>;
}

/** "on a light surface · small in a footer" → "On a light surface, small in a footer." */
function sentence(s: string) {
  const t = s.replace(/\s·\s/g, ', ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? '' : '.');
}

export interface Rule {
  id: string;
  title: string;
  body: React.ReactNode;
  /** Where the rule comes from: "Ours", or "Adapted · <source>". */
  origin?: string;
}

/** Numbered rules: id on the left, statement (and its origin) on the right. */
export function Rules({ rules }: { rules: Rule[] }) {
  return (
    <ol className="flex max-w-measure flex-col">
      {rules.map((r) => (
        <li key={r.id} className="grid grid-cols-[40px_1fr] gap-x-12 border-t border-rule py-14 first:border-t-0 first:pt-0">
          <span className="type-readout pt-4 text-ink3">{r.id}</span>
          <div className="flex flex-col gap-4">
            <span className="type-doc-subheading text-ink">{r.title}</span>
            <span className="type-doc-prose text-pretty text-ink2">{r.body}</span>
            {r.origin && <span className="type-doc-caption text-ink3">{r.origin}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** A reference table: hairline rows, sentence-case heads. `mono` lists the columns set in code. */
export function TokenTable({ rows, head = ['Token', 'Value', 'Used for'], mono = [0, 1] }: { rows: React.ReactNode[][]; head?: string[]; mono?: number[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="type-doc-caption border-b border-rule pb-8 pr-16 font-medium text-ink3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-rule last:border-0">
              {cells.map((c, j) => (
                <td
                  key={j}
                  className={[
                    'py-10 pr-16 align-baseline',
                    !mono.includes(j) ? 'type-doc-caption min-w-160 text-ink2' : j === 0 ? 'type-doc-code whitespace-nowrap text-ink' : 'type-doc-code text-ink2',
                  ].join(' ')}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export const Table = TokenTable;

const COPIED_MS = 1400;

function useCopied(ms: number) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), ms);
    return () => clearTimeout(t);
  }, [copied, ms]);
  return [copied, setCopied] as const;
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useCopied(COPIED_MS);
  return (
    <Button
      size="compact"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {}
      }}
    >
      <MorphIcon name={copied ? 'check' : 'paste'} size={12} />
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
  const [copied, setCopied] = useCopied(COPIED_PAGE_MS);
  return (
    <Button
      size="compact"
      className="mt-4 shrink-0"
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
      <MorphIcon name={copied ? 'check' : 'paste'} size={12} />
      <span aria-live="polite"><SwapText value={copied ? 'Copied' : 'Copy page'} /></span>
    </Button>
  );
}

/** Highlighted lines inside a <pre>. */
function Lines({ code, lang, numbers, className = '' }: { code: string; lang: Lang; numbers?: boolean; className?: string }) {
  const html = React.useMemo(() => highlight(code, lang, numbers), [code, lang, numbers]);
  return <pre className={`twinkleplop overflow-auto ${className}`}><code dangerouslySetInnerHTML={{ __html: html }} /></pre>;
}

/** A quiet code object: a file name (or tabs), a copy button, highlighted lines. */
export function Code({ code, label, lang, head, numbers = false, maxH = true }: { code: string; label?: string; lang?: Lang; head?: React.ReactNode; numbers?: boolean; maxH?: boolean }) {
  return (
    <div className="material-stage overflow-hidden rounded-plate">
      <div data-md="skip" className="flex min-h-40 items-center justify-between gap-12 border-b border-rule py-6 pl-14 pr-6">
        {head ?? <span className="type-readout truncate text-ink3">{label ?? 'Code'}</span>}
        <CopyButton text={code} />
      </div>
      <Lines code={code} lang={lang ?? langOf(label)} numbers={numbers} className={['type-doc-code px-16 py-14', maxH ? 'max-h-440' : ''].join(' ')} />
    </div>
  );
}

/**
 * The code-screen: code behind glass, as the object sheet draws it. Used once per page, for the
 * usage snippet. The screen is always graphite, so its inks are the screen palette in both colorways.
 */
export function CodeScreen({ tabs }: { tabs: { id: string; label: string; file: string; lang: Lang; code: string }[] }) {
  const [tab, setTab] = React.useState(tabs[0].id);
  const current = tabs.find((t) => t.id === tab)!;
  return (
    <div className="recipe-glass-face rounded-glass-face-radius p-glass-face-pad">
      <div data-mu-colorway="graphite" className="recipe-code-card-screen overflow-hidden rounded-glass-face-screen-radius">
        <div data-md="skip" className="flex items-center justify-between gap-12 pb-2 pl-14 pr-6 pt-6">
          <span className="type-label text-syn-punct">{current.file}</span>
          <div className="flex items-center gap-6">
            {tabs.length > 1 && <Segmented size="compact" aria-label="Platform" value={tab} onValueChange={(v) => setTab(v as string)} options={tabs.map((t) => ({ value: t.id, label: t.label }))} />}
            <CopyButton text={current.code} />
          </div>
        </div>
        {tabs.map((t) => (
          <div key={t.id} hidden={t.id !== tab} data-label={t.file}>
            <Lines code={t.code} lang={t.lang} numbers className="type-doc-code px-10 pb-16 pt-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Copies the current dial values as JSON; wire to a DialKit action. */
export async function copyJSON(value: unknown) {
  try {
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
  } catch {}
}

/** A component's source, three ways plus its agent guide, behind the one tab strip allowed. */
export function SourceTabs({ tabs }: { tabs: { id: string; label: string; code: string }[] }) {
  const [tab, setTab] = React.useState(tabs[0].id);
  const code = tabs.find((t) => t.id === tab)!;
  const lang: Lang = code.id === 'css' ? 'css' : code.id === 'swift' ? 'swift' : code.id === 'agent' ? 'md' : 'tsx';
  return (
    <Code
      code={code.code}
      lang={lang}
      numbers
      head={<Segmented size="compact" aria-label="Source" value={tab} onValueChange={(v) => setTab(v as string)} options={tabs.map((t) => ({ value: t.id, label: t.label }))} />}
    />
  );
}
