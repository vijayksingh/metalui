import * as React from 'react';
import { useLocation } from 'react-router';
import { Button, Surface, SwapText, Tabs, TabList, TabPanel } from '@unlocalhosted/metalui';
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

/** The reference page head: engraved kicker, the title, the lede, then status tags and meta lines. */
export function PageHeader({ title, lede, kicker, tags, children }: { title: string; lede: React.ReactNode; kicker?: string; tags?: { label: string; href?: string; led?: 'green' | 'blue' | 'amber' | 'off' }[]; children?: React.ReactNode }) {
  const { pathname } = useLocation();
  const auto = kicker ?? pathname.split('/').filter(Boolean).map((p) => p.replace(/-/g, ' ')).join(' · ');
  return (
    <header id="head" className="page-head">
      <span className="eng">{auto || 'MetalUI · Soft Hardware'}</span>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <h1>{title}</h1>
        <CopyPageButton />
      </div>
      <p>{lede}</p>
      {tags && (
        <div className="status-row">
          {tags.map((t) => {
            const inner = <><span className={['led', t.led && t.led !== 'green' ? t.led : ''].join(' ')} />{t.label}</>;
            return t.href ? <a key={t.label} className="status" href={t.href}>{inner}</a> : <span key={t.label} className="status">{inner}</span>;
          })}
        </div>
      )}
      {children && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>{children}</div>}
    </header>
  );
}

