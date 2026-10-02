import * as React from 'react';
import { useDialKit } from 'dialkit';
import reactSource from '../../../../../packages/metalui/src/components/rename-editor/rename-editor.tsx?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalRenameEditor.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/rename-editor/rename-editor.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';
import { RenameDemo } from '../../ui/rename/RenameDemo';

// Opening selects the meaningful name. Request locks only this edit; result morph/drum stays300ms.
// Failure retains draft and says why; Cancel/Escape leave the original intact. Undo captures original.
export default function RenameEditorPage() {
  const d = useDialKit('Rename request', { latency: [900, 0, 3000], fail: false });
  return <ComponentPage title="Rename editor"
    lede="A name field and one confirm operation. It selects the existing name, validates before committing, keeps a failed edit open, and shows the result before its host closes."
    play={{ lede: 'Rename the region. Try Taken, an empty name, or a name over40characters.', caption: 'selected name · host validation · request lock · result · captured-original Undo', node: <RenameDemo latency={d.latency} fail={d.fail} /> }}
    more={[
      { id: 'file', title: 'Keep the extension', lede: 'Only the final, nonempty extension is excluded. A leading dot alone belongs to the name.', node: <div className="mu-auto-grid gap-mu-group"><RenameDemo file initial="report.final.txt" label="File name" testId="rename-file" latency={d.latency} fail={d.fail} /><RenameDemo file initial=".env" label="Dotfile name" testId="rename-dotfile" latency={d.latency} fail={d.fail} /></div> },
      { id: 'request', title: 'Work belongs to the host', lede: 'The Rename request panel changes latency and simulates the first storage request failing, then allows a retry. A quick success skips the waiting arc; a shown wait lasts at least300ms. The successful check and Renamed label get a300ms beat after the existing settle lands. Unrelated controls remain usable.', node: <p className="type-content text-ink2 m-0">The host supplies duplicate and length rules, commits the new name, and refuses dismissal while the editor is pending. Undo restores the name captured for that request.</p> },
    ]}
    usage={`<RenameEditor value={name} file\n  validate={validateName}\n  onRename={persistName}\n  onPendingChange={setPending}\n  onRenamed={(next, original) => {\n    setName(next);\n    toast.show({ title: \`Renamed to \${next}\`, undo: () => setName(original) });\n  }}\n  onDone={close} onCancel={close} />`}
    sources={[{ id: 'react', label: 'React', code: reactSource }, { id: 'swift', label: 'SwiftUI', code: swiftSource }, { id: 'agent', label: 'Agent guide', code: agentSource }]}
    rules={[
      { id: 'RE1', title: 'One name, one operation', body: 'The editor owns its draft and request lock. The host owns validation rules, storage, dismissal and Undo.', origin: 'Ours' },
      { id: 'RE2', title: 'Keep an unsuccessful edit', body: 'Empty and unchanged names cannot commit. Invalid names explain themselves under the field; storage failures retain the draft and allow retry.', origin: 'Ours' },
      { id: 'RE3', title: 'Meaning travels with the result', body: 'The pen becomes a check and Rename becomes Renamed, then the host may close. Reduce Motion keeps the words and result with a crossfade.', origin: 'Ours' },
    ]} />;
}
