import * as React from 'react';
import { Led, type LedKind } from '@unlocalhosted/metalui';
import { PageHeader, Section } from '../ui/doc';
import changelog from '../../../../packages/metalui/CHANGELOG.md?raw';

/* ─────────────────────────────────────────────────────────
 * CHANGELOG · every release of @unlocalhosted/metalui, read from packages/metalui/CHANGELOG.md
 *
 *   head      what the file promises (versions, and what a 0.x minor may change)
 *   release   one section per version, newest first, anchored (#v0-3-1); each group (Added, Changed,
 *             Fixed, Removed) lists its notes; Unreleased shows only while it holds notes
 * The file is the one source: a release edits it, and this page and the npm tarball both follow.
 * ───────────────────────────────────────────────────────── */

const PACKAGE = '@unlocalhosted/metalui';
const GROUP_LED: Record<string, LedKind> = { Added: 'live', Changed: 'link', Fixed: 'waiting', Removed: 'off' };

interface Release { version: string; date?: string; groups: { name: string; notes: string[] }[]; prose: string[] }

/** The file's "## " sections: a version with an optional date, its "### " groups and their "- " notes. */
export function releases(source: string): Release[] {
  const out: Release[] = [];
  for (const line of source.split('\n')) {
    const head = /^## (Unreleased|\d+\.\d+\.\d+)(?:\s+-\s+(\S+))?\s*$/.exec(line);
    if (head) { out.push({ version: head[1], date: head[2], groups: [], prose: [] }); continue; }
    const current = out[out.length - 1];
    if (!current) continue;
    if (line.startsWith('### ')) current.groups.push({ name: line.slice(4).trim(), notes: [] });
    else if (line.startsWith('- ') && current.groups.length) current.groups[current.groups.length - 1].notes.push(line.slice(2).trim());
    else if (line.trim() && !line.startsWith('#') && !current.groups.length) current.prose.push(line.trim());
  }
  return out;
}

/** Inline markdown in a note: `code`, **bold** and [text](url). */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>;
        if (p.startsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
        if (link) return <a key={i} href={link[2]}>{link[1]}</a>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

const slug = (version: string) => (version === 'Unreleased' ? 'unreleased' : `v${version.replace(/\./g, '-')}`);
const link = 'text-ink underline decoration-rule underline-offset-2 hover:decoration-ink focus-visible:focus-ring';

export default function ChangelogPage() {
  const all = releases(changelog);
  const shown = all.filter((r) => r.version !== 'Unreleased' || r.groups.some((g) => g.notes.length));
  const latest = all.find((r) => r.version !== 'Unreleased');
  return (
    <>
      <PageHeader
        title="Changelog"
        lede={`What changed in each release of ${PACKAGE}. Versions follow Semantic Versioning; while the package is 0.x, a minor version may change behaviour, and every such change is listed under Changed.`}
        tags={latest ? [{ label: `Latest ${latest.version}`, led: 'green', href: `https://www.npmjs.com/package/${PACKAGE}` }] : []}
      />
      {shown.map((r) => (
        <Section
          key={r.version}
          id={slug(r.version)}
          title={r.version}
          lede={r.version === 'Unreleased' ? 'Landed on main, not yet published.' : (
            <>
              {r.date && <>{r.date}{' · '}</>}
              <a className={link} href={`https://www.npmjs.com/package/${PACKAGE}/v/${r.version}`}>npm</a>
              {' · '}
              <a className={link} href={`https://github.com/vijayksingh/metalui/releases/tag/v${r.version}`}>tag</a>
            </>
          )}
        >
          {r.prose.map((p) => <p key={p} className="m-0 max-w-measure type-body text-ink2"><Inline text={p} /></p>)}
          <div className="grid gap-20">
            {r.groups.filter((g) => g.notes.length).map((g) => (
              <div key={g.name} className="grid gap-8">
                <span className="flex items-center gap-8 type-label text-ink3">
                  <Led kind={GROUP_LED[g.name] ?? 'off'} size="small" gesture="steady" />
                  {g.name}
                </span>
                <ul className="m-0 grid max-w-measure grid-cols-1 list-none gap-0 break-words p-0">
                  {g.notes.map((n) => (
                    <li key={n} className="border-t border-rule py-8 type-body text-ink first:border-t-0"><Inline text={n} /></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}
