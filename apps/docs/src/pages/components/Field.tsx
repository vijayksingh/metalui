import * as React from 'react';
import { Field, Kbd, SearchField } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { TagDemo } from '../../ui/tag/TagDemo';
import swiftExample from '../../../../../swift/Examples/MetalTagExample.swift?raw';
import { FieldXray } from '../../ui/xray/FieldXray';
import reactSource from '../../../../../packages/metalui/src/components/field/field.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/field/field.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

export default function FieldPage() {
  const [q, setQ] = React.useState('');
  return (
    <ComponentPage
      title={"Field"}
      lede={"A shallow tray you type in, with an icon at the start and a key at the end. The search field looks the same but is a button that opens search."}
      play={{ lede: "Type in the field. The search field under it is a button: it opens search, it does not take text.", caption: "field \u00b7 search field", node: (
          <div className="flex flex-col items-center gap-20" style={{ width: 320 }}>
            <Field style={{ width: '100%' }}>
              <Field.Icon><Icon name="search" size={15} /></Field.Icon>
              <Field.Input placeholder="Lens or action" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Lens or action" />
              <Field.Trail><Kbd>⌘K</Kbd></Field.Trail>
            </Field>
            <SearchField placeholder="Search" tone="light" icon={<Icon name="search" size={14} />} />
          </div>
        ) }}
      xray={<FieldXray />}
      more={[{ id: 'form', title: 'Form sizes and states', lede: 'In a form, the field comes in the select\'s sizes and shows the focus ring. Invalid draws the one invalid ring every form control shares; disabled dims it. Tag commits one attachment: Enter submits, Escape cancels, storage failures keep the draft and Undo restores the prior tag list. The Tag request panel controls latency and first-request failure.', node: (
        <div className="grid w-full max-w-[320px] gap-12">
          <Field size="regular"><Field.Input placeholder="Region name" aria-label="Region name" /></Field>
          <TagDemo />
          <Field size="regular" invalid><Field.Input defaultValue="Trip to" aria-label="Invalid region name" /></Field>
          <Field size="regular" disabled><Field.Input defaultValue="Locked" aria-label="Locked region name" /></Field>
        </div>
      ) }]}
      sources={[
        { id: 'react', label: "React", code: reactSource },
        { id: 'swift', label: 'SwiftUI tag host', code: swiftExample },
        { id: 'css', label: "CSS", code: cssSource },
        { id: 'agent', label: "Agent guide", code: agentSource },
      ]}
      rules={[
        { id: "FD1", title: "A tray says \"type here\"", body: "The field is sunk into the page, so you know it takes text before you read it.", origin: 'Ours' },
        { id: "FD2", title: "Focus you can see", body: "In a form the field shows the green ring; only the palette's large field, which always holds focus, lets the caret say it.", origin: 'Ours' },
        { id: "FD3", title: "Keys stand up inside", body: "A key inside the field is raised, so it never looks like text you could type over.", origin: 'Ours' },
      ]}
    />
  );
}
