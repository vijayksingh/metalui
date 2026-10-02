import * as React from 'react';
import { useDialKit } from 'dialkit';
import { NavigationMenu } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/navigation-menu/navigation-menu.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/navigation-menu/navigation-menu.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * PANEL TUNER: the page's DialKit panel
 *
 *   morph    the spring the plate slides and resizes on between keys
 *   rise     the spring it rises on when it opens
 *   travel   how far the content moves the way you went
 * The plate is portalled, so the tuned values ride on the document while this tuner is here.
 * ───────────────────────────────────────────────────────── */

function Nav({ label }: { label: string }) {
  return (
    <NavigationMenu aria-label={label}>
      <NavigationMenu.Item label="Foundations">
        <div className="grid w-[300px] gap-2">
          <NavigationMenu.Link href="#color" description="Inks, colorways and the signals.">Color & ink</NavigationMenu.Link>
          <NavigationMenu.Link href="#type" description="The type roles every control uses.">Typography</NavigationMenu.Link>
          <NavigationMenu.Link href="#motion" description="Springs by mass, travel by the grid.">Motion</NavigationMenu.Link>
        </div>
      </NavigationMenu.Item>
      <NavigationMenu.Item label="Components">
        <div className="grid w-[520px] grid-cols-2 gap-2">
          <NavigationMenu.Link href="#button" description="Press-in caps.">Button</NavigationMenu.Link>
          <NavigationMenu.Link href="#field" description="Text in a well.">Field</NavigationMenu.Link>
          <NavigationMenu.Link href="#select" description="One of many, in a list.">Select</NavigationMenu.Link>
          <NavigationMenu.Link href="#switch" description="On or off, at once.">Switch</NavigationMenu.Link>
          <NavigationMenu.Link href="#menu" description="Commands on a plate.">Menu</NavigationMenu.Link>
          <NavigationMenu.Link href="#dialog" description="A question that waits.">Dialog</NavigationMenu.Link>
        </div>
      </NavigationMenu.Item>
      <NavigationMenu.Link top href="#icons">Icons</NavigationMenu.Link>
    </NavigationMenu>
  );
}

function PanelTuner() {
  const d = useDialKit('Navigation panel', {
    morph: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    rise: { type: 'select', options: SPRING_NAMES, default: 'surface' },
    travel: [8, 0, 24],
    slow: [1, 1, 10],
  });
  const vars: Record<string, string> = { ...springVars('settle', d.morph as SpringName, d.slow), ...springVars('surface', d.rise as SpringName, d.slow), '--mu-motion-content': `${d.travel}px` };
  React.useEffect(() => {
    const el = document.documentElement;
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    return () => { for (const k of Object.keys(vars)) el.style.removeProperty(k); };
  });
  return <div data-testid="navigation-panel-tuner" className="flex justify-center"><Nav label="Tuned site" /></div>;
}

export default function NavigationMenuPage() {
  return (
    <ComponentPage
      title="Navigation menu"
      lede="A site's sections across the top, with panels of links. The panel rises into place; move to the next section and it slides under the new key and takes its size, while the links inside move the way you went."
      play={{ lede: 'Hover Foundations, then move to Components.', caption: 'two panels · a plain link', node: <div className="flex min-h-[320px] items-start justify-center pt-8"><Nav label="Site" /></div> }}
      more={[{ id: 'panel', title: 'Tune the panel', lede: 'The Navigation panel sets the springs the plate morphs and rises on, and how far the content travels.', node: <PanelTuner /> }]}
      usage={`<NavigationMenu aria-label="Site">
  <NavigationMenu.Item label="Foundations">
    <NavigationMenu.Link href="/color" description="Inks, colorways and the signals.">
      Color & ink
    </NavigationMenu.Link>
  </NavigationMenu.Item>
  <NavigationMenu.Link top href="/icons">Icons</NavigationMenu.Link>
</NavigationMenu>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'NM1', title: 'One plate travels', body: 'Moving between sections, the same plate slides and resizes; it never closes and reopens.', origin: 'Ours' },
        { id: 'NM2', title: 'The content says which way', body: 'Links move two grid steps the way you went as they crossfade.', origin: 'Ours' },
        { id: 'NM4', title: 'The direction is state', body: 'The shared chevron morphs from down to up with the panel state on the settle spring. Reduced motion changes the complete glyph at once.', origin: 'The icon grammar' },
        { id: 'NM3', title: 'Describe the destination', body: 'Each link carries a line saying what is there.', origin: 'Ours' },
      ]}
    />
  );
}
