import * as React from 'react';
import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { DialRoot } from 'dialkit';
import { Button, Segmented, SlidingIndicator } from '@unlocalhosted/metalui';
import { NAV } from './nav';
import { useColorway, type Colorway } from './colorway';

/* ─────────────────────────────────────────────────────────
 * SHELL
 *   header    brand · links · colorway, 52 tall, frosted over the page
 *   sidebar   208 wide, sticky; group labels engraved, rows in the ui role, a sliding thumb
 *   main      one reading column on the measure (640), centred in what is left;
 *             stages bleed to the stage width (760) on large screens
 * ───────────────────────────────────────────────────────── */

function ColorwaySwitch() {
  const { colorway, setColorway } = useColorway();
  return (
    <Segmented
      size="compact"
      aria-label="Colorway"
      value={colorway}
      onValueChange={(v) => setColorway(v as Colorway)}
      options={[{ value: 'bone', label: 'Bone' }, { value: 'graphite', label: 'Graphite' }]}
    />
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Documentation" className="relative flex flex-col gap-20">
      <SlidingIndicator spring="settle" className="material-thumb rounded-row" />
      {NAV.map((group) => (
        <div key={group.label} className="flex flex-col">
          <div className="type-label engraved px-10 pb-6">{group.label}</div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  'type-ui relative z-10 flex h-28 items-center justify-between rounded-row px-10 no-underline transition-colors duration-150',
                  isActive ? 'text-ink' : 'text-ink2 hover:text-ink',
                ].join(' ')
              }
            >
              <span>{item.label}</span>
              {item.meta && <span className="type-readout text-ink3">{item.meta}</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function Shell() {
  const { colorway } = useColorway();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 flex h-52 items-center justify-between gap-12 bg-page/80 px-16 backdrop-blur-md backdrop-saturate-150 sm:px-24 in-data-[mu-colorway=graphite]:bg-page-dark/80">
        <div className="flex items-center gap-10">
          <Button size="compact" className="lg:hidden" aria-expanded={menuOpen} aria-controls="docs-nav" onClick={() => setMenuOpen((o) => !o)}>
            Menu
          </Button>
          <NavLink to="/" className="flex items-baseline gap-8 text-ink no-underline">
            <span className="type-title">MetalUI</span>
            <span className="type-readout hidden text-ink3 sm:inline">0.0 alpha</span>
          </NavLink>
        </div>
        <div className="flex items-center gap-16">
          <a className="type-ui hidden text-ink2 no-underline hover:text-ink md:inline" href="/AI.md">AI.md</a>
          <a className="type-ui hidden text-ink2 no-underline hover:text-ink md:inline" href="https://github.com/vijayksingh/metalui">GitHub</a>
          <ColorwaySwitch />
        </div>
      </header>

      <div className="mx-auto flex max-w-1280 gap-32 px-16 pb-96 sm:px-24">
        <aside
          id="docs-nav"
          className={[
            'w-208 shrink-0 pt-20',
            'lg:sticky lg:top-52 lg:block lg:h-[calc(100dvh-52px)] lg:overflow-y-auto lg:pb-40',
            menuOpen ? 'material-frost-plate fixed inset-x-0 top-52 z-10 block h-[calc(100dvh-52px)] w-auto overflow-y-auto px-16 pb-40' : 'hidden',
          ].join(' ')}
        >
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </aside>
        <main className="min-w-0 flex-1 pt-40 lg:pt-56">
          <div className="mx-auto w-full max-w-measure">
            <Outlet />
          </div>
        </main>
      </div>

      <DialRoot position="bottom-right" defaultOpen={false} theme={colorway === 'graphite' ? 'dark' : 'light'} productionEnabled />
      <ScrollRestoration />
    </div>
  );
}
