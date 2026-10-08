# Settings

An app's settings as sections of rows. React: `Settings` with `Settings.Section`, `Settings.Row`, `Settings.Keys`. SwiftUI: `MetalSettings`. A block: `Surface` (raise-lite, card radius), `Label` (engraved heading, `name`, `detail`), `Rule`, `Kbd`, laid out by the `settings` group.

## Use it for

- The settings view: Sync, Storage, Backup, Shortcuts, Account, the opt-in rows.

## Don't use it for

- Forms that need Save (a dialog), or lists of things you act on (Row).

## Anatomy

- Section: the heading engraved 8 above a raised card; sections 28 apart.
- Row: at least 52 tall, 12 / 18 padding; the name (`Label name`, 13.5 at weight 500) and one short detail sentence (`Label detail`, 12) on the left; one control on the right, 16 away. Both sentences wrap; the control moves below when the text would be narrower than text-min.
- Engraved rules between rows, inset 18 so they align with the text.
- Keys: a shortcut row: what it does, then one keycap per key.

## Controls

- On or off, at once: `Switch`, labelled by the row's name (`aria-labelledby` with the row's `id`).
- One of a few: `Switcher`, compact.
- An action: `Button` with its semantic `icon` (Download backup: `download`; Restore: `undo`). The host owns the backup transport; the row does not serialize or restore application data. Swift hosts use `MetalButton("Download", icon: .download)` / `MetalButton("Restore…", icon: .undo)` in the row’s control builder.
- A value (Storage used): a `Label value-small` or a `SizeReadout`.

## Rules

- One control per row. A row never raises on hover; only its control acts.
- Name and detail wrap. Keep their column at least `settings.text-min` (180); when text, `row-gap`, and control cannot fit, place the control below with `settings.stack-gap` (10). Below 180, the text uses the available row width. React and SwiftUI retain the same control while rearranging.
- The name says what is on, in plain words: "Sync this canvas", not "Enable sync".
- The detail says what it does or what it is now, in one short sentence.
