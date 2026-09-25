import * as React from 'react';
import { useNavigate } from 'react-router';
import { Button, Kbd, Switcher } from '@unlocalhosted/metalui';
import { FloatingTable, type XrayKind } from '../ui/floating';
import { XrayOverlay } from '../ui/xray';
import { useColorway, type Colorway } from '../app/colorway';

/* The front door: nothing but objects hanging in space, one engraved line in each
 * corner, and one way in. "Read the docs" flies every object onto the overview's table. */
export default function Landing() {
  const navigate = useNavigate();
  const { colorway, setColorway } = useColorway();
  const [xray, setXray] = React.useState<XrayKind | null>(null);

  const enter = React.useCallback(() => navigate('/overview', { viewTransition: true }), [navigate]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && xray) setXray(null);
      else if (e.key === 'Enter' && !xray && (e.target as HTMLElement)?.tagName === 'BODY') enter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [xray, enter]);

  return (
    <div className="landing">
      <header className="landing-corners">
        <span className="eng">metalui // soft hardware</span>
        <Switcher size="compact" aria-label="Colorway" value={colorway} onValueChange={(v) => setColorway(v as Colorway)} options={[{ value: 'bone', label: 'Bone' }, { value: 'graphite', label: 'Graphite' }]} />
      </header>

      <FloatingTable mode="space" onXray={setXray} />

      <footer className="landing-foot">
        <p className="landing-line">UI components that feel like real objects. <span>For React and SwiftUI.</span></p>
        <Button cap="primary" onClick={enter}>Read the docs</Button>
        <span className="eng">⏎ read the docs · click a part to see inside it · <Kbd size="small">esc</Kbd> back</span>
      </footer>

      {xray && <XrayOverlay kind={xray} onClose={() => setXray(null)} />}
    </div>
  );
}
