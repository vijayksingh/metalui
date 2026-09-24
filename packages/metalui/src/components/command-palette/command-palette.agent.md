# Command palette

⌘K: lenses and actions in one field. React: `CommandPalette` from `@unlocalhosted/metalui` (Base UI Dialog around an inline Base UI Combobox). SwiftUI: `MetalCommandPalette` with `MetalCommandPaletteItem`. Sheet reference: KAMUI-06; Kamui brief: 04 §3; behaviour: the medium demo's `openPalette()`.

## Use it for

- Asking the canvas a question (a lens: "open tasks", "#poster", "this week"), jumping to a fragment, and running any command by name.
- The one place every action with a key is discoverable: show its key on the row.

## Don't use it for

- Picking a value in a form (use a select or combobox field).
- Confirming a destructive action: the palette runs it; the result carries Undo in a toast.

## Anatomy

- **Scrim**: the page at .25 behind; a click on it closes.
- **Plate**: 560 wide (to 32 short of the window), the plate frost (`.mu-frost-plate`, raise), radius 24, padding 6, 16 % down the window.
- **Field**: a 44 well, radius 17, a 15 search glyph in ink3, the query in the content role (15) with a green-deep caret, a `⎋` keycap at the right.
- **Section**: a label engraving and its count: LENS, LENSES, FRAGMENTS, ACTIONS.
- **Row**: 36 tall at the row radius (12), the ui role, a 14 glyph in ink2, the label (matches weight 650 with a 1.5 green underline), a keycap or a readout engraving at the right. Destructive rows are red.
- **Selected row**: a raised cap (`--mu-row-on-bg`, `raise-sm`) with a 2.5 green-deep bar at the left.
- **Footer**: `↑ ↓ MOVE · ↩ OPEN · ⇧↩ PIN` in keycaps and engravings over an engraved rule; where answers come from at the right ("NATURAL LANGUAGE VIA JEV" or "JEV OFFLINE · KEYWORDS ONLY").

## States and motion

| State | Look | Motion |
|---|---|---|
| opens | plate over the scrim, focus in the field | rises one nest (y −6, .985) on surface; Reduce Motion: fades |
| typing | rows refilter; the first row is selected | instant |
| ↑ ↓ / hover | the selection moves (hover moves it too) | instant |
| ↩ | runs the selected row, closes | closes on release |
| ⇧↩ | runs it pinned (a lens kept as a region) | – |
| ⎋ / scrim | closes, nothing runs | release |
| empty | "Nothing matches" in ink3 | – |

## API

```tsx
const [open, setOpen] = useState(false);
const [q, setQ] = useState('');
const rows: CommandPaletteItem[] = [
  ...(q ? [{ id: 'lens:' + q, section: 'LENS', label: `See “${q}”`, icon: <SearchIcon size={14} />, hint: 'RULES' }] : []),
  { id: 'open-tasks', section: 'LENSES', label: 'open tasks', icon: <TaskIcon size={14} /> },
  { id: 'undo', section: 'ACTIONS', label: 'Undo', icon: <UndoIcon size={14} />, hint: <Kbd size="small">⌘Z</Kbd> },
  { id: 'clear', section: 'ACTIONS', label: 'Clear Canvas', icon: <TrashIcon size={14} />, danger: true },
];
<CommandPalette open={open} onOpenChange={setOpen} query={q} onQueryChange={setQ} items={rows}
  icon={<SearchIcon size={15} />} status="NATURAL LANGUAGE VIA JEV"
  onRun={(item, { pin }) => run(item.id, pin)} />
```

Rows of one section must be adjacent. The palette filters by every query word against `label` and `keywords`; pass `filter={false}` when the host ranks rows itself.

## Rules

- A row that has a key shows it; a destructive row is red and its result has Undo.
- Say where answers come from in the footer; never hide that Jev is offline.
- The selection is instant: rows are scanned, not watched.

## Accessibility

- Dialog with a label; the field is a combobox and the list a listbox (Base UI): arrows move `aria-activedescendant`, ↩ runs, ⎋ closes and focus returns to the trigger.
- Sections are groups labelled by their engraving. Keycaps speak their names (`⎋` "Escape").

## Tokens

`--mu-palette-*`, `--mu-row-on-bg`, `--mu-scrim`, `.mu-frost-plate`, `--mu-well*`, `--mu-raise-sm`, `--mu-engrave`, `--mu-green-deep`, `--mu-red`, `--mu-spring-surface`, `--mu-travel-surface`. Swift: `MetalPaletteMetrics`, `MetalFrost.plate`.
