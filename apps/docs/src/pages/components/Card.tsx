import * as React from 'react';
import { useDialKit } from 'dialkit';
import { ShareIcon } from '@unlocalhosted/metalui/icons';
import { Button, Card } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/card/card.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalCard.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/card/card.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * LIFT TUNER: the page's DialKit panel
 *
 *   spring   the spring a linked card lifts on
 *   lift     how far it lifts
 * ───────────────────────────────────────────────────────── */

const cover = (a: string, b: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="160" fill="url(#g)"/><circle cx="250" cy="44" r="18" fill="rgba(255,255,255,.6)"/><path d="M0 130 90 70l60 40 50-30 120 80H0z" fill="rgba(255,255,255,.35)"/></svg>`)}`;

function Cards({ onDid }: { onDid: (s: string) => void }) {
  const [chosen, setChosen] = React.useState('lisbon');
  return (
    <div className="grid w-full max-w-[720px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-16">
      <Card selected={chosen === 'lisbon'}>
        <Card.Media src={cover('#E8C9A0', '#C27D5F')} />
        <Card.Title href="#lisbon">Trip to Lisbon</Card.Title>
        <Card.Description>14 notes, 3 photos, a tram map.</Card.Description>
        <Card.Footer>
          <Button size="compact" onClick={() => { setChosen('lisbon'); onDid('Chose Lisbon'); }}>Choose</Button>
          <Button size="compact" icon={<ShareIcon />} onClick={() => onDid('Shared Lisbon')}>Share</Button>
        </Card.Footer>
      </Card>
      <Card selected={chosen === 'porto'}>
        <Card.Media src={cover('#A7C6E8', '#5F84B6')} />
        <Card.Title href="#porto">Weekend in Porto</Card.Title>
        <Card.Description>A list of cafés and a train time.</Card.Description>
        <Card.Footer>
          <Button size="compact" onClick={() => { setChosen('porto'); onDid('Chose Porto'); }}>Choose</Button>
        </Card.Footer>
      </Card>
      <Card>
        <Card.Title>Packing list</Card.Title>
        <Card.Description>This card goes nowhere, so it stays still.</Card.Description>
      </Card>
    </div>
  );
}

function LiftTuner() {
  const d = useDialKit('Card lift', {
    spring: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    lift: [4, 0, 12],
    slow: [1, 1, 10],
  });
  const vars = { ...springVars('settle', d.spring as SpringName, d.slow), '--mu-motion-step': `${d.lift}px` } as React.CSSProperties;
  return <div data-testid="card-lift-tuner" className="flex w-full justify-center" style={vars}><Cards onDid={() => {}} /></div>;
}

export default function CardPage() {
  const [did, setDid] = React.useState<string | null>(null);
  return (
    <ComponentPage
      title="Card"
      lede="A person's thing, held on a raised plate. A card that goes somewhere lifts one step under the pointer as its shadow grows; its title is the one link, and its actions stay buttons of their own. A card that goes nowhere stays still."
      play={{ lede: 'Hover the cards, open one, or use its buttons.', caption: did ?? 'two linked cards (one chosen) · one that goes nowhere', wide: true, node: <Cards onDid={setDid} /> }}
      more={[{ id: 'lift', title: 'Tune the lift', lede: 'The Card lift panel swaps the lift\'s spring, sets how far it lifts, and stretches time.', node: <LiftTuner /> }]}
      usage={`<Card>
  <Card.Media src={trip.cover} />
  <Card.Title href={\`/trips/\${trip.id}\`}>{trip.name}</Card.Title>
  <Card.Description>{trip.summary}</Card.Description>
  <Card.Footer>
    <Button size="compact" icon={<ShareIcon />} onClick={share}>Share</Button>
  </Card.Footer>
</Card>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'swift', label: 'SwiftUI', code: swiftSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'CD1', title: 'One link, the title', body: 'The title\'s link covers the card; actions are separate buttons.', origin: 'Inclusive components' },
        { id: 'CD2', title: 'Only what goes somewhere moves', body: 'A card lifts only when it has a link; a still card promises nothing.', origin: 'Ours' },
        { id: 'CD3', title: 'Still before the pointer leaves', body: 'The hover lift rides the settle spring, done by the time the pointer is gone.', origin: 'Transitions T5a' },
      ]}
    />
  );
}
