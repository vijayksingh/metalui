import * as React from 'react';
import { Swatch } from '@unlocalhosted/metalui';
import { SwatchXray } from '../../ui/xray/SwatchXray';
import reactSource from '../../../../../packages/metalui/src/components/swatch/swatch.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalSwatch.swift?raw';
import { ComponentPage } from '../../ui/ComponentPage';

export default function SwatchPage() {
  const [hex, setHex] = React.useState('#FF6B3D');
  return (
    <ComponentPage
      title={"Swatch"}
      lede={"A colour as a small glossy chip in its own colour, with the colour code written on it. Click it to pick another colour."}
      play={{ lede: "Click a small chip to make it the big one. Dark colours get light text and bright colours get dark text.", caption: "the code's ink follows how bright the colour is", node: (
          <div className="flex flex-col items-center gap-20">
            <div style={{ zoom: 1.6 }}><Swatch hex={hex} /></div>
            <span className="flex gap-10">{['#FF6B3D', '#FFD84D', '#35C77A', '#3D7BFF', '#1B1B1D', '#F2F1EE'].map((h) => <Swatch key={h} hex={h} style={{ zoom: 0.55 }} onClick={() => setHex(h)} aria-label={`Use ${h}`} />)}</span>
          </div>
        ) }}
      xray={<SwatchXray />}
      capture="swatch"
      sources={[
        { id: 'react', label: "React", code: reactSource },
        { id: 'css', label: "CSS", code: cssSource },
        { id: 'swift', label: "SwiftUI", code: swiftSource },
      ]}
      rules={[
        { id: "SW1", title: "One colour, one chip", body: "The chip is the colour. Its sides, shine and shadow all come from it.", origin: 'Ours' },
        { id: "SW2", title: "The code is always readable", body: "Dark text on bright colours and light text on dark ones, decided by how bright the colour is.", origin: 'Ours' },
        { id: "SW3", title: "A click opens the picker", body: "The host opens its colour picker when the chip is clicked.", origin: 'Ours' },
      ]}
    />
  );
}
