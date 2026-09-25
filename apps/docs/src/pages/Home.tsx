import * as React from 'react';
import { Link } from 'react-router';
import { Icon } from '@unlocalhosted/metalui/icons';
import { XrayOverlay } from '../ui/xray';
import { FloatingTable, useXrayFlight } from '../ui/floating';

/* The overview, laid out like the reference design-language site's home:
 *   hero        engraved kicker · two-tone title · lede
 *   hero-table  real objects on the table: written lines with marks, a link card, a swatch, a selection, the toolbar
 *   two halves  the material and the mechanics
 *   explore     cards into the system */



export default function Home() {
  const { open: xray, fly, close } = useXrayFlight();
  React.useEffect(() => {
    if (!xray) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [xray, close]);
  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-copy">
          <span className="eng">MetalUI · Soft Hardware · Rev B · React and SwiftUI</span>
          <h1 id="hero-h">UI components that look <span>and feel like real objects.</span></h1>
          <p>
            Buttons, switches and cards made to look like soft plastic, glass, rubber and metal. They all share one light from the top left.{' '}
            <b>Buttons move down when you press them and spring back.</b> Every component works in React and in SwiftUI, and both are built from
            the same files. There is also a guide for coding agents.
          </p>
        </div>

        <FloatingTable mode="table" lifted={xray?.from} onXray={fly} />
        {xray && <XrayOverlay kind={xray.kind} from={xray.from} onClose={close} />}
      </section>

      <section className="sec" id="two-halves">
        <h2>Two halves</h2>
        <p className="sec-sub">The first half is how things look. The second half is how they move when you use them.</p>
        <div className="two-col">
          <div className="panel raised">
            <span className="eng">The material</span>
            <h3 style={{ margin: '6px 0 10px' }}>Soft Hardware</h3>
            <ul>
              <li><b>Materials.</b> Bone, graphite, smoked glass, rubber and metal. Each object uses one material and at most one accent colour.</li>
              <li><b>One light.</b> A soft light from the top left. Nothing glows.</li>
              <li><b>One source file.</b> Every look is written down once. The CSS and Swift code are made from that file, so web and Mac always match.</li>
            </ul>
            <p style={{ marginTop: 12 }}><Link to="/foundations/materials">Materials</Link></p>
          </div>
          <div className="panel raised">
            <span className="eng">The mechanics</span>
            <h3 style={{ margin: '6px 0 10px' }}>Things you can press</h3>
            <ul>
              <li><b>Pressing.</b> Buttons move down one point and spring back. Sliders slide. Dials click into steps.</li>
              <li><b>Weight.</b> There are seven springs. Small things move fast and big things move slower.</li>
              <li><b>Smooth changes.</b> When a label or icon changes, it animates into the new one instead of jumping.</li>
            </ul>
            <p style={{ marginTop: 12 }}><Link to="/foundations/motion">Motion</Link></p>
          </div>
        </div>
      </section>

      <section className="sec" id="explore">
        <h2>Explore the system</h2>
        <div className="cards">
          {[
            { to: '/foundations', icon: 'layout', title: 'Foundations', body: 'Colours, text, spacing, corners, materials, shadows and motion.', eng: 'Tokens · live' },
            { to: '/components/button', icon: 'board', title: 'Components', body: 'Small parts that each do one thing, like buttons, sliders, fields, menus and tooltips.', eng: 'React · SwiftUI' },
            { to: '/components/tool-strip', icon: 'text', title: 'Blocks', body: 'Bigger pieces built from components, like the toolbar, filter bar and cards.', eng: 'Compositions' },
            { to: '/icons', icon: 'seed', title: 'Icons', body: 'Line icons on a 24 point grid. Each one moves a little when you hover it.', eng: 'Glyphs' },
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
