import * as React from 'react';
import { WipNotice } from '../ui/WipNotice';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useMatches } from 'react-router';
import { DialRoot } from 'dialkit';
import { Breadcrumbs, SlidingIndicator } from '@unlocalhosted/metalui';
import { NAV } from './nav';
import { OPEN_SEARCH, SiteSearch } from './SiteSearch';
import { useColorway, type Colorway } from './colorway';
import { Wordmark } from '../ui/Wordmark';
import { SocialLinks } from '../ui/SocialLinks';
import { CATALOG_INDEXES, catalogDetailTarget, useCatalogTransition } from './catalog-transition';
import './catalog-transition.css';

/* The shell, ported one to one from the reference design-language site (kds.css):
 *   masthead   brand · search well (⌘K) · colorway pill of pills · MOTION switch · GitHub, X, LinkedIn
 *   side       engraved groups, rows with readout counts, the current row sunk with a green bar
 *   main       the page
 *   toc        ON THIS PAGE, built from the page's h2 ids, the section in view lit */

function ColorwaySeg() {
  const { colorway, setColorway } = useColorway();
  const seg = React.useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = React.useState<{ x: number; w: number } | null>(null);
  React.useLayoutEffect(() => {
    const on = seg.current?.querySelector<HTMLButtonElement>('button[aria-checked="true"]');
    if (on) setThumb({ x: on.offsetLeft - 3, w: on.offsetWidth });
  }, [colorway]);
  return (
    <div className="seg sm" role="radiogroup" aria-label="Colorway" ref={seg}>
      <span className="thumb" aria-hidden="true" style={thumb ? { transform: `translateX(${thumb.x}px)`, width: thumb.w } : { opacity: 0 }} />
      {(['bone', 'graphite'] as Colorway[]).map((c) => (
        <button key={c} type="button" role="radio" aria-checked={colorway === c} onClick={() => setColorway(c)}>
          {c === 'bone' ? 'Bone' : 'Graphite'}
        </button>
      ))}
    </div>
  );
}

function MotionToggle() {
  const [on, setOn] = React.useState(() => {
    try { return localStorage.getItem('metalui:motion') !== 'off'; } catch { return true; }
  });
  React.useEffect(() => {
    document.documentElement.classList.toggle('rm', !on);
    try { localStorage.setItem('metalui:motion', on ? 'on' : 'off'); } catch {}
  }, [on]);
  return (
    <label className="motion-ctl">
      <span className="eng">Motion</span>
      <span className="tog sm">
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} aria-label="Motion (off = Reduce Motion)" />
        <span className="tr" />
        <span className="th" />
      </span>
    </label>
  );
}

function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH));
}

function Toc() {
  const { pathname } = useLocation();
  const [items, setItems] = React.useState<{ id: string; text: string }[]>([]);
  const [active, setActive] = React.useState<string | null>(null);
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      const hs = [...document.querySelectorAll<HTMLElement>('main section[id] > h2, main h2[id]')];
      setItems(hs.map((h) => ({ id: h.id || h.parentElement!.id, text: h.textContent?.replace(/^#|#$/g, '').trim() ?? '' })).filter((i) => i.id && i.text));
    }, 60);
    return () => window.clearTimeout(t);
  }, [pathname]);
  React.useEffect(() => {
    if (!items.length) return;
    const onScroll = () => {
      let cur = items[0].id;
      for (const i of items) { const el = document.getElementById(i.id); if (el && el.getBoundingClientRect().top < 120) cur = i.id; }
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);
  if (!items.length) return <aside className="toc" aria-label="On this page" />;
  return (
    <aside className="toc" aria-label="On this page">
      <span className="eng">On this page</span>
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} className={active === i.id ? 'on' : undefined}>{i.text}</a>
      ))}
    </aside>
  );
}

