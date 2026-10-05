import * as React from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router';
import { Field } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { LifeIcon } from '@unlocalhosted/metalui/icons/life';
import { ICON_PAGES } from '../app/icon-pages';
import { useCatalogTransition } from '../app/catalog-transition';
import './library.css';

function IconEntry({ icon, search, index }: { icon: typeof ICON_PAGES[number]; search: string; index: string }) {
  const card = React.useRef<HTMLAnchorElement>(null);
  useCatalogTransition(icon.to, card, '.icon-entry-label', '.icon-entry-specimen > svg');
  return <Link ref={card} to={icon.to} viewTransition className="icon-entry mu-stack gap-mu-related" state={{ iconSearch: search, iconIndex: index }}>
    <span className="icon-entry-specimen" aria-hidden="true">{icon.kind === 'life' ? <LifeIcon name={icon.name} size={32} animate={false} /> : <Icon name={icon.name} size={32} animate={false} />}</span>
    <span className="mu-stack gap-mu-space-4"><span className="icon-entry-label type-doc-subheading self-start">{icon.label}</span><span className="type-doc-caption text-ink2">{icon.description}</span></span>
  </Link>;
}

export default function IconLibrary() {
  const { pathname, hash } = useLocation();
  const life = pathname === '/icons/life';
  const [params, setParams] = useSearchParams();
  const pendingParams = React.useRef(params);
  React.useEffect(() => { pendingParams.current = params; }, [params]);
  const query = params.get('q') ?? '';
  const set = life ? 'life' : params.get('set') === 'product' || params.get('set') === 'life' ? params.get('set')! : 'all';
  const found = ICON_PAGES.filter(icon => (set === 'all' || icon.kind === set) && query.trim().toLowerCase().split(/\s+/).every(word => `${icon.label} ${icon.name} ${icon.category} ${icon.description} ${icon.keywords}`.toLowerCase().includes(word)));
  const categories = [...new Set(found.map(icon => icon.category))];
  function update(key: string, value: string) {
    const next = new URLSearchParams(pendingParams.current);
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    pendingParams.current = next;
    setParams(next, { replace: true, preventScrollReset: true });
  }
  // Existing guide links with section anchors continue to reach their original content.
  if (hash) return <Navigate to={`${life ? '/icons/life/guide' : '/icons/guide'}${hash}`} replace />;
  return <div className="library mu-stack gap-mu-section">
    <header className="library-heading mu-stack gap-mu-related">
      <div className="library-title-row mu-cluster gap-mu-group"><h1>{life ? 'Life icons' : 'Icons'}</h1><span className="library-count">{life ? ICON_PAGES.filter(icon => icon.kind === 'life').length : ICON_PAGES.length} glyphs</span></div>
      <p>{life ? 'Glyphs for what a day is made of: meals, feelings, people, places, and everyday moments.' : 'Product controls and everyday life, drawn in Soft Hardware. Open a glyph to see its sizes, motion, and implementation.'}</p>
      <div className="library-related mu-cluster gap-mu-related"><Link to={life ? '/icons/life/guide' : '/icons/guide'}>Usage & motion guide <Icon name="external" size={12} /></Link><Link to={life ? '/icons' : '/icons/life'}>{life ? 'All icons' : 'Life icons'} <Icon name="chevron" turn={270} size={12} animate={false} /></Link></div>
    </header>
    <div className="mu-stack gap-mu-related">
      <div className="library-search-row mu-cluster gap-mu-group">
        <Field className="library-search"><Icon name="search" size={16} /><Field.Input aria-label="Search icons" placeholder="Search by name, purpose, or synonym…" value={query} onChange={event => update('q', event.target.value)} /></Field>
        <p className="library-result" role="status">{found.length} {found.length === 1 ? 'icon' : 'icons'}</p>
      </div>
      {!life && <div className="library-filters mu-cluster gap-mu-related" role="group" aria-label="Icon sets">{(['all', 'product', 'life'] as const).map(kind => <button key={kind} type="button" aria-pressed={set === kind} onClick={() => update('set', kind)}>{kind === 'all' ? 'All icons' : kind === 'product' ? 'Product icons' : 'Life icons'}</button>)}</div>}
    </div>
    {categories.map(category => <section key={category} className="mu-stack gap-mu-group"><div className="library-section-heading mu-cluster gap-mu-related"><h2>{category} <span>{found.filter(icon => icon.category === category).length}</span></h2></div>
      <div className="icon-directory mu-auto-grid gap-mu-related">{found.filter(icon => icon.category === category).map(icon => <IconEntry key={icon.to} icon={icon} search={params.toString()} index={pathname} />)}</div>
    </section>)}
    {!found.length && <div className="library-empty mu-stack gap-mu-related"><h2>No icons found</h2><p>Try a different name or purpose.</p><button type="button" className="type-ui text-ink" onClick={() => update('q', '')}>Clear search</button></div>}
  </div>;
}
