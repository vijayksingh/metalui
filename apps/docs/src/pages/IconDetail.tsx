import * as React from 'react';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { useDialKit } from 'dialkit';
import { Icon, ICON_CATALOG } from '@unlocalhosted/metalui/icons';
import { LifeIcon, LIFE_CATALOG } from '@unlocalhosted/metalui/icons/life';
import { ICON_PAGES } from '../app/icon-pages';
import { Bench, Code, CopyButton, PageHeader, Rules, Section, TokenTable } from '../ui/doc';
import './library.css';

export function loader({ params, request }: LoaderFunctionArgs) {
  const icon = ICON_PAGES.find(icon => icon.to === new URL(request.url).pathname.replace(/\/$/, ''));
  if (!icon || icon.name !== params.name) throw new Response('Icon not found', { status: 404, statusText: 'Icon not found' });
  return { icon, pageTitle: icon.label };
}

export default function IconDetail() {
  const { icon } = useLoaderData<typeof loader>();
  const d = useDialKit('Icon specimen', { size: [120, 48, 200, 4], animate: true, tints: true });
  const [svg, setSvg] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const svgPath = `/icons/${icon.kind === 'life' ? 'life/' : ''}svg/${icon.name}.svg`;
  React.useEffect(() => {
    const abort = new AbortController();
    setSvg('');
    fetch(svgPath, { signal: abort.signal }).then(response => { if (!response.ok) throw new Error('SVG unavailable'); return response.text(); }).then(setSvg).catch(() => {});
    return () => abort.abort();
  }, [svgPath]);
  const component = `${icon.kind === 'life' ? 'Life' : ''}${icon.name.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('')}Icon`;
  const symbol = icon.name.replace(/-(\w)/g, (_, char: string) => char.toUpperCase());
  const jsx = `import { ${component} } from '@unlocalhosted/metalui/icons${icon.kind === 'life' ? '/life' : ''}';\nimport '@unlocalhosted/metalui/icons${icon.kind === 'life' ? '/life' : ''}.css';\n\n<${component} size={16} />`;
  const swift = `${icon.kind === 'life' ? 'MetalLifeIcon' : 'MetalIcon'}(.${symbol}, size: 16)`;
  const draw = (size: number, title?: string) => icon.kind === 'life' ? <LifeIcon name={icon.name} size={size} title={title} animate={d.animate} tint={d.tints ? undefined : false} /> : <Icon name={icon.name} size={size} title={title} animate={d.animate} />;
  const record = icon.kind === 'life' ? LIFE_CATALOG[icon.name] : ICON_CATALOG[icon.name];
  return <>
    <PageHeader title={icon.label} lede={icon.description} />
    <Section title="Specimen" lede="Hover or focus the specimen to play its motion. Open the dial panel to adjust size and motion.">
      <Bench caption={`${icon.name} · master and tuned cuts`}>
        <div className="mu-stack gap-mu-group items-center text-icon">
          <div className="mu-icon-trigger icon-detail-specimen" data-hover={focused || undefined} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} tabIndex={0} aria-label={`${icon.label} motion preview`} role="img">{draw(d.size, icon.label)}</div>
          <div className="mu-cluster gap-mu-group">{[12, 14, 16, 24, 32].map(size => <div key={size} className="mu-stack gap-mu-related items-center"><span aria-hidden="true">{draw(size)}</span><span className="type-doc-caption text-ink2">{size}px</span></div>)}</div>
        </div>
      </Bench>
    </Section>
    <Section title="Use this icon">
      <div className="mu-cluster gap-mu-related"><CopyButton text={icon.name} label="Copy name" />{svg && <CopyButton text={svg} label="Copy SVG" />}<a href={svgPath} download className="type-ui text-ink">Download SVG</a><a href={`/icons/${icon.kind === 'life' ? 'life/' : ''}svg/16/${icon.name}.svg`} download className="type-ui text-ink">Download 16px cut</a>{icon.kind === 'product' && <a href={`/icons/svg-animated/${icon.name}.svg`} download className="type-ui text-ink">Animated SVG</a>}</div>
      <Code label="React" code={jsx} /><Code label="SwiftUI" code={swift} />
    </Section>
    <Section title="Anatomy & motion"><TokenTable head={['Property', 'Value']} mono={[0]} rows={[
      ['Set', icon.kind === 'life' ? 'Life' : 'Product'], ['Category', icon.category], ['Hover', record.hover],
      ['Duration', `${icon.kind === 'life' ? LIFE_CATALOG[icon.name].hoverMs : ICON_CATALOG[icon.name].pressMs} ms`],
      ['SF Symbol', `mu.${icon.kind === 'life' ? 'life.' : ''}${icon.name} · mu.${icon.kind === 'life' ? 'life.' : ''}${icon.name}.16`],
      ...(icon.kind === 'life' ? [['Synonyms', LIFE_CATALOG[icon.name].synonyms.join(', ')], ['Tint', LIFE_CATALOG[icon.name].tint ?? 'Ink']] : [['Press', ICON_CATALOG[icon.name].press]]),
    ]} /></Section>
    <Section title="Accessibility"><Rules rules={[
      { id: 'I1', title: 'Label the control', body: 'Icons are decorative by default. Give the button or link an accessible name; use title when the glyph itself carries information.' },
      { id: 'I2', title: 'Reduced motion stays still', body: 'The authored shape remains complete when motion is reduced. Animation never carries the only explanation of a state.' },
    ]} /></Section>
  </>;
}
