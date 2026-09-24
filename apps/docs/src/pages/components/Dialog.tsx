import * as React from 'react';
import { Button, Dialog } from '@unlocalhosted/metalui';
import { DialogXray } from '../../ui/xray/DialogXray';
import reactSource from '../../../../../packages/metalui/src/components/dialog/dialog.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/dialog/dialog.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

export default function DialogPage() {
  const [open, setOpen] = React.useState(false);
  return (
    <ComponentPage
      title={"Dialog"}
      lede={"A plate that floats over a dimmed page and asks for one thing. Tab stays inside it. Escape or a click outside closes it."}
      play={{ lede: "Open it, press Tab a few times, then press Escape.", node: (
          <>
            <Button onClick={() => setOpen(true)}>Rename canvas…</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <Dialog.Popup aria-label="Rename canvas" style={{ width: 320, padding: 20 }}>
                <b style={{ display: 'block', marginBottom: 12 }}>Rename canvas</b>
                <input defaultValue="Trip notes" aria-label="Name" style={{ width: '100%', height: 32, borderRadius: 10, border: '1px solid var(--rule)', padding: '0 10px', font: 'inherit', background: 'transparent', color: 'inherit' }} />
                <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button cap="primary" onClick={() => setOpen(false)}>Save</Button></span>
              </Dialog.Popup>
            </Dialog>
          </>
        ) }}
      xray={<DialogXray />}
      sources={[
        { id: 'react', label: "React", code: reactSource },
        { id: 'css', label: "CSS", code: cssSource },
        { id: 'agent', label: "Agent guide", code: agentSource },
      ]}
      rules={[
        { id: "DG1", title: "One question at a time", body: "A dialog asks for one thing. Anything longer belongs on a page.", origin: 'Ours' },
        { id: "DG2", title: "Focus stays inside", body: "Tab moves only between the things in the dialog, and focus goes back to the opener when it closes.", origin: 'Ours' },
        { id: "DG3", title: "Near the top", body: "It sits 16% down the window, near where your eyes already are.", origin: 'Ours' },
      ]}
    />
  );
}
