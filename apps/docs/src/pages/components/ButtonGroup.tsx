import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, ButtonGroup, ButtonGroupReadout, MenuItem, SplitButton, Toggle, ToggleGroup } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalButtonGroup.swift?raw';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/button-group/button-group.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/button-group/button-group.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * CLUSTER TUNER: the page's DialKit panel
 *
 *   rocker   optional one-degree tilt toward the operated key
 *   chevron  the spring the chevron turns on
 * ───────────────────────────────────────────────────────── */

function Examples({ onDid }: { onDid: (s: string) => void }) {
  const [grid, setGrid] = React.useState<string[]>(['snap']);
  const [zoom, setZoom] = React.useState(100);
  return (
    <div className="grid justify-items-center gap-20">
      <ButtonGroup aria-label="History">
        <Button icon={<Icon name="undo" />} onClick={() => onDid('Undid')}>Undo</Button>
        <Button icon={<Icon name="redo" />} onClick={() => onDid('Redid')}>Redo</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="History rocker" rocker><Button onClick={() => onDid('Undid rocker')}>Undo</Button><Button onClick={() => onDid('Redid rocker')}>Redo</Button></ButtonGroup>
      <ButtonGroup aria-label="Zoom">
        <Button disabled={zoom === 25} onClick={() => setZoom((z) => Math.max(25, z - 25))} aria-label="Zoom out">−</Button>
        <ButtonGroupReadout aria-label="Zoom level" value={`${zoom} %`} />
        <Button disabled={zoom === 400} onClick={() => setZoom((z) => Math.min(400, z + 25))} aria-label="Zoom in">+</Button>
      </ButtonGroup>
      <ToggleGroup joined multiple value={grid} onValueChange={setGrid} aria-label="Canvas aids">
        <Toggle value="snap">Snap</Toggle><Toggle value="grid">Grid</Toggle>
      </ToggleGroup>
      <ButtonGroup aria-label="Compact history" size="compact">
        <Button onClick={() => onDid('Undid compact')}>Undo</Button><Button disabled>Redo</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Unavailable history" disabled><Button>Undo</Button><Button>Redo</Button></ButtonGroup>
      <SplitButton
        menuLabel="More export options"
        heading="EXPORT AS"
        menu={(
          <>
            <MenuItem onSelect={() => onDid('Exported PNG')}>PNG</MenuItem>
            <MenuItem onSelect={() => onDid('Exported SVG')}>SVG</MenuItem>
            <MenuItem onSelect={() => onDid('Copied the link')}>Copy link</MenuItem>
          </>
        )}
      >
        <Button cap="primary" onClick={() => onDid('Exported PDF')}>Export PDF</Button>
      </SplitButton>
    </div>
  );
}

function ClusterTuner() {
  const d = useDialKit('Button cluster', {
    rockerAngle: [1, 0, 2],
    chevron: { type: 'select', options: SPRING_NAMES, default: 'part' },
  });
  const vars = { ...springVars('part', d.chevron as SpringName), '--mu-r-button-group-rocker-angle': `${d.rockerAngle}deg` } as React.CSSProperties;
  return <div data-testid="button-cluster-tuner" style={vars}><Examples onDid={() => {}} /></div>;
}

export default function ButtonGroupPage() {
  const [did, setDid] = React.useState<string | null>(null);
  return (
    <ComponentPage
      title="Button group"
      lede="Related actions cut from one raised bar, with engraved seams and square interior faces. Each key presses inside its segment. A split button keeps the main action and its alternatives in the same material."
      play={{ lede: 'Press the keys, or open the export chevron.', caption: did ?? 'history · zoom · split export', node: <Examples onDid={setDid} /> }}
      more={[{ id: 'cluster', title: 'Tune the cluster', lede: 'Tune the optional rocker angle and chevron spring. The bar keeps zero gaps and square interior edges.', node: <ClusterTuner /> }]}
      usage={`<ButtonGroup aria-label="History">
  <Button onClick={undo}>Undo</Button>
  <Button onClick={redo}>Redo</Button>
</ButtonGroup>

<SplitButton menuLabel="More export options" menu={
  <>
    <MenuItem onSelect={exportPng}>PNG</MenuItem>
    <MenuItem onSelect={exportSvg}>SVG</MenuItem>
  </>
}>
  <Button cap="primary" onClick={exportPdf}>Export PDF</Button>
</SplitButton>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'swift', label: 'SwiftUI', code: swiftSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'BG1', title: 'One machined bar', body: 'Only the outer ends round. Seams stay fixed while each face sinks. A readout is a window with no click or tab stop.', origin: 'Ours' },
        { id: 'BG2', title: 'A latch says it stays', body: 'ToggleGroup joined uses the same bar, with Base UI arrow navigation and a lamp on each latched segment. ButtonGroup actions keep separate tab stops.', origin: 'Ours' },
        { id: 'BG3', title: 'The main action first', body: 'A split button leads with what most people want; the chevron holds the rest.', origin: 'Ours' },
      ]}
    />
  );
}
