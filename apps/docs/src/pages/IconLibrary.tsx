import * as React from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router';
import { Field } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { ICON_PAGES } from '../app/icon-pages';
import { IconTray } from '../ui/IconCell';
import './library.css';
import './icon-library.css';

/* ─────────────────────────────────────────────────────────
 * ICON LIBRARY
 *
 * Each category is one sunk tray of glyph cells (ui/IconCell: rest, hover, focus, pressed).
 * The toolbar holds search, set, preview size and the category index; the index lights the
 * category in view and jumps to it. Reduced motion: no acts, no sink, no smooth scroll.
 * ───────────────────────────────────────────────────────── */

const SIZES = [24, 32, 48] as const;
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
  const set = life ? 'life' : params.get('set') === 'product' || params.get('set') === 'life' ? params.get('set')! : 'all';
  const size = SIZES.find(step => String(step) === params.get('size')) ?? 32;
  const total = life ? ICON_PAGES.filter(icon => icon.kind === 'life').length : ICON_PAGES.length;
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
    <header className="library-heading mu-stack gap-mu-related">
      <div className="library-title-row mu-cluster gap-mu-group"><h1>{life ? 'Life icons' : 'Icons'}</h1><span className="library-count">{total} glyphs</span></div>
      <p>{life ? 'Glyphs for what a day is made of: meals, feelings, people, places, and everyday moments. Hover one to see it move.' : 'Product controls and everyday life, drawn in Soft Hardware. Every glyph has its own motion; hover one to see it, open it for sizes, code and downloads.'}</p>
      <div className="library-related mu-cluster gap-mu-related"><Link to={life ? '/icons/life/guide' : '/icons/guide'}>Usage & motion guide <Icon name="external" size={12} /></Link><Link to={life ? '/icons' : '/icons/life'}>{life ? 'All icons' : 'Life icons'} <Icon name="chevron" turn={270} size={12} animate={false} /></Link></div>
    </header>
    <div ref={toolbar} className="icon-toolbar mu-stack gap-mu-related">
      <div className="icon-toolbar-row mu-cluster gap-mu-group">
        <Field className="library-search"><Icon name="search" size={16} /><Field.Input aria-label="Search icons" placeholder="Search by name, purpose, or synonym…" value={query} onChange={event => update('q', event.target.value)} /></Field>
        <p className="library-result" role="status">{found.length === total ? `${total} icons` : `${found.length} of ${total} icons`}</p>
        <div className="icon-toolbar-controls mu-cluster gap-mu-group">
          {!life && <div className="library-filters mu-cluster gap-mu-space-4" role="group" aria-label="Icon sets">{(['all', 'product', 'life'] as const).map(kind => <button key={kind} type="button" aria-pressed={set === kind} onClick={() => update('set', kind)}>{kind === 'all' ? 'All icons' : kind === 'product' ? 'Product icons' : 'Life icons'}</button>)}</div>}
          <div className="library-filters icon-sizes mu-cluster gap-mu-space-4" role="group" aria-label="Preview size">{SIZES.map(step => <button key={step} type="button" aria-pressed={size === step} onClick={() => update('size', String(step))}>{step}<span aria-hidden="true">px</span></button>)}</div>
        </div>
      </div>
      {categories.length > 1 && <nav ref={index} className="icon-index" aria-label="Icon categories">{categories.map(category => <button key={category} type="button" aria-current={current === slug(category) || undefined} onClick={() => jump(category)}>{category}<span>{found.filter(icon => icon.category === category).length}</span></button>)}</nav>}
    </div>
    {categories.map(category => <section key={category} id={slug(category)} className="icon-category mu-stack gap-mu-related">
      <div className="library-section-heading mu-cluster gap-mu-related"><h2 tabIndex={-1}>{category} <span>{found.filter(icon => icon.category === category).length}</span></h2></div>
      <IconTray icons={found.filter(icon => icon.category === category)} size={size} state={{ iconSearch: params.toString(), iconIndex: pathname }} />
    </section>)}
    {!found.length && <div className="library-empty mu-stack gap-mu-related"><h2>No icons found</h2><p>Try a different name or purpose, or search across both sets.</p><div className="mu-cluster gap-mu-related"><button type="button" className="type-ui text-ink" onClick={() => update('q', '')}>Clear search</button>{set !== 'all' && !life && <button type="button" className="type-ui text-ink" onClick={() => update('set', 'all')}>Search all icons</button>}</div></div>}
  </div>;
}