/** The reference section: an h2 with a hover anchor, an optional sub line, then its content. */
export function Section({ title, lede, children, id }: { title: string; lede?: React.ReactNode; children?: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="sec">
      <h2>{id && <a className="anchor" href={`#${id}`} aria-label={`Link to ${title}`}>#</a>}{title}</h2>
      {lede && <p className="sec-sub">{lede}</p>}
      {children}
    </section>
  );
}

/** Running prose. */
export function Prose({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={['lede', className].join(' ')}>{children}</p>;
}

/** Inline code: quiet mono in the running text. */
export function C({ children }: { children: React.ReactNode }) {
  return <code>{children}</code>;
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
  /** Controls in the stage's bottom edge: a Switcher, a Slider, a compact Button. */
  bar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** stage: the light object. dark: the specimen needs a graphite surface (strip caps). */
  tone?: 'stage' | 'dark';
  /** What the specimen sits on: the table (parts, components), a piece of canvas (objects,
   * instruments, places) or, until every page moves over, the old well. */
  on?: 'well' | 'table' | 'canvas';
  /** Let the stage run wider than the measure on large screens (default true). */
  bleed?: boolean;
  stageRef?: React.Ref<HTMLDivElement>;
}

/** The reference stage: specimens sit on the table; the caption is engraved at its foot. */
export function Stage({ caption, cost, bar, children, className = '', style, tone = 'stage', on = 'well', stageRef }: StageProps) {
  return (
    <figure style={{ margin: 0 }}>
      <div
        ref={stageRef}
        data-md="skip"
        data-mu-colorway={tone === 'dark' ? 'graphite' : undefined}
        className={['stage', on === 'well' ? '' : `on-${on}`, className].join(' ')}
        style={{ ...(tone === 'dark' ? { background: 'var(--page)' } : null), ...((caption || cost) ? { paddingBottom: 28, rowGap: 24 } : null), ...style }}
      >
        {children}
        {(caption || cost) && <StageCaption caption={caption} cost={cost} />}
      </div>
      {bar && <div className="status-row" style={{ justifyContent: 'center', margin: '-8px 0 24px' }}>{bar}</div>}
    </figure>
  );
}

/** Short captions are engraved like the reference; a sentence reads as quiet text. Both sit in flow at the stage's foot. */
function StageCaption({ caption, cost }: { caption?: React.ReactNode; cost?: React.ReactNode }) {
  const long = typeof caption === 'string' && caption.length > 64;
  return (
    <div style={{ flexBasis: '100%', textAlign: 'center', marginTop: 4 }}>
      {caption && (long ? <span className="t-body ink2" style={{ display: 'block', maxWidth: 620, margin: '0 auto' }}>{caption}</span> : <span className="eng">{caption}</span>)}
      {cost && <span className="t-meta ink3" style={{ display: 'block', marginTop: 6 }}><b style={{ fontWeight: 500 }}>Cost:</b> {cost}</span>}
    </div>
  );
}

/**
 * A quiet stand-in for what a control sits on: a card, a strip. A control never floats alone and never
 * lives in a place, so its demo puts it on a host: the lightest raised plate (raise-lite) with faint
 * lines for the content it stands for, and the control where it would really be (a card's corner).
 * Give it children to show real content instead of lines.
 */
export function Host({ action, lines = 2, children, width = 300, className = '' }: { action?: React.ReactNode; lines?: number; children?: React.ReactNode; width?: number; className?: string }) {
  return (
    <Surface material="raise-lite" radius="card" className={`host flex max-w-full flex-col gap-12 px-18 py-16 ${className}`} style={{ width: children ? undefined : width }}>
      {(action || !children) && (
        <div className="flex min-h-32 items-center justify-between gap-12">
          <span aria-hidden className="host-line" style={{ width: '42%' }} />
          {action}
        </div>
      )}
      {children ?? Array.from({ length: lines }, (_, i) => <span key={i} aria-hidden className="host-line" style={{ width: i === lines - 1 ? '64%' : '100%' }} />)}
    </Surface>
  );
}

/** The older name, kept so every page takes the stage. */
export function Bench({ caption, children, className, style, on }: { caption?: string; children: React.ReactNode; className?: string; style?: React.CSSProperties; tone?: 'well' | 'page'; on?: StageProps['on'] }) {
  return <Stage caption={caption} className={className} style={style} on={on}>{children}</Stage>;
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
    <div className="table-wrap">
      <table className="tok-table">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i}>{cells.map((c, j) => <td key={j}>{mono.includes(j) && typeof c === 'string' ? <code>{c}</code> : c}</td>)}</tr>
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
export function Code({ code, label, lang, head, numbers = false, maxH = true, wrap }: { code: string; label?: string; lang?: Lang; head?: React.ReactNode; numbers?: boolean; maxH?: boolean; wrap?: (lines: React.ReactNode) => React.ReactNode }) {
  const lines = <Lines code={code} lang={lang ?? langOf(label)} numbers={numbers} className={['type-doc-code px-16 py-14', maxH ? 'max-h-440' : ''].join(' ')} />;
  return (
    <div className="material-stage overflow-hidden rounded-plate">
      <div data-md="skip" className="flex min-h-40 items-center justify-between gap-12 border-b border-rule py-6 pl-14 pr-6">
        {head ?? <span className="type-readout truncate text-ink3">{label ?? 'Code'}</span>}
        <CopyButton text={code} />
      </div>
      {wrap ? wrap(lines) : lines}
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
    <div className="code-screen">
      <div className="code-bar" data-md="skip">
        <span className="eng">{current.file}</span>
        {tabs.length > 1 && (
          <div className="seg sm" role="radiogroup" aria-label="Platform" style={{ background: 'rgba(255,255,255,.06)', boxShadow: 'none' }}>
            {tabs.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={t.id === tab} onClick={() => setTab(t.id)} style={{ color: t.id === tab ? '#fff' : 'rgba(255,255,255,.55)' }}>{t.label}</button>
            ))}
          </div>
        )}
        <CopyButton text={current.code} />
      </div>
      {tabs.map((t) => (
        <pre key={t.id} hidden={t.id !== tab} data-label={t.file} data-mu-colorway="graphite" style={{ paddingTop: 44 }}>
          <Lines code={t.code} lang={t.lang} numbers />
        </pre>
      ))}
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
    <Tabs value={tab} onValueChange={setTab}>
      <Code
        code={code.code}
        lang={lang}
        numbers
        head={<TabList size="compact" aria-label="Source" items={tabs.map((t) => ({ value: t.id, label: t.label }))} />}
        wrap={(lines) => tabs.map((t) => <TabPanel key={t.id} value={t.id}>{t.id === tab ? lines : null}</TabPanel>)}
      />
    </Tabs>
  );
}
