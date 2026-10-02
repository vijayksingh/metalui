import * as React from 'react';
import { Button, Dialog, Popover, RenameEditor, ToastProvider, useToast } from '@unlocalhosted/metalui';

/** A docs persistence fixture. Hosts replace this request with their own storage operation. */
function RenameDemoBody({ file = false, initial = 'Trip to Lisbon', label = 'Region name', latency = 900, fail = false,
  panelStyle, side = 'bottom', testId = 'rename-region', dialog = false, open: controlledOpen, onOpenChange, trigger = true }: {
  file?: boolean; initial?: string; label?: string; latency?: number; fail?: boolean;
  dialog?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void; trigger?: boolean;
  panelStyle?: React.CSSProperties; side?: 'bottom' | 'top' | 'left' | 'right'; testId?: string;
}) {
  const [name, setName] = React.useState(initial);
  const [localOpen, setLocalOpen] = React.useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;
  const [pending, setPending] = React.useState(false);
  const [requests, setRequests] = React.useState(0);
  const toast = useToast();
  const editor = <RenameEditor value={name} file={file} label={label}
          validate={value => value.toLowerCase() === 'taken' ? 'That name is taken.' : value.length > 40 ? 'Keep the name to 40 characters.' : null}
          onRename={async () => { setRequests(n => n + 1); await new Promise(resolve => setTimeout(resolve, latency)); if (fail && requests === 0) throw new Error('Could not rename. Try again.'); }}
          onPendingChange={setPending} onCancel={() => setOpen(false)} onDone={() => setOpen(false)}
          onRenamed={(next, before) => { setName(next); toast.show({ title: `Renamed to ${next}`, undo: () => setName(before) }); }} />;
  return <div data-testid={testId} data-requests={requests} className="mu-stack gap-mu-related items-center">
    <span className={trigger ? "type-ui text-ink" : "sr-only"} data-name>{name}</span>
    {dialog ? <>
      {trigger && <Button onClick={() => setOpen(true)}>Rename canvas…</Button>}
      <Dialog open={open} onOpenChange={next => { if (!pending) setOpen(next); }}>
        <Dialog.Popup><Dialog.Title>Rename canvas</Dialog.Title>{editor}</Dialog.Popup>
      </Dialog>
    </> : <Popover open={open} onOpenChange={next => { if (!pending) setOpen(next); }}>
      <Popover.Trigger><Button>{file ? 'Rename file…' : 'Rename…'}</Button></Popover.Trigger>
      <Popover.Content style={panelStyle} side={side}>
        <Popover.Title>Rename {file ? 'file' : 'region'}</Popover.Title>
        <Popover.Description>The name shows on its edge and in search.</Popover.Description>

        <Popover.Body>{editor}</Popover.Body>
      </Popover.Content>
    </Popover>}
  </div>;
}

export function RenameDemo(props: React.ComponentProps<typeof RenameDemoBody>) { return <ToastProvider><RenameDemoBody {...props} /></ToastProvider>; }
