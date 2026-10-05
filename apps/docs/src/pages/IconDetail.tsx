import * as React from 'react';
import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { useDialKit } from 'dialkit';
import { Button, useReducedMotion } from '@unlocalhosted/metalui';
import { Icon, ICON_CATALOG } from '@unlocalhosted/metalui/icons';
import { LifeIcon, LIFE_CATALOG } from '@unlocalhosted/metalui/icons/life';
import { ICON_PAGES } from '../app/icon-pages';
import { Code, CopyButton, PageHeader, Rules, Section } from '../ui/doc';
import { IconTray } from '../ui/IconCell';
import './library.css';
import './icon-detail.css';

/* ─────────────────────────────────────────────────────────
 * A GLYPH'S PAGE
 *
 *   hero      the master glyph on a stage (the stage is its trigger: hover plays the act)
 *             · Play motion replays it on demand · beside it, everything needed to use it
 *   sizes     the cuts from 12 to 48; ≤16 draws the tuned cut
 *   motion    the act in words, its stages and its length
 *   code      React and SwiftUI
 *   more      the rest of its category in the library's tray, then previous and next
 * Reduced motion: the stage stays still and Play says why it is off.
 * ───────────────────────────────────────────────────────── */

const CUTS = [12, 14, 16, 20, 24, 32, 48];
const sentence = (text: string) => { const t = text.trim(); return `${t[0].toUpperCase()}${t.slice(1)}${/[.!?]$/.test(t) ? '' : '.'}`; };

export function loader({ params, request }: LoaderFunctionArgs) {
  const icon = ICON_PAGES.find(icon => icon.to === new URL(request.url).pathname);
  if (!icon || icon.name !== params.name) throw new Response('Icon not found', { status: 404, statusText: 'Icon not found' });
  return { icon, pageTitle: icon.label };
}

