# Settings

An app's settings as sections of rows. React: `Settings` with `Settings.Section`, `Settings.Row`, `Settings.Keys`. SwiftUI: `MetalSettings`. A block: `Surface` (raise-lite, card radius), `Label` (engraved heading, `name`, `detail`), `Rule`, `Kbd`, laid out by the `settings` group.

## Use it for

- The settings view: Sync, Storage, Backup, Shortcuts, Account, the opt-in rows.

## Don't use it for

- Forms that need Save (a dialog), or lists of things you act on (Row).

## Anatomy

- Section: the heading engraved 8 above a raised card; sections 28 apart.
- Row: at least 52 tall, 12 / 18 padding; the name (`Label name`, 13.5 at weight 500) and one short detail line (`Label detail`, 12) on the left; one control on the right, 16 away.
- Engraved rules between rows, inset 18 so they align with the text.
- Keys: a shortcut row: what it does, then one keycap per key.

## Controls

- On or off, at once: `Switch`, labelled by the row's name (`aria-labelledby` with the row's `id`).
- One of a few: `Switcher`, compact.
- An action: `Button` (Download backup, Restore, Upgrade).
- A value (Storage used): a `Label value-small` or a `SizeReadout`.

## Rules

- One control per row. A row never raises on hover; only its control acts.
- The name says what is on, in plain words: "Sync this canvas", not "Enable sync".
- The detail says what it does or what it is now, in one line.
