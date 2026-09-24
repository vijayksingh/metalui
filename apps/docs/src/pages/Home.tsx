import * as React from 'react';
import { Link } from 'react-router';
import { Icon } from '@unlocalhosted/metalui/icons';
import { ButtonXray } from '../ui/xray/ButtonXray';
import { FloatingTable } from '../ui/floating';

/* The overview, laid out like the reference design-language site's home:
 *   hero        engraved kicker · two-tone title · lede
 *   hero-table  real objects on the table: written lines with marks, a link card, a swatch, a selection, the toolbar
 *   two halves  the material and the mechanics
 *   explore     cards into the system */



export default function Home() {
  const [xray, setXray] = React.useState(false);
  React.useEffect(() => {
    if (!xray) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setXray(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [xray]);
  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-copy">
          <span className="eng">MetalUI · Soft Hardware · Rev B · React and SwiftUI</span>
          <h1 id="hero-h">Small, well-made objects <span>on a quiet table.</span></h1>
          <p>
            Controls that behave like objects: bone and graphite soft-touch plastic, smoked glass, rubber and anodized metal, lit by one key
            light from the top-left. <b>Caps press in and spring back.</b> Every piece ships as React on Base UI and as SwiftUI from one set of
            recipes, with a guide for coding agents.
          </p>
        </div>

        <FloatingTable mode="table" onXray={() => setXray(true)} />
        {xray && (
          <div className="xr-overlay" role="dialog" aria-modal="true" aria-label="Button, x-ray" onClick={(e) => { if (e.target === e.currentTarget) setXray(false); }} onKeyDown={(e) => { if (e.key === 'Escape') setXray(false); }}>
            <div className="xr-sheet"><ButtonXray startOpen /></div>
          </div>
        )}
      </section>

      <section className="sec" id="two-halves">
        <h2>Two halves</h2>
        <p className="sec-sub">The material says what a thing is made of. The mechanics say how it answers your hand. Neither is a theme; both are closed sets.</p>
        <div className="two-col">
          <div className="panel raised">
            <span className="eng">The material</span>
            <h3 style={{ margin: '6px 0 10px' }}>Soft Hardware</h3>
            <ul>
              <li><b>Materials, not colours.</b> Bone, graphite, smoked glass, rubber, anodized metal. One material per object, plus at most one signal colour.</li>
              <li><b>One light.</b> A soft key light from the top-left. Light lives inside the material; nothing glows.</li>
              <li><b>Recipes, not styles.</b> Every look is layered data in one file; CSS and Swift are generated from it, so they cannot drift.</li>
            </ul>
            <p style={{ marginTop: 12 }}><Link to="/foundations/materials">Materials</Link></p>
          </div>
          <div className="panel raised">
            <span className="eng">The mechanics</span>
            <h3 style={{ margin: '6px 0 10px' }}>Things you can press</h3>
            <ul>
              <li><b>Travel.</b> Caps sink one point and spring back; thumbs slide; dials have detents.</li>
              <li><b>Mass.</b> Seven spring classes from stiffness and damping, so a thumb and a panel move like what they are.</li>
              <li><b>Nothing snaps.</b> A label that changes turns on a drum; an icon that changes morphs.</li>
            </ul>
            <p style={{ marginTop: 12 }}><Link to="/foundations/motion">Motion</Link></p>
          </div>
        </div>
      </section>

      <section className="sec" id="explore">
        <h2>Explore the system</h2>
        <div className="cards">
          {[
            { to: '/foundations', icon: 'layout', title: 'Foundations', body: 'Colorways, ink, type, space, radius, materials, elevation, springs and transitions.', eng: 'Tokens · live' },
            { to: '/components/button', icon: 'board', title: 'Components', body: 'Primitives with one job each: button, segmented control, keycap, slider, field, menu, tooltip, toast.', eng: 'React · SwiftUI' },
            { to: '/components/tool-strip', icon: 'text', title: 'Blocks', body: 'Things made of components: toolbar, filter bar, time scrubber, region, cards and the selection frame.', eng: 'Compositions' },
            { to: '/icons', icon: 'seed', title: 'Icons', body: 'Monoline glyphs on a 24 grid, each with its own hover pose, plus the life set and its tints.', eng: 'Glyphs' },
          ].map((c) => (
            <Link key={c.title} className="card raised obj" to={c.to}>
              <span className="ico"><Icon name={c.icon as never} size={20} /></span>
              <b>{c.title}</b>
              <p>{c.body}</p>
              <span className="eng">{c.eng}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
