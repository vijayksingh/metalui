import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Combobox } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/combobox/combobox.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/combobox/combobox.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * FIT TUNER: the page's DialKit panel
 *
 *   fit      the spring the plate's height settles on as matches change
 *   rows     how many rows before the plate scrolls
 * Springs are the system's classes; slow stretches every duration. The plate is portalled,
 * so the tuned values ride on the document while this tuner is on the page.
 * ───────────────────────────────────────────────────────── */

const CITIES = ['Amsterdam', 'Athens', 'Barcelona', 'Berlin', 'Bologna', 'Bordeaux', 'Bruges', 'Budapest', 'Copenhagen', 'Dublin', 'Edinburgh', 'Florence', 'Geneva', 'Lisbon', 'Ljubljana', 'London', 'Lyon', 'Madrid', 'Marseille', 'Milan', 'Munich', 'Naples', 'Oslo', 'Paris', 'Porto', 'Prague', 'Rome', 'Seville', 'Stockholm', 'Valencia', 'Vienna', 'Zurich'];

function FitTuner() {
  const d = useDialKit('Combobox fit', {
    fit: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    rows: [7, 3, 12],
    slow: [1, 1, 10],
  });
  const vars: Record<string, string> = { ...springVars('settle', d.fit as SpringName, d.slow), '--mu-r-combobox-self-max-rows': String(Math.round(d.rows)) };
  React.useEffect(() => {
    const el = document.documentElement;
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    return () => { for (const k of Object.keys(vars)) el.style.removeProperty(k); };
  });
  return <div data-testid="combobox-fit-tuner" className="flex justify-center"><Combobox items={CITIES} placeholder="Tuned city" aria-label="Tuned city" /></div>;
}

export default function ComboboxPage() {
  const [city, setCity] = React.useState<string | null>(null);
  return (
    <ComponentPage
      title="Combobox"
      lede="Type to find one of many. Rows filter as you type, never behind your fingers, while the plate settles to the new count; the highlight glides from row to row."
      play={{ lede: 'Type "b", then "bo", then "x". Use ↑ ↓ and ↩.', caption: city ? `trip to ${city}` : '32 cities · compact · invalid · disabled', node: (
        <div className="flex min-h-[300px] items-start justify-center pt-16">
          <div className="grid gap-12">
            <Combobox items={CITIES} value={city} onValueChange={setCity} placeholder="Choose a city" aria-label="City" />
            <Combobox items={CITIES} size="compact" placeholder="Compact" aria-label="Compact city" />
            <Combobox items={CITIES} invalid defaultValue="Atlantis" placeholder="Invalid" aria-label="Invalid city" />
            <Combobox items={CITIES} disabled placeholder="Disabled" aria-label="Disabled city" />
          </div>
        </div>
      ) }}
      more={[{ id: 'fit', title: 'Tune the fit', lede: 'The Combobox fit panel swaps the spring the plate settles on as matches change, sets how many rows show before it scrolls, and stretches time.', node: <FitTuner /> }]}
      usage={`<Combobox items={cities} value={city} onValueChange={setCity} placeholder="Choose a city" aria-label="City" />`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'CB1', title: 'Rows never lag the fingers', body: 'Filtering is instant; only the plate\'s size moves, on the settle spring.', origin: 'Ours' },
        { id: 'CB2', title: 'One highlight', body: 'Pointer and keys share one highlight that glides between rows.', origin: 'The menu' },
        { id: 'CB4', title: 'One clear glyph', body: 'The clear key uses the shared close glyph and keeps its accessible name; reduced motion leaves it complete and still.', origin: 'The icon set' },
        { id: 'CB3', title: 'Say when nothing matches', body: 'One quiet row, not an empty plate.', origin: 'Ours' },
      ]}
    />
  );
}