export default function IconDetail() {
  const { icon } = useLoaderData<typeof loader>();
  const d = useDialKit('Icon specimen', { size: [128, 48, 200, 4], animate: true, tints: true });
  const life = icon.kind === 'life';
  const reduced = useReducedMotion();
  const stage = React.useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState('');
  const svgPath = `/icons/${life ? 'life/' : ''}svg/${icon.name}.svg`;
  React.useEffect(() => {
    const abort = new AbortController();
    setSvg('');
    fetch(svgPath, { signal: abort.signal }).then(response => { if (!response.ok) throw new Error('SVG unavailable'); return response.text(); }).then(setSvg).catch(() => {});
    return () => abort.abort();
  }, [svgPath]);

  const product = life ? undefined : ICON_CATALOG[icon.name as keyof typeof ICON_CATALOG];
  const record = life ? LIFE_CATALOG[icon.name as keyof typeof LIFE_CATALOG] : undefined;
  const act = product && 'motion' in product ? product.motion as { duration: number; caption: string; stages: string[] } : undefined;
  const duration = record ? record.hoverMs : act?.duration ?? product!.pressMs;
  const component = `${life ? 'Life' : ''}${icon.name.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('')}Icon`;
  const symbol = icon.name.replace(/-(\w)/g, (_, char: string) => char.toUpperCase());
  const jsx = `import { ${component} } from '@unlocalhosted/metalui/icons${life ? '/life' : ''}';\nimport '@unlocalhosted/metalui/icons${life ? '/life' : ''}.css';\n\n<${component} size={16} />`;
  const swift = `${life ? 'MetalLifeIcon' : 'MetalIcon'}(.${symbol}, size: 16)`;
  const draw = (size: number, title?: string) => life ? <LifeIcon name={icon.name} size={size} title={title} animate={d.animate} tint={d.tints ? undefined : false} /> : <Icon name={icon.name} size={size} title={title} animate={d.animate} />;

  const siblings = ICON_PAGES.filter(other => other.kind === icon.kind && other.category === icon.category);
  const at = siblings.findIndex(other => other.to === icon.to);
  const previous = siblings[(at - 1 + siblings.length) % siblings.length];
  const next = siblings[(at + 1) % siblings.length];
  const index = life ? '/icons/life' : '/icons';

  // A product act starts from the click reaching the stage; a life glyph plays while its host is hovered.
  const hold = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  function play() {
    if (!life || !stage.current) return;
    clearTimeout(hold.current);
    stage.current.removeAttribute('data-hover');
    void stage.current.offsetWidth; // restart an animation that is mid-play
    stage.current.setAttribute('data-hover', '');
    hold.current = setTimeout(() => stage.current?.removeAttribute('data-hover'), duration + 400);
  }
  React.useEffect(() => () => clearTimeout(hold.current), []);

  return <div className="icon-page">
    <PageHeader title={icon.label} kicker={`Icons · ${life ? 'Life' : 'Product'} · ${icon.category}`} lede={act ? act.caption : `${life ? 'A life glyph' : 'A product glyph'} for ${icon.category.toLowerCase()}. ${sentence(icon.description)}`} />

    <div className="icon-hero">
      <div className="icon-hero-stage mu-stack gap-mu-related">
        <div ref={stage} className="mu-icon-trigger icon-detail-stage">
          <div className="icon-detail-specimen text-icon">{draw(d.size, icon.label)}</div>
          <div className="icon-detail-play mu-cluster gap-mu-related">
            <Button size="compact" icon={<Icon name="play" />} onClick={play} disabled={reduced || !d.animate}>Play motion</Button>
            <span className="type-doc-caption text-ink2">{reduced ? 'Motion is off' : `${duration} ms · or hover the glyph`}</span>
          </div>
        </div>
      </div>
      <aside className="icon-hero-use mu-stack gap-mu-group" aria-label="Use this icon">
        <div className="mu-cluster gap-mu-related">
          <CopyButton text={icon.name} label="Copy name" />
          {svg && <CopyButton text={svg} label="Copy SVG" />}
        </div>
        <div className="mu-cluster gap-mu-related">
          <Button size="compact" icon={<Icon name="download" />} nativeButton={false} role="link" render={<a href={svgPath} download />}>Download SVG</Button>
          <Button size="compact" icon={<Icon name="download" />} nativeButton={false} role="link" render={<a href={`/icons/${life ? 'life/' : ''}svg/16/${icon.name}.svg`} download />}>Download 16px cut</Button>
          {!life && <Button size="compact" icon={<Icon name="download" />} nativeButton={false} role="link" render={<a href={`/icons/svg-animated/${icon.name}.svg`} download />}>Animated SVG</Button>}
        </div>
        <dl className="icon-facts">
          <div><dt>Name</dt><dd><code>{icon.name}</code></dd></div>
          <div><dt>Set</dt><dd><Link to={index}>{life ? 'Life icons' : 'Product icons'}</Link></dd></div>
          <div><dt>Category</dt><dd>{icon.category}</dd></div>
          <div><dt>Motion</dt><dd>{duration} ms{act ? `, ${act.stages.length} stages` : ''}</dd></div>
          <div><dt>SF Symbol</dt><dd><code>mu.{life ? 'life.' : ''}{icon.name}</code></dd></div>
          {record?.tint && <div><dt>Tint</dt><dd>{record.tint}</dd></div>}
          {record && record.synonyms.length > 1 && <div className="icon-facts-wide"><dt>Also found by</dt><dd className="icon-synonyms">{record.synonyms.filter(word => word !== icon.name).map(word => <span key={word}>{word}</span>)}</dd></div>}
        </dl>
      </aside>
    </div>

    <Section id="sizes" title="Sizes" lede="The master is drawn on a 24 grid. At 16 px and below the glyph switches to its tuned cut: simpler geometry and a heavier stroke, so it stays crisp.">
      <div className="icon-cuts" aria-label="Size cuts" role="group">
        {CUTS.map(size => <div key={size} className="icon-cut mu-icon-trigger" data-tuned={size <= 16 || undefined}>
          <span className="icon-cut-glyph text-icon" aria-hidden="true">{draw(size)}</span>
          <span className="type-doc-caption text-ink2">{size}{size <= 16 ? ' · tuned' : ''}</span>
        </div>)}
      </div>
    </Section>

    <Section id="motion" title="Motion" lede={act ? 'One act per trigger: hover, keyboard focus, or a press of the control it sits in. It always finishes at rest.' : 'A life glyph moves while its host is hovered: a row, a block, a day. Poses settle back when the pointer leaves.'}>
      {act
        ? <ol className="icon-stages">{act.stages.map((stage, i) => <li key={stage}><span className="type-readout text-ink3">{String(i + 1).padStart(2, '0')}</span>{stage}</li>)}</ol>
        : <p className="type-doc-prose text-ink2 m-0">{sentence(icon.description)} {duration} ms.</p>}
    </Section>

    <Section id="code" title="Code">
      <div className="mu-stack gap-mu-related"><Code label="React" code={jsx} /><Code label="SwiftUI" code={swift} /></div>
    </Section>

    <Section id="accessibility" title="Accessibility"><Rules rules={[
      { id: 'I1', title: 'Label the control', body: 'Icons are decorative by default. Give the button or link an accessible name; use title when the glyph itself carries information.' },
      { id: 'I2', title: 'Reduced motion stays still', body: 'The authored shape remains complete when motion is reduced. Animation never carries the only explanation of a state.' },
    ]} /></Section>

    {siblings.length > 1 && <Section id="more" title={`More in ${icon.category}`}>
      <IconTray icons={siblings.filter(other => other.to !== icon.to)} label={`More in ${icon.category}`} state={{ iconIndex: index }} />
      <nav className="icon-pager mu-cluster gap-mu-group" aria-label="Neighbouring glyphs">
        <Link to={previous.to} viewTransition rel="prev"><Icon name="chevron" turn={90} size={12} animate={false} /><span><span className="type-doc-caption text-ink2">Previous</span>{previous.label}</span></Link>
        <Link to={next.to} viewTransition rel="next"><span><span className="type-doc-caption text-ink2">Next</span>{next.label}</span><Icon name="chevron" turn={270} size={12} animate={false} /></Link>
      </nav>
    </Section>}
  </div>;
}
