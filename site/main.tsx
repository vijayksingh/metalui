import * as React from 'react';
import { createRoot } from 'react-dom/client';
import '../components/tokens.css';
import './site.css';
import { ComponentSection } from './ComponentSection';
import { IconGallery } from './IconGallery';
import { COMPONENTS } from './registry';

type Colorway = 'bone' | 'graphite';

function readColorway(): Colorway {
  try {
    const saved = localStorage.getItem('mu-colorway');
    if (saved === 'bone' || saved === 'graphite') return saved;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'graphite' : 'bone';
}

function App() {
  const [colorway, setColorway] = React.useState<Colorway>(readColorway);
  React.useEffect(() => {
    document.documentElement.dataset.muColorway = colorway;
    try { localStorage.setItem('mu-colorway', colorway); } catch {}
  }, [colorway]);

  return (
    <div className="sheet">
      <header className="head">
        <div>
          <b>MetalUI</b>
          Soft Hardware components · React on Base UI · SwiftUI · agent guides
        </div>
        <nav className="meta" aria-label="Site">
          <a href="#components">Components</a>
          <a href="#icons">Icons</a>
          <a href="/AI.md">AI.md</a>
          <a href="https://github.com/vijayksingh/metalui">GitHub</a>
          <button
            type="button"
            className="cw"
            role="switch"
            aria-checked={colorway === 'graphite'}
            onClick={() => setColorway(colorway === 'bone' ? 'graphite' : 'bone')}
          >
            <i aria-hidden="true" />
            {colorway === 'bone' ? 'Bone' : 'Graphite'}
          </button>
        </nav>
      </header>

      <main>
        <section id="components" className="sec">
          <div className="sec-h">
            <h2>Components</h2>
            <span className="cap">{COMPONENTS.length} · React · SwiftUI · Agent</span>
          </div>
          {COMPONENTS.map((c) => <ComponentSection key={c.meta.name} entry={c} />)}
        </section>

        <section id="icons" className="sec">
          <IconGallery />
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
