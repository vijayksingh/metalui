// Turns a rendered docs page into Markdown an agent can read.
// It reads the live DOM, so tuned dial values are copied as currently shown.
// Visual specimens are summarised by their caption; controls are skipped.

const ORIGIN = 'https://metalui.dev';
// Elements that make their parent a container to walk rather than one line of text.
const BLOCKS = 'h1,h2,h3,p,pre,table,dl,ul,ol,figcaption,[data-md]';

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

/** innerText follows layout but also CSS text-transform; restore the source casing. */
function sourceCase(el: Element, visible: string) {
  const src = clean(el.textContent ?? '');
  const at = src.toLowerCase().indexOf(visible.toLowerCase());
  return at >= 0 ? src.slice(at, at + visible.length) : visible;
}
const visibleLines = (el: Element) =>
  ((el as HTMLElement).innerText ?? el.textContent ?? '').split('\n').map(clean).filter(Boolean);
const inner = (el: Element) => sourceCase(el, visibleLines(el).join(' '));
/** A leaf's visible lines joined as one line: "label · value · note". */
const line = (el: Element) => visibleLines(el).map((l) => sourceCase(el, l)).join(' · ');

function table(el: HTMLTableElement) {
  const rows = [...el.rows].map((r) => [...r.cells].map((c) => inner(c).replace(/\|/g, '\\|')));
  if (!rows.length) return '';
  const [head, ...body] = rows;
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...body.map((r) => `| ${r.join(' | ')} |`)].join('\n');
}

function rules(el: Element) {
  const out: string[] = [];
  const kids = [...el.children];
  for (let i = 0; i < kids.length; i += 2) {
    const [dt, dd] = [kids[i], kids[i + 1]];
    if (!dd) break;
    const [title, body, origin] = [...dd.children];
    out.push(`- **${inner(dt)} · ${title ? inner(title) : ''}**${body ? `: ${inner(body)}` : ''}${origin ? ` _(${inner(origin)})_` : ''}`);
  }
  return out.join('\n');
}

function list(el: Element) {
  return [...el.children]
    .map((li) => {
      const a = li.querySelector('a');
      const parts = visibleLines(li).map((l) => sourceCase(li, l));
      if (!a) return `- ${parts.join(' · ')}`;
      const href = new URL(a.getAttribute('href') ?? '/', ORIGIN).toString();
      const [first, ...rest] = parts;
      return `- [${first}](${href})${rest.length ? `: ${rest.join(' · ')}` : ''}`;
    })
    .join('\n');
}

function walk(el: Element, out: string[]) {
  const node = el as HTMLElement;
  if (node.getAttribute('aria-hidden') === 'true' || node.dataset.md === 'skip') return;
  // An explicit row (a type role, an ink, a glyph) is one list item, even if it is a button.
  if (node.dataset.md === 'row') {
    const text = line(el);
    if (text) out.push(`- ${text}`);
    return;
  }
  switch (el.tagName) {
    case 'BUTTON':
    case 'svg':
    case 'SVG':
    case 'INPUT':
      return;
    case 'H1': out.push(`# ${inner(el)}`); return;
    case 'H2': out.push(`## ${inner(el)}`); return;
    case 'H3': out.push(`### ${inner(el)}`); return;
    case 'P': out.push(inner(el)); return;
    case 'PRE': {
      const label = node.dataset.label;
      out.push((label ? `**${label}**\n\n` : '') + '```\n' + (el.textContent ?? '').trimEnd() + '\n```');
      return;
    }
    case 'TABLE': out.push(table(el as HTMLTableElement)); return;
    case 'DL': out.push(rules(el)); return;
    case 'UL':
    case 'OL': out.push(list(el)); return;
    case 'FIGCAPTION': out.push(`> Specimen: ${inner(el)}`); return;
  }
  // A container of blocks is walked; a leaf row of inline text becomes one line.
  if (el.querySelector(BLOCKS)) {
    for (const child of el.children) walk(child, out);
  } else {
    const text = line(el);
    if (text) out.push(`- ${text}`);
  }
}

export function pageMarkdown(root: Element, path: string) {
  const out: string[] = [];
  for (const child of root.children) walk(child, out);
  const [title, ...rest] = out;
  const source = `${ORIGIN}${path}`;
  return [
    title,
    '',
    `Source: ${source} (MetalUI docs). Values reflect the current dial settings. Full agent guide: ${ORIGIN}/AI.md`,
    '',
    rest
      .filter(Boolean)
      .join('\n\n')
      // Consecutive list items read as one list.
      .replace(/^(- .*)\n\n(?=- )/gm, '$1\n'),
  ].join('\n') + '\n';
}
