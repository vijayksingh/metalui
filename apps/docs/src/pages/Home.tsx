import * as React from 'react';
import { Link } from 'react-router';
import { Button, Checkbox, Kbd, LinkCard, Mark, Segmented, SuggestionChip, Swatch, Toolbar, ToolButton, ToolbarSeparator } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { ButtonXray } from '../ui/xray/ButtonXray';

/* The overview, laid out like the reference design-language site's home:
 *   hero        engraved kicker · two-tone title · lede
 *   hero-table  real objects on the table: written lines with marks, a link card, a swatch, a selection, the toolbar
 *   two halves  the material and the mechanics
 *   explore     cards into the system */

function Line({ children, task }: { children: React.ReactNode; task?: 'open' | 'done' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, font: '500 15px/22px var(--sans)', letterSpacing: '-.015em' }}>
      {task && <Checkbox defaultChecked={task === 'done'} aria-label="Task" />}
      <span style={task === 'done' ? { color: 'var(--ink3)', textDecoration: 'line-through' } : undefined}>{children}</span>
    </div>
  );
}

function Float({ x, y, dur, dx, dy, r0, r1, live, onOpen, children }: { x: string; y: string; dur: string; dx: string; dy: string; r0?: string; r1?: string; live?: boolean; onOpen?: () => void; children: React.ReactNode }) {
  const style = { left: x, top: y, ['--dur' as string]: dur, ['--dx' as string]: dx, ['--dy' as string]: dy, ['--r0' as string]: r0 ?? '0deg', ['--r1' as string]: r1 ?? '0deg', ['--delay' as string]: `-${parseFloat(dur) / 3}s` } as React.CSSProperties;
  return <div className={['drift-item', live ? 'is-live' : ''].join(' ')} style={style} onKeyDown={(e) => { if (live && e.key === 'Enter') onOpen?.(); }}>{children}</div>;
}

export default function Home() {
  const [chip, setChip] = React.useState(true);
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

        <div className="drift" aria-label="Components on the table">
          <Float x="5%" y="9%" dur="26s" dx="30px" dy="18px" r1="-1.5deg"><div className="hero-frags" style={{ gap: 12, maxWidth: 270 }}>
            <Line task="open">call printer about paper stock <Mark kind="date" resolved="Fri 25 Sep · 16:00">tomorrow 4pm</Mark></Line>
            <Line task="done">pick the grotesk <Mark kind="tag">#type</Mark></Line>
            <Line><Mark kind="measurement">slept 6h</Mark> · <Mark kind="measurement">mood 3</Mark></Line>
          </div></Float>
          <Float x="48%" y="12%" dur="30s" dx="-30px" dy="26px" r0="-2deg" r1="1deg"><LinkCard href="https://lanterns.photo/night-market" /></Float>
          <Float x="80%" y="16%" dur="24s" dx="-18px" dy="30px" r0="3deg" r1="-2deg"><Swatch hex="#FF6B3D" label="Colour" /></Float>
          <Float x="36%" y="52%" dur="20s" dx="28px" dy="-14px" live onOpen={() => setXray(true)}>
            <div style={{ zoom: 1.6 }}><Button cap="primary" onClick={() => setXray(true)}>New Canvas</Button></div>
          </Float>
          <Float x="10%" y="62%" dur="28s" dx="22px" dy="-22px" r1="2deg">{chip && <SuggestionChip label="Track as mood?" confidence={0.8} onAccept={() => setChip(false)} onDismiss={() => setChip(false)} />}</Float>
          <Float x="66%" y="58%" dur="23s" dx="-26px" dy="-20px"><Segmented aria-label="Colorway specimen" defaultValue="bone" options={[{ value: 'bone', label: 'Bone' }, { value: 'graphite', label: 'Graphite' }]} /></Float>
          <Float x="84%" y="72%" dur="19s" dx="-14px" dy="-26px" r0="-4deg" r1="2deg"><Kbd>⌘K</Kbd></Float>
          <Float x="20%" y="82%" dur="32s" dx="40px" dy="-10px">
            <Toolbar variant="graphite" aria-label="Tools">
              <ToolButton label="Select" icon={<Icon name="select" size={16} />} pressed />
              <ToolButton label="Note" icon={<Icon name="note" size={16} />} />
              <ToolButton label="Draw" icon={<Icon name="draw" size={16} />} />
              <ToolbarSeparator />
              <ToolButton label="Tidy" icon={<Icon name="tidy" size={16} />} />
            </Toolbar>
          </Float>
          <div className="xr-hint eng">Click the dark button to open it up</div>
        </div>
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
