import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { BEZEL, linkCardLook, type LinkCardConfig } from './LinkCardXray';
import { HOSTS, hostOf } from './LinkCardSpecimens';

/* ─────────────────────────────────────────────────────────
 * X-RAY · LINK CARD · THE CODE
 *
 *   The code for exactly the config in the x-ray. The link (and the page's preview, when it has
 *   one) are props. Everything you tune reaches the card the way the library supports from a
 *   host: its --mu-r-glass-face-* and --mu-r-link-card-* variables, and only the ones that differ
 *   from the recipe. They are set on the card itself, because the card sets its own screen
 *   background on itself (the [data-mu-self] rule, written in its tint):
 *     - sizes, spacing and type go inline, through `style` (one value in every colorway);
 *     - colours (the glass fill, the shadow and glare stacks, the screen without its glow, and
 *       the tint of a site other than the first) differ per colorway, so they go in a stylesheet
 *       with one block each, on a selector that outranks the library's.
 *   At defaults the snippet is the agent guide's example. SwiftUI takes the link, the preview's
 *   title and the site's tint (by the library's own hue function), and says so when the rest
 *   is the recipe's.
 * ───────────────────────────────────────────────────────── */

// LinkCardXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
const CLASS = 'brand-link-card';
const SHEET = 'brand-link-card.css';
/** The variables that hold colours: a stylesheet carries them, one block per colorway. */
const coloured = (name: string) => /-(background|shadow)$|^--mu-self$/.test(name);
/** A stack one layer to a line, so a long shadow reads. */
const layers = (v: string) => v.split(/,\s*(?![^(]*\))/);

/** What a config sets, split by where it belongs: inline (one value everywhere) or in the stylesheet. */
function overrides(m: LinkCardConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, linkCardLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

/** The values the colours were derived from, for the one line that says where they came from. */
function derivedFrom(m: LinkCardConfig) {
  const parts: string[] = [];
  const host = hostOf(m.href);
  if (host !== HOSTS[0]) parts.push(`${host}'s tint (hsl of its name, as the reference does)`);
  const off = BEZEL.filter((_, i) => !m.bezel[i]).map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`frame ${off.join(', ')} off`);
  if (!m.glare || !m.screen[1]) parts.push('glare off');
  if (!m.screen[2]) parts.push('shade off');
  if (!m.screen[0]) parts.push('glow off');
  return parts.join('; ');
}

/** The React code for a config. */
export function linkCardReact(m: LinkCardConfig) {
  const { inline, sheet } = overrides(m);
  const lines: string[] = [];
  if (inline.length) lines.push(`import type { CSSProperties } from 'react';`);
  lines.push(`import { LinkCard } from '@unlocalhosted/metalui';`);
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('', 'export function BrandLinkCard() {');
  const props = [`href=${JSON.stringify(m.href)}`];
  if (m.preview) props.push(`preview={${JSON.stringify(m.preview)}}`);
  if (!inline.length && !sheet.length) lines.push(`  return <LinkCard ${props.join(' ')} />;`);
  else {
    lines.push('  return (', '    // the card sets its own screen on itself, so the variables it reads go on the card, not a wrapper');
    if (sheet.length) lines.push(`    // its colours differ by colorway, so they are in ${SHEET}`);
    lines.push('    <LinkCard');
    if (sheet.length) lines.push(`      className="${CLASS}"`);
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

/** The stylesheet for a config: its colours, a block per colorway, on a selector that outranks the library's own. */
export function linkCardCss(m: LinkCardConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const out = [`/* the card's colours for ${derived || 'its config'}, one block per colorway; the library sets its screen on the card itself, so this selector outranks its [data-mu-self] */`];
  const same = COLORWAYS.every((c) => sheet.every((n) => by[c][n] === by[COLORWAYS[0]][n]));
  const on = `.${CLASS}[data-mu-self]`;
  for (const c of same ? [COLORWAYS[0]] : COLORWAYS) {
    out.push(same ? `:root ${on} {` : c === COLORWAYS[0] ? `:root ${on}, [data-mu-colorway="${c}"] ${on} {` : `[data-mu-colorway="${c}"] ${on} {`);
    for (const n of sheet) {
      const parts = layers(by[c][n]);
      if (parts.length === 1) out.push(`  ${n}: ${parts[0]};`);
      else out.push(`  ${n}:`, ...parts.map((p, i) => `    ${p}${i === parts.length - 1 ? ';' : ','}`));
    }
    out.push('}');
  }
  out.push('');
  return out.join('\n');
}

/** The SwiftUI code for a config: the link, the preview's title, and the site's tint. The rest is the recipe's. */
export function linkCardSwift(m: LinkCardConfig) {
  const host = hostOf(m.href);
  const tinted = host !== HOSTS[0];
  const tuned = Object.keys(linkCardLook(m, COLORWAYS[0]).style).filter((n) => n !== '--mu-self').length > 0;
  const args = [`url: ${JSON.stringify(m.href)}`];
  if (tinted) args.push(`hue: MetalLinkCard.hue(for: ${JSON.stringify(host)}, colorway: colorway == .graphite ? .graphite : .bone)`);
  const title = m.preview?.title?.trim();
  if (title) args.push(`preview: MetalLinkPreview(title: ${JSON.stringify(title)})`);
  const lines = ['import SwiftUI', 'import MetalUI', '', 'struct BrandLinkCard: View {'];
  if (tinted) lines.push('    @Environment(\\.metalColorway) private var colorway', '');
  lines.push('    var body: some View {');
  if (tuned) lines.push('        // MetalLinkCard draws from the recipe: the frame, screen, type and tag spacing tuned here are not per-instance props in SwiftUI');
  if (title && (m.preview?.image || m.preview?.icon)) lines.push('        // the preview\'s image and icon are SwiftUI Images your app loads: add image: and icon: to MetalLinkPreview');
  if (args.length === 1) lines.push(`        MetalLinkCard(${args[0]})`);
  else lines.push('        MetalLinkCard(', ...args.map((a, i) => `            ${a}${i === args.length - 1 ? '' : ','}`), '        )');
  lines.push('    }', '}', '');
  return lines.join('\n');
}

export function LinkCardCodePanel({ config }: { config: LinkCardConfig }) {
  const tabs = React.useMemo(() => {
    const css = linkCardCss(config);
    return [
      { id: 'react', label: 'React', code: linkCardReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: linkCardSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
