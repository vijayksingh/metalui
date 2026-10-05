import * as React from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Field, Switcher } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { ICON_PAGES } from '../app/icon-pages';
import { IconTray } from '../ui/IconCell';
import { IconPlate } from '../ui/IconPlate';
import './library.css';
import './icon-library.css';

/* ─────────────────────────────────────────────────────────
 * ICON LIBRARY
 *
 * header    title, one line, the guides; beside it a plate of keys that play once on arrival (ui/IconPlate)
 * toolbar   search (the count lives in it) · set switcher with counts · size · the category index,
 *           which lights the category in view and jumps to it
 * trays     one sunk tray of glyph cells per category (ui/IconCell: rest, hover, focus, pressed)
 * The set is the address: All /icons, Product /icons?set=product, Life /icons/life.
 * Reduced motion: no acts, no sink, no smooth scroll.
 * ───────────────────────────────────────────────────────── */

const SIZES = [24, 32, 48] as const;
type Set = 'all' | 'product' | 'life';
const SETS: { value: Set; label: string }[] = [{ value: 'all', label: 'All' }, { value: 'product', label: 'Product' }, { value: 'life', label: 'Life' }];
const FEATURED: Record<'all' | 'life', string[]> = {
  all: ['/icons/check', '/icons/copy', '/icons/download', '/icons/palette', '/icons/life/breakfast', '/icons/life/coffee', '/icons/life/sunny', '/icons/life/music'],
  life: ['/icons/life/breakfast', '/icons/life/coffee', '/icons/life/sunny', '/icons/life/music', '/icons/life/happy', '/icons/life/gym', '/icons/life/plants', '/icons/life/flight'],
};
const count = (set: Set) => ICON_PAGES.filter(icon => set === 'all' || icon.kind === set).length;
const slug = (category: string) => `icons-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
const reduced = () => document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The category in view: the last section whose top has passed under the toolbar. A jump pins its
 * category until the reader scrolls by hand, because the short trays at the end can't reach the top. */
function useCategoryInView(ids: string[], toolbar: React.RefObject<HTMLElement | null>) {
  const [current, setCurrent] = React.useState(ids[0]);
  const pinned = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!ids.length) return;
    const onScroll = () => {
      if (pinned.current) return setCurrent(pinned.current);
      const line = (toolbar.current?.getBoundingClientRect().bottom ?? 64) + 24;
      let next = ids[0];
      for (const id of ids) { const top = document.getElementById(id)?.getBoundingClientRect().top; if (top !== undefined && top < line) next = id; }
      setCurrent(next);
    };
    const release = () => { if (pinned.current) { pinned.current = null; onScroll(); } };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    for (const type of ['wheel', 'touchmove', 'keydown'] as const) window.addEventListener(type, release, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      for (const type of ['wheel', 'touchmove', 'keydown'] as const) window.removeEventListener(type, release);
    };
  }, [ids.join(' '), toolbar]);
  const pin = React.useCallback((id: string) => { pinned.current = id; setCurrent(id); }, []);
  return [current, pin] as const;
}

export default function IconLibrary() {
  const { pathname, hash } = useLocation();
  const life = pathname === '/icons/life';
  const [params, setParams] = useSearchParams();
  const pendingParams = React.useRef(params);
  React.useEffect(() => { pendingParams.current = params; }, [params]);
  const query = params.get('q') ?? '';
  const navigate = useNavigate();
  const set: Set = life || params.get('set') === 'life' ? 'life' : params.get('set') === 'product' ? 'product' : 'all';
  const size = SIZES.find(step => String(step) === params.get('size')) ?? 32;
  const total = count(set);
  const featured = React.useMemo(() => FEATURED[set === 'life' ? 'life' : 'all'].map(to => ICON_PAGES.find(icon => icon.to === to)!), [set]);
  const found = ICON_PAGES.filter(icon => (set === 'all' || icon.kind === set) && query.trim().toLowerCase().split(/\s+/).every(word => `${icon.label} ${icon.name} ${icon.category} ${icon.description} ${icon.keywords}`.toLowerCase().includes(word)));
  const categories = [...new Set(found.map(icon => icon.category))];
  const toolbar = React.useRef<HTMLDivElement>(null);
  const index = React.useRef<HTMLElement>(null);
  const [current, pin] = useCategoryInView(categories.map(slug), toolbar);
  // Keep the lit chip visible inside the index's own scroller, without moving the page.
  React.useEffect(() => {
    const chip = index.current?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!chip || !index.current) return;
    const { scrollLeft, clientWidth } = index.current;
    if (chip.offsetLeft < scrollLeft || chip.offsetLeft + chip.offsetWidth > scrollLeft + clientWidth) index.current.scrollTo({ left: chip.offsetLeft - 8, behavior: reduced() ? 'auto' : 'smooth' });
  }, [current]);
  function update(key: string, value: string) {
    const next = new URLSearchParams(pendingParams.current);
    if (!value || value === 'all' || (key === 'size' && value === '32')) next.delete(key); else next.set(key, value);
    pendingParams.current = next;
    setParams(next, { replace: true, preventScrollReset: true });
  }
  // Choosing a set moves the address and keeps the search and size.
  function chooseSet(next: Set) {
    const search = new URLSearchParams(pendingParams.current);
    search.delete('set');
    if (next === 'product') search.set('set', 'product');
    pendingParams.current = search;
    navigate({ pathname: next === 'life' ? '/icons/life' : '/icons', search: search.size ? `?${search}` : '' }, { replace: true, preventScrollReset: true });
  }
  function jump(category: string) {
    const section = document.getElementById(slug(category));
    if (!section) return;
    pin(section.id);
    // Land the heading just under the toolbar (or the masthead, where the toolbar doesn't follow).
    // Measure where the toolbar sits once stuck, not where it is now: from the top it hasn't stuck yet.
    const style = toolbar.current && getComputedStyle(toolbar.current);
    const toolbarBottom = style?.position === 'sticky' ? parseFloat(style.top) + toolbar.current!.offsetHeight : 64;
    window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - toolbarBottom - 16, behavior: reduced() ? 'auto' : 'smooth' });
    section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
  // Existing guide links with section anchors continue to reach their original content.
  if (hash) return <Navigate to={`${life ? '/icons/life/guide' : '/icons/guide'}${hash}`} replace />;
  return <div className="library icon-library mu-stack gap-mu-section">
    <header className="icon-header">
      <div className="library-heading mu-stack gap-mu-related">
        <h1>{set === 'life' ? 'Life icons' : 'Icons'}</h1>
        <p>{set === 'life' ? 'What a day is made of: meals, feelings, people, places and moments. Each glyph moves in its own way.' : 'Glyphs for product controls and everyday life. Each one has its own motion.'}</p>
        <nav className="library-related icon-guides mu-cluster gap-mu-related" aria-label="Icon guides">
          <span className="type-readout text-ink3">Guides</span>
          <Link to="/icons/guide">Product</Link>
          <Link to="/icons/life/guide">Life</Link>
          <Link to="/icons/guide#morph">Morph</Link>
        </nav>
      </div>
      <IconPlate icons={featured} />
    </header>
    <div ref={toolbar} className="icon-toolbar mu-stack gap-mu-related">
      <div className="icon-toolbar-row">
        <Field className="library-search icon-search"><Icon name="search" size={16} /><Field.Input aria-label="Search icons" placeholder={`Search ${total} icons…`} value={query} onChange={event => update('q', event.target.value)} />{query && <span className="icon-search-count" aria-hidden="true">{found.length} of {total}</span>}</Field>
        <p className="sr-only" role="status">{found.length === total ? `${total} icons` : `${found.length} of ${total} icons`}</p>
        <Switcher aria-label="Icon set" value={set} onValueChange={chooseSet} options={SETS.map(option => ({ value: option.value, label: <>{option.label}<span className="icon-set-count">{count(option.value)}</span></> }))} />
        <div className="icon-size mu-cluster gap-mu-space-8"><span className="type-readout text-ink3" aria-hidden="true">Size</span><Switcher aria-label="Preview size" size="compact" value={String(size)} onValueChange={value => update('size', value)} options={SIZES.map(step => ({ value: String(step), label: String(step) }))} /></div>
      </div>
      {categories.length > 1 && <nav ref={index} className="icon-index" aria-label="Icon categories">{categories.map(category => <button key={category} type="button" aria-current={current === slug(category) || undefined} onClick={() => jump(category)}>{category}<span>{found.filter(icon => icon.category === category).length}</span></button>)}</nav>}
    </div>
    {categories.map(category => <section key={category} id={slug(category)} className="icon-category mu-stack gap-mu-related">
      <div className="library-section-heading mu-cluster gap-mu-related"><h2 tabIndex={-1}>{category} <span>{found.filter(icon => icon.category === category).length}</span></h2></div>
      <IconTray icons={found.filter(icon => icon.category === category)} size={size} state={{ iconSearch: params.toString(), iconIndex: pathname }} />
    </section>)}
    {!found.length && <div className="library-empty mu-stack gap-mu-related"><h2>No icons found</h2><p>Try a different name or purpose, or search across both sets.</p><div className="mu-cluster gap-mu-related"><button type="button" className="type-ui text-ink" onClick={() => update('q', '')}>Clear search</button>{set !== 'all' && <button type="button" className="type-ui text-ink" onClick={() => chooseSet('all')}>Search all icons</button>}</div></div>}
  </div>;
}
