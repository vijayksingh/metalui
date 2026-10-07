import * as React from 'react';
import type { FolderPeek } from '@unlocalhosted/metalui';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, LAYERS, folderLook, type FolderConfig } from './FolderXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · FOLDER · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props: the name, the count, what
 *   it holds (its peeks, a const above the component, one block to a line) and its paper (hue, when
 *   not the neutral sheet). Everything you tune reaches the folder the way the library supports from
 *   a host: its --mu-r-folder-* variables, set on the folder itself through `style`, and only the
 *   ones that differ from the recipe. A layer off is the recipe value that leaves it out (a clear
 *   shade ink, no frost, a tint that lets everything through). Every one of these is one value in
 *   both colorways, so the snippet carries no stylesheet; should a value ever differ by colorway,
 *   it goes to a CSS tab with one block each, scoped like tokens.css. At defaults the snippet is the
 *   agent guide's example.
 *   SwiftUI: the Swift package has no MetalFolder yet (folder.agent.md says so), so that tab says
 *   so and emits no code the library does not support.
 * ───────────────────────────────────────────────────────── */

// FolderXray imports this file back, so its constants are read only inside the functions
const COMPONENT = 'PosterRefs';
const CLASS = 'poster-refs';
const SHEET = `${CLASS}.css`;
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;

/** What a config sets, split by where it belongs: inline (one value in every colorway) or in the stylesheet. */
function overrides(m: FolderConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, folderLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const same = (n: string) => COLORWAYS.every((c) => by[c][n] === by[COLORWAYS[0]][n]);
  const inline = names.filter(same).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter((n) => !same(n));
  return { inline, sheet, by };
}

/** One block, as a line of the peeks const: only the keys it has. */
function peekLine(p: FolderPeek) {
  const keys: string[] = [];
  if (p.id !== undefined) keys.push(`id: ${q(p.id)}`);
  if (p.thumb !== undefined) keys.push(`thumb: ${q(p.thumb)}`);
  if (p.link) keys.push('link: true');
  return `  { ${keys.join(', ')} },`;
}

/** The React code for a config. */
export function folderReact(m: FolderConfig) {
  const { inline, sheet } = overrides(m);
  const styled = inline.length > 0 || sheet.length > 0;
  const lines: string[] = [];
  if (inline.length) lines.push(`import type { CSSProperties } from 'react';`);
  lines.push(m.peeks.length ? `import { Folder, type FolderPeek } from '@unlocalhosted/metalui';` : `import { Folder } from '@unlocalhosted/metalui';`);
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('');
  if (m.peeks.length) {
    lines.push('/** What it holds, front last: up to six peek out as cards. */', 'const PEEKS: FolderPeek[] = [', ...m.peeks.map(peekLine), '];', '');
  }
  const props = [`name=${JSON.stringify(m.name)}`, `count={${m.count}}`];
  if (m.peeks.length) props.push('peeks={PEEKS}');
  if (m.hue !== INITIAL.hue) props.push(`hue="${m.hue}"`);
  if (sheet.length) props.push(`className="${CLASS}"`);
  lines.push(`export function ${COMPONENT}() {`);
  if (!styled) lines.push(`  return <Folder ${props.join(' ')} />;`);
  else {
    lines.push('  return (', '    // the recipe variables it reads go on the folder itself');
    if (sheet.length) lines.push(`    // the values that differ by colorway are in ${SHEET}`);
    lines.push('    <Folder');
    props.forEach((p) => lines.push(`      ${p}`));
    if (inline.length) {
      lines.push('      style={{');
      inline.forEach(([k, v]) => lines.push(`        ${q(k)}: ${q(v)},`));
      lines.push('      } as CSSProperties}');
    }
    lines.push('    />', '  );');
  }
  lines.push('}', '');
  return lines.join('\n');
}

/** The values a config was derived from, for the one line that says where they came from. */
function derivedFrom(m: FolderConfig) {
  const off = LAYERS.filter((_, i) => !m.on[i]).map((l) => l.name.toLowerCase());
  return off.length ? `${off.join(', ')} off` : 'its config';
}

/** The stylesheet for a config: only values that differ by colorway, one block each, scoped like tokens.css. */
export function folderCss(m: FolderConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const out = [`/* the folder's recipe values for ${derivedFrom(m)}, one block per colorway */`];
  for (const c of COLORWAYS) {
    out.push(c === COLORWAYS[0] ? `:root .${CLASS}, [data-mu-colorway="${c}"] .${CLASS} {` : `[data-mu-colorway="${c}"] .${CLASS} {`);
    sheet.forEach((n) => out.push(`  ${n}: ${by[c][n]};`));
    out.push('}');
  }
  out.push('');
  return out.join('\n');
}

/** The SwiftUI tab: there is no MetalFolder yet, and this says so instead of inventing one. */
export function folderSwift(m: FolderConfig) {
  const tuned = Object.keys(folderLook(m, COLORWAYS[0]).style).length > 0;
  const lines = [
    '// MetalFolder is not in the Swift package yet: the folder ships in React only (folder.agent.md).',
    `// When it lands it takes the same real props as React: name ${JSON.stringify(m.name)}, count ${m.count}${m.peeks.length ? `, ${m.peeks.length} peeks` : ''}${m.hue !== INITIAL.hue ? `, hue .${m.hue}` : ''}.`,
  ];
  if (tuned) lines.push('// The flap, fan, frost and layers tuned here are recipe values, not per-instance props in SwiftUI.');
  lines.push('');
  return lines.join('\n');
}

export function FolderCodePanel({ config }: { config: FolderConfig }) {
  const tabs = React.useMemo(() => {
    const css = folderCss(config);
    return [
      { id: 'react', label: 'React', code: folderReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: folderSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