export function Shell() {
  const { colorway } = useColorway();
  const { pathname, hash, state } = useLocation();
  const pageKey = NAV.some(group => group.items.some(item => item.to === pathname + hash)) ? pathname + hash : pathname;
  const main = React.useRef<HTMLElement>(null);
  const placeTarget = catalogDetailTarget(pageKey);
  useCatalogTransition(pageKey, main, placeTarget && '.docs-breadcrumbs [aria-current="page"]', placeTarget);
  const matchedData = useMatches().at(-1)?.loaderData as { pageTitle?: string } | undefined;
  const section = NAV.find(group => group.to === state?.sectionIndex && group.items.some(item => item.to === pageKey)) ?? [...NAV].reverse().find(group => group.to === pathname || group.items.some(item => item.to === pageKey)) ?? (pathname.startsWith('/icons/') ? NAV.find(group => group.to === '/icons') : undefined);
  const library = NAV.some(group => group.to === pathname) || pathname === '/icons' || pathname === '/icons/life';
  const librarySearch = typeof state?.librarySearch === 'string' ? state.librarySearch : '';
  const libraryDestination = librarySearch ? `/components?${librarySearch}` : '/components';
  const sectionSearch = typeof state?.sectionSearch === 'string' ? state.sectionSearch : '';
  const iconIndex = state?.iconIndex === '/icons/life' ? '/icons/life' : '/icons';
  const iconSearch = typeof state?.iconSearch === 'string' ? state.iconSearch : '';
  const iconDestination = (index: string) => iconIndex === index && iconSearch ? `${index}?${iconSearch}` : index;
  const sectionDestination = section?.to === '/components' ? libraryDestination : section?.to === '/icons' ? iconDestination('/icons') : sectionSearch ? `${section?.to}?${sectionSearch}` : section?.to;
  const pageLabel = matchedData?.pageTitle ?? (section?.to === pathname ? section.label : section?.items.find(item => item.to === pageKey)?.label);
  const crumbs = [{ id: '/', label: 'MetalUI', href: '/' },
    ...(section?.to && section.to !== pathname ? [{ id: section.to, label: section.label, href: sectionDestination }] : []),
    ...(pathname.startsWith('/icons/life/') ? [{ id: '/icons/life', label: 'Life icons', href: iconDestination('/icons/life') }] : []),
    { id: pageKey, label: pageLabel ?? 'Documentation' }];
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);
  React.useEffect(() => setMenuOpen(false), [pathname]);
  React.useEffect(() => { document.body.classList.toggle('nav-open', menuOpen); }, [menuOpen]);
  React.useEffect(() => {
    const onScroll = () => document.body.classList.toggle('scrolled', window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="masthead">
        <button className="menu-btn" type="button" aria-expanded={menuOpen} aria-controls="side" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <NavLink className="brand" to="/">
          <Wordmark size={12} />
          <span className="eng">Soft Hardware · 0.0 alpha</span>
        </NavLink>
        <span className="grow" />
        <button className="search-well" type="button" onClick={openSearch}>
          <svg className="ki" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          <span>Search the system</span>
          <span className="key">⌘K</span>
        </button>
        <div className="ctl">
          <ColorwaySeg />
          <MotionToggle />
          <SocialLinks />
        </div>
      </header>

      <div className={library ? 'shell library-shell' : 'shell'}>
        <aside className="side" id="side" aria-label="Documentation" data-open={menuOpen || undefined} onPointerLeave={() => setHovered(null)}>
          {/* One hover highlight for the whole nav, gliding link to link like a list's (settle spring). */}
          <SlidingIndicator activeSelector="[data-hovered]" watch={['data-hovered']} spring="settle" className="side-glide" />
          {NAV.map((group) => (
            <div className="grp" key={group.label}>
              {group.to ? <Link to={group.to === '/components' ? libraryDestination : group.to} aria-current={pathname === group.to ? 'page' : section === group ? 'location' : undefined} onClick={() => setMenuOpen(false)} data-hovered={hovered === group.to || undefined} onPointerEnter={() => setHovered(group.to!)}>{group.label}</Link> : <span className="eng">{group.label}</span>}
              {!group.to && group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end aria-current={pathname === item.to ? 'page' : 'location'} onClick={() => setMenuOpen(false)} data-hovered={hovered === item.to || undefined} onPointerEnter={() => setHovered(item.to)}>
                  <span>{item.label}</span>
                  {item.meta && <span className="readout-t">{item.meta}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          {/* on a phone the masthead has no room for them: they live at the foot of the menu, named */}
          <SocialLinks labelled />
        </aside>
        <main id="main" tabIndex={-1} ref={main}>
          <Breadcrumbs items={crumbs} className="docs-breadcrumbs" renderLink={(item, props) => <Link {...props} viewTransition={CATALOG_INDEXES.includes(item.href?.split('?')[0] ?? '')} to={item.href!} />} />
          <WipNotice />
          <Outlet />
        </main>
        {!library && <Toc />}
      </div>

      {pathname !== '/components/button' && <DialRoot position="bottom-right" defaultOpen={false} theme={colorway === 'graphite' ? 'dark' : 'light'} productionEnabled />}
      <SiteSearch />
      <ScrollRestoration />
    </>
  );
}
