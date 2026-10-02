import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Checkbox, Row, type RowProps } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { UsageSection, useOwnCss } from '../../ui/Usage';
import reactSource from '../../../../../packages/metalui/src/components/row/row.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/row/row.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalRow.swift?raw';

function HandledRow() {
  const [selected, setSelected] = React.useState(false);
  const [opened, setOpened] = React.useState(false);
  const [checked, setChecked] = React.useState(false);
  const tune = useDialKit('Row', {
    variant: { type: 'select', options: ['list', 'panel', 'option'], default: 'panel' },
    weakMatch: false,
  });
  const detail = React.useId();
  return <div data-testid="handled-row" className="mu-stack gap-mu-related w-full max-w-xl">
    <ul className="m-0 p-0 list-none" aria-label="Notes">
      <Row as="li" variant={tune.variant as RowProps['variant']} selected={selected} opened={opened} checked={checked} maybe={tune.weakMatch}>
        <Row.Lead><Checkbox size="row" aria-label="Select Lisbon notes" checked={selected} onCheckedChange={setSelected} /></Row.Lead>
        <Row.Text>Lisbon notes</Row.Text>
        <Row.Trail><Button size="compact" cap="link" aria-expanded={opened} aria-controls={detail} onClick={() => setOpened(!opened)}>{opened ? 'Close details' : 'Open details'}</Button></Row.Trail>
      </Row>
    </ul>
    <div id={detail} hidden={!opened} className="mu-stack gap-mu-related p-mu-space-16 rounded-card recipe-well-field">
      <span className="type-ui text-ink2">Opening a note marks its rail; selecting it keeps its own plate.</span>
      <Checkbox aria-label="Complete Lisbon notes" checked={checked} onCheckedChange={setChecked} />
    </div>
  </div>;
}

export default function RowPage() {
  const ownCss = useOwnCss(cssSource);
  return <>
    <PageHeader title="Row" lede="A part that gives one item its place in a list. Selection raises the plate; an opened item gains a rail; completion strikes its words. The host supplies the controls and their behavior." />
    <Section title="Handle a row" lede="Select the note, open its details, then complete it. These states can coexist; Tab reaches each real control. The Row panel changes its variant and weak-match appearance.">
      <Bench><HandledRow /></Bench>
    </Section>
    <Section title="States" lede="Selection, opening and completion describe different facts. Keyboard highlight remains a separate option state.">
      <Bench><div className="mu-stack gap-mu-related w-full max-w-xl">
        <Row variant="panel"><Row.Lead><Icon name="note" size={14} animate={false} /></Row.Lead><Row.Text>Rest</Row.Text></Row>
        <Row variant="panel" selected><Row.Text>Selected</Row.Text></Row>
        <Row variant="panel" opened><Row.Text>Opened</Row.Text></Row>
        <Row variant="panel" selected opened checked><Row.Text>Selected, opened and complete</Row.Text></Row>
      </div></Bench>
    </Section>
    <UsageSection agent={agentGuide} />
    <Section title="Rules"><Rules rules={[
      { id: 'R1', title: 'A part with host semantics', body: 'The host owns selection, opening and completion. Keep embedded controls separate; a row containing controls is never a wrapping button.', origin: 'Composition' },
      { id: 'R2', title: 'Separate facts', body: 'selected raises the shared plate in any variant; opened marks its rail; checked changes Row.Text. active remains keyboard highlight for options.', origin: 'Backlog' },
      { id: 'R3', title: 'Say the state', body: 'selected supplies aria-selected for row, option, treeitem and tab roles. For ordinary lists use an associated checkbox; a detail action carries aria-expanded and aria-controls.', origin: 'Accessibility' },
    ]} /></Section>
    <Section title="Source"><SourceTabs tabs={[{ id: 'react', label: 'React', code: reactSource }, { id: 'css', label: 'CSS', code: ownCss }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'agent', label: 'Agent guide', code: agentGuide }]} /></Section>
  </>;
}
