import * as React from 'react';
import { Row, Switch } from '@unlocalhosted/metalui';
import { Wordmark, WORDMARK_ALL_LAYERS, WORDMARK_LAYERS } from '../Wordmark';
import { XrayFrame, type SpotDef } from './kit';
import { useSpecimenZoom } from '../edit';

const SPOTS: SpotDef<'layers'>[] = [{ id: 'layers', title: 'Layers', word: 'Enamel and chrome' }];
const SIDE: Record<'layers', ['right', number]> = { layers: ['right', 0.5] };

/** Inspect the site's enamel wordmark using the same renderer as the landing and masthead. */
export function WordmarkXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [layers, setLayers] = React.useState(WORDMARK_ALL_LAYERS);
  const [well, zoom] = useSpecimenZoom();
  const measure = React.useRef<HTMLSpanElement>(null);
  const [size, setSize] = React.useState({ width: 160, height: 34 });
  React.useLayoutEffect(() => {
    const el = measure.current?.firstElementChild as HTMLElement | undefined;
    if (!el) return;
    const read = () => setSize({ width: el.offsetWidth, height: el.offsetHeight });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = 2.6;
  const W = size.width * scale, H = size.height * scale;
  return (
    <>
      <span ref={measure} className="xr-measure" aria-hidden><Wordmark size={21} /></span>
      <XrayFrame
        xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot="layers" setSpot={() => {}}
        solid={<Wordmark size={21 * scale} layers={layers} />}
        W={W} H={H}
        scene={<div style={{ position: 'absolute', transform: 'translateZ(32px)' }}><Wordmark size={21 * scale} layers={layers} /></div>}
        anchors={{ layers: [W * 0.75, H * 0.5, 32] }}
        onReset={() => setLayers(WORDMARK_ALL_LAYERS)} deps={[layers, size]}
        card={<>
          <p>Red and graphite enamel form the capsule. Chrome lettering and a top reflection give it shine; its rim and shadows give it weight. Switch layers off to see their effect.</p>
          <div ref={well} className="ed-specimen"><Wordmark size={21} layers={layers} style={{ zoom }} /></div>
          <div className="ed-layers">
            {WORDMARK_LAYERS.map(({ id, name, why }) => <Row key={id} className="ed-layer" data-off={layers[id] ? undefined : ''} title={why}>
              <Row.Text>{name}</Row.Text>
              <Row.Trail><Switch size="small" aria-label={name} checked={layers[id]} onCheckedChange={(on) => setLayers((old) => ({ ...old, [id]: on }))} /></Row.Trail>
            </Row>)}
          </div>
        </>}
      />
    </>
  );
}
