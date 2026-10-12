import * as React from 'react';
import { useNavigate } from 'react-router';
import { Button, Kbd, Switcher } from '@unlocalhosted/metalui';
import { FloatingTable, useXrayFlight } from '../ui/floating';
import { XrayOverlay } from '../ui/xray';
import { Icon } from '@unlocalhosted/metalui/icons';
import { useColorway, type Colorway } from '../app/colorway';
import { GithubStars } from '../ui/SocialLinks';

/* The front door: nothing but objects hanging in space, one engraved line in each
 * corner, and one way in. "Browse Components" flies every object onto the overview's table. */
export default function Landing() {
  const navigate = useNavigate();
  const { colorway, setColorway } = useColorway();
  const { open: xray, away, seeds, reseed, fly, close } = useXrayFlight();

  const enter = React.useCallback(() => navigate('/overview', { viewTransition: true }), [navigate]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && xray) close();
      else if (e.key === 'Enter' && !xray && (e.target as HTMLElement)?.tagName === 'BODY') enter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [xray, enter, close]);

  return (
    <main className="landing">
      <h1 className="sr-only">MetalUI: UI components that feel like real objects, for React and SwiftUI</h1>
      <header className="landing-corners">
        <span className="eng">metalui // soft hardware</span>
        <div className="landing-corners-end">
          <Switcher size="compact" aria-label="Colorway" value={colorway} onValueChange={(v) => setColorway(v as Colorway)} options={[{ value: 'bone', label: 'Bone' }, { value: 'graphite', label: 'Graphite' }]} />
          <GithubStars />
        </div>
      </header>

      <FloatingTable mode="space" lifted={away} seeds={seeds} onSeed={reseed} onXray={fly} />

      <footer className="landing-foot">
        <p className="landing-line">UI components that feel like real objects. <span>For React and SwiftUI.</span></p>
        <div className="landing-actions">
          <Button cap="primary" className="landing-cta" onClick={enter}><span className="cta-rim" aria-hidden><span /></span><span className="cta-rim cta-rim-glow" aria-hidden><span /></span>Browse Components</Button>
          <Button icon={<Icon name="external" />} nativeButton={false} role="link" render={<a href="https://www.npmjs.com/package/@unlocalhosted/metalui" target="_blank" rel="noopener noreferrer" />}>View on npm</Button>
        </div>
        <span className="eng">⏎ browse components · click a part to see inside it · <Kbd size="small">esc</Kbd> back</span>
      </footer>

      {xray && <XrayOverlay {...xray} onSeed={reseed} onClose={close} />}
    </main>
  );
}
