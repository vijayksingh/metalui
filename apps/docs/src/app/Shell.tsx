import * as React from 'react';
import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { DialRoot } from 'dialkit';
import { NAV } from './nav';
import { useColorway, type Colorway } from './colorway';

const COLORWAYS: { value: Colorway; label: string }[] = [
  { value: 'bone', label: 'Bone' },
  { value: 'graphite', label: 'Graphite' },
];

/** Bone / Graphite: a pill of pills, segments padded h/2 − 1 (F-03). */
function ColorwaySwitch() {
  const { colorway, setColorway } = useColorway();
  return (
    <div role="radiogroup" aria-label="Colorway" className="material-well inline-flex rounded-pill p-2">
      {COLORWAYS.map((c) => {
        const on = c.value === colorway;
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setColorway(c.value)}
            className={[
              'type-ui h-24 cursor-pointer rounded-pill px-11 transition-[color,background,box-shadow] duration-200',
              on ? 'material-thumb text-ink' : 'text-ink2 hover:text-ink',
            ].join(' ')}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-24">
      {NAV.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <div className="type-label engraved px-8 pb-6">{group.label}</div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  'type-ui flex h-32 items-center justify-between rounded-row px-8 no-underline transition-[color,background,box-shadow] duration-200',
                  isActive ? 'material-thumb text-ink' : 'text-ink2 hover:bg-[color-mix(in_srgb,var(--mu-ink)_5%,transparent)] hover:text-ink',
                ].join(' ')
              }
            >
              <span>{item.label}</span>
              {item.meta && <span className="type-readout text-ink2">{item.meta}</span>}
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
      <header className="sticky top-0 z-20 flex h-64 items-center justify-between gap-16 px-24 backdrop-blur-[22px] backdrop-saturate-[1.6] lg:px-32">
        <div className="flex items-center gap-12">
          <button
            type="button"
            className="material-cap type-ui h-32 rounded-pill px-15 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="docs-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            Menu
          </button>
          <NavLink to="/" className="flex items-baseline gap-8 text-ink no-underline">
            <span className="type-title">MetalUI</span>
            <span className="type-readout hidden text-ink2 sm:inline">0.0 · alpha</span>
          </NavLink>
        </div>
        <div className="flex items-center gap-16">
          <a className="type-ui hidden text-ink2 no-underline hover:text-ink sm:inline" href="/AI.md">AI.md</a>
          <a className="type-ui hidden text-ink2 no-underline hover:text-ink sm:inline" href="https://github.com/vijayksingh/metalui">GitHub</a>
          <ColorwaySwitch />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1280px] gap-48 px-24 pb-80 lg:px-32">
        <aside
          id="docs-nav"
          className={[
            'w-[232px] shrink-0 pt-24',
            'lg:sticky lg:top-64 lg:block lg:h-[calc(100dvh-64px)] lg:overflow-y-auto',
            menuOpen ? 'fixed inset-x-0 top-64 z-10 block h-[calc(100dvh-64px)] w-auto overflow-y-auto bg-[var(--mu-frost-strong)] px-24 backdrop-blur-[22px]' : 'hidden',
          ].join(' ')}
        >
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </aside>
        <main className="min-w-0 flex-1 pt-32">
          <Outlet />
        </main>
      </div>

      <DialRoot position="bottom-right" defaultOpen={false} theme={colorway === 'graphite' ? 'dark' : 'light'} productionEnabled />
      <ScrollRestoration />
    </div>
  );
}
