import * as React from 'react';
import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { DialRoot } from 'dialkit';
import { SlidingIndicator } from '@unlocalhosted/metalui';
import { NAV } from './nav';
import { useColorway, type Colorway } from './colorway';

/* The shell, ported one to one from the reference design-language site (kds.css):
 *   masthead   brand · search well (⌘K) · colorway pill of pills · MOTION switch
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
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
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
  const { pathname } = useLocation();
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
        <NavLink className="brand" to="/" aria-label="MetalUI, home">
          <svg className="mark" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="13" fill="var(--ink)" />
            <circle cx="14" cy="14" r="8.5" fill="none" stroke="var(--page)" strokeOpacity=".22" />
            <rect x="10.4" y="11.6" width="2.2" height="4.8" rx="1.1" fill="var(--page)" />
            <rect x="15.4" y="11.6" width="2.2" height="4.8" rx="1.1" fill="var(--page)" />
          </svg>
          <b>metalui</b>
          <span className="eng">Soft Hardware · 0.0 alpha</span>
        </NavLink>
        <span className="grow" />
        <button className="search-well" type="button" onClick={openSearch} aria-label="Search the system (⌘K)">
          <svg className="ki" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          <span>Search the system</span>
          <span className="key">⌘K</span>
        </button>
        <div className="ctl">
          <ColorwaySeg />
          <MotionToggle />
        </div>
      </header>

      <div className="shell">
        <aside className="side" id="side" aria-label="Documentation" data-open={menuOpen || undefined} onPointerLeave={() => setHovered(null)}>
          {/* One hover highlight for the whole nav, gliding link to link like a list's (settle spring). */}
          <SlidingIndicator activeSelector="[data-hovered]" watch={['data-hovered']} spring="settle" className="side-glide" />
          {NAV.map((group) => (
            <div className="grp" key={group.label}>
              <span className="eng">{group.label}</span>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end onClick={() => setMenuOpen(false)} data-hovered={hovered === item.to || undefined} onPointerEnter={() => setHovered(item.to)}>
                  <span>{item.label}</span>
                  {item.meta && <span className="readout-t">{item.meta}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <Toc />
      </div>

      {pathname !== '/components/button' && <DialRoot position="bottom-right" defaultOpen={false} theme={colorway === 'graphite' ? 'dark' : 'light'} productionEnabled />}
      <ScrollRestoration />
    </>
  );
}
