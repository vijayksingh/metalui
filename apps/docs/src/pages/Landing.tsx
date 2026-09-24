import * as React from 'react';
import { useNavigate } from 'react-router';
import { Button, Kbd, Segmented } from '@unlocalhosted/metalui';
import { FloatingTable } from '../ui/floating';
import { ButtonXray } from '../ui/xray/ButtonXray';
import { useColorway, type Colorway } from '../app/colorway';

/* The front door: nothing but objects hanging in space, one engraved line in each
 * corner, and one way in. "Read the docs" flies every object onto the overview's table. */
export default function Landing() {
  const navigate = useNavigate();
  const { colorway, setColorway } = useColorway();
  const [xray, setXray] = React.useState(false);

  const enter = React.useCallback(() => navigate('/overview', { viewTransition: true }), [navigate]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && xray) setXray(false);
      else if (e.key === 'Enter' && !xray && (e.target as HTMLElement)?.tagName === 'BODY') enter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [xray, enter]);

  return (
    <div className="landing">
      <header className="landing-corners">
        <span className="eng">metalui // soft hardware</span>
        <Segmented size="compact" aria-label="Colorway" value={colorway} onValueChange={(v) => setColorway(v as Colorway)} options={[{ value: 'bone', label: 'Bone' }, { value: 'graphite', label: 'Graphite' }]} />
      </header>

      <FloatingTable mode="space" onXray={() => setXray(true)} />

      <footer className="landing-foot">
        <p className="landing-line">Small, well-made objects <span>for React and SwiftUI.</span></p>
        <Button cap="primary" onClick={enter}>Read the docs</Button>
        <span className="eng">⏎ read the docs · click the dark button to open it up · <Kbd size="small">esc</Kbd> back</span>
      </footer>

      {xray && (
        <div className="xr-overlay" role="dialog" aria-modal="true" aria-label="Button, x-ray" onClick={(e) => { if (e.target === e.currentTarget) setXray(false); }}>
          <div className="xr-sheet"><ButtonXray startOpen /></div>
        </div>
      )}
    </div>
  );
}
