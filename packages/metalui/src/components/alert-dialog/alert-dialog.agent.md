# Alert dialog

A question that must be answered before going on. React: `AlertDialog` from `@unlocalhosted/metalui`, on Base UI AlertDialog. SwiftUI: `MetalAlertDialog` (work in progress). The plate, scrim and layout are the `dialog` recipe's; the `alert-dialog` recipe adds the text gap, and the refusal is the system's refusal spring.

## Use it for

- Confirming something that loses work or can't easily be undone: "Delete 3 regions?", "Discard this draft?".

## Don't use it for

- Anything with Undo (just do it and offer Undo in a toast), information (use a toast), or a form (use a dialog).

## Anatomy

- Plate: the dialog's (360 wide, padding 20, near the top of the viewport) over its scrim.
- Title: the question. Description: what happens if you agree, 4 below it, body type, ink2.
- Actions: Cancel, then the confirm button last (destructive red for a loss).

## States and motion

| State | Look | Motion |
|---|---|---|
| opening | scrim and plate | the dialog's rise on the surface spring |
| open | focus on Cancel | – |
| click outside | it stays | the plate shakes once on the refusal spring, one nest (6) aside |
| Cancel or Esc | closes, nothing done | release spring |
| confirm | runs, then closes | release spring |

Reduce Motion: no shake; the rise is a crossfade.

## API

| React | SwiftUI |
|---|---|
| `AlertDialog.Root` `open`, `onOpenChange` | `isPresented:` |
| `AlertDialog.Popup` forwards typed Base UI `initialFocus` / `finalFocus`; `Title`, `Description`, `Actions` | `title:`, `message:` |
| `AlertDialog.Cancel` (children: its label) | `cancel:` |
| `AlertDialog.Confirm` `onClick`, `tone` (`destructive`, `primary`), `icon`, `hold` | `confirm:`, `role: .destructive` |

## Keyboard and accessibility

- An `alertdialog` named by its title and described by its description. Focus is trapped inside and starts on Cancel; Esc is Cancel; focus returns to what opened it.

## Rules

- The title is the question; the confirm button says the action ("Delete regions"), never "OK" or "Yes".
- Say what is lost in the description. If nothing is lost, it is not an alert dialog.
- A click outside is refused, not obeyed: the shake says an answer is needed.

For permanent loss, Confirm may pass `hold` and a `trash` icon. Button blocks short clicks before Base UI's Close handler runs, so early release leaves the question open. Space and Enter use the same hold; completion fires the action once, then closes. The cancel button remains initially focused. The host can pass `hold={false}` for an ordinary single-pointer confirm; the question still guards the action. Never require holding for an undoable delete.
