# Rename editor

A Component: the name field and one confirm operation. `RenameEditor` / `MetalRenameEditor` composes the existing field well and primary key. It is not a popover or dialog; the host chooses either and owns dismissal, persistence and Undo.

## Lifecycle

Capture the name on opening; remount for another session. Focus selects it; a file selects only the basename before the final nonempty extension. `.env` selects all, `.env.local` selects `.env`, `report.final.txt` selects `report.final`. Empty and unchanged names disable Rename. The host supplies duplicate, length and domain validation; an error keeps the field open, draws its invalid ring and says why underneath.

Enter submits through Base UI Form; Escape cancellation and focus restoration belong to the Base UI Popover/Dialog host. The cancel key calls onCancel. While pending, the field locks, repeat confirmation is refused, and onPendingChange(true) lets the host refuse outside/Escape dismissal. Failure stays open with sync-error / Try again and editable field. Success turns the pen into a check and Rename into Renamed on the drum, then calls onDone after the settle has landed and the shared minimum result beat. Spinner arrival/minimum are the existing 400/300ms policy. Reduced motion preserves words/results with no glyph shape travel or drum offset.

onRenamed(name, original) runs after persistence succeeds. Capture that original in the host's toast Undo closure; never read the current name later. A new request captures its own original. Toast copy names the result: Renamed to Lisbon · Undo.

## API

React: value, file, label, validate(name), async onRename(name), onRenamed(name, original), onDone, onCancel, onPendingChange. The forwarded ref targets the input for Base UI initialFocus. Swift matches these names. validate returns the explanation or nil; onRename throws/rejects on failure. The editor adds no arbitrary name limits. Keep its status announcements outside an enclosing aria-busy region.

## Composition

Reuse the internal request lifecycle for actual small edits; do not turn this into a broad public form framework. A rename, Save region, Tag and Comment each retain their own labels, validation and Undo policy. The onDone beat closes a small popup; an in-page form can instead leave the result visible.
