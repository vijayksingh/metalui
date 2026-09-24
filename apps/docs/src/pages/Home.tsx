import * as React from 'react';
import { Link } from 'react-router';
import { Checkbox, Kbd, LinkCard, Mark, SelectionFrame, SuggestionChip, Swatch, Toolbar, ToolButton, ToolbarSearch, ToolbarSeparator } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';

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

export default function Home() {
  const [chip, setChip] = React.useState(true);
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

        <div className="hero-table">
          <div className="hero-frags">
            <Line><b>poster</b></Line>
            <Line task="open">call printer about paper stock <Mark kind="date" resolved="Fri 25 Sep · 16:00">tomorrow 4pm</Mark></Line>
            <Line task="done">pick the grotesk <Mark kind="tag">#type</Mark></Line>
            <Line><Mark kind="measurement">slept 6h</Mark> · <Mark kind="measurement">mood 3</Mark></Line>
            <Line>felt pretty low after lunch</Line>
            {chip && <div style={{ marginLeft: 16 }}><SuggestionChip label="Track as mood?" confidence={0.8} onAccept={() => setChip(false)} onDismiss={() => setChip(false)} /></div>}
            <div style={{ position: 'relative', marginTop: 10, padding: '10px 14px' }}>
              <Line>accent <Mark kind="hex" color="#FF6B3D">#FF6B3D</Mark> · ink <Mark kind="hex" color="#1B1B1D">#1B1B1D</Mark></Line>
              <SelectionFrame state="selected" handles="text" readout size={{ width: 231, height: 40 }} />
            </div>
          </div>
          <div className="hero-objs">
            <LinkCard href="https://lanterns.photo/night-market" />
          </div>
          <div className="hero-side">
            <Swatch hex="#FF6B3D" label="Colour" />
          </div>
          <div className="hero-dock">
            <Toolbar variant="graphite" aria-label="Tools">
              <ToolButton label="Select" shortcut="V" icon={<Icon name="select" size={16} />} pressed />
              <ToolButton label="Note" shortcut="T" icon={<Icon name="note" size={16} />} />
              <ToolButton label="Image" icon={<Icon name="image" size={16} />} />
              <ToolButton label="Link" icon={<Icon name="link" size={16} />} />
              <ToolButton label="Draw" shortcut="P" icon={<Icon name="draw" size={16} />} />
              <ToolbarSeparator />
              <ToolButton label="Tidy" icon={<Icon name="tidy" size={16} />} />
              <ToolbarSearch onOpen={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))} />
            </Toolbar>
            <span className="eng">Press <Kbd>⌘K</Kbd> anywhere to search the system</span>
          </div>
        </div>
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
