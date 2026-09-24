# Menu and correction popover

A frosted plate of rows. React: `Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator` from `@unlocalhosted/metalui` (Base UI Menu and Context Menu). SwiftUI: `MetalMenuPanel`, `MetalMenuItem`, `.metalMenu(isPresented:at:heading:items:)`. 

## Use it for

- **The correction popover**: right-click a cue for what it is not ("Not a Task", "Not Coffee", "Ignore “4pm”"), Reset Corrections, Ask Recognizer Again, Gather Similar; the heading is the cue's provenance.
- A "more" button's actions; a block's right-click actions.

## Don't use it for

- Running anything by name: that is the command palette.
- Choosing a value in a form (a select) or switching views (segmented).
- Naming a control (a tooltip).

## Anatomy

- **Plate**: `--mu-menu-bg` (frost-strong at .92), `raise`, radius plate (18), padding 6, at least 200 wide; 6 from its trigger, or at the pointer and kept 8 inside the window.
- **Heading** (optional): the label role, engraved: what the menu acts on.
- **Row**: 30 tall at the row radius (12, the plate nests 6), the ui role, a 14 glyph in ink2, the key on a small cap at the right. Destructive: red.
- **Separator**: an engraved 1 rule, inset 5 × 8.

## States and motion

| State | Look | Motion |
|---|---|---|
| opens | plate at the trigger or pointer; focus on the plate (first row on ↓) | fades in on settle; no travel |
| highlighted (pointer or keyboard, one state) | `--mu-menu-row-hover` | instant |
| disabled row | 40 % | – |
| choose (click, ↩) | runs, closes | fades out on release |
| ⎋ / outside | closes, nothing runs; focus back to the trigger | release |
| Reduce Transparency | opaque plate | – |
| Increase Contrast | an edge on the plate and on the highlighted row | – |

## API

```tsx
<ContextMenu heading="NOTE · TASK BY SYNC 0.82" menu={<>
  <MenuItem onSelect={() => correct({ task: false })}>Not a Task</MenuItem>
  <MenuItem onSelect={resetCorrections}>Reset Corrections</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={gatherSimilar} icon={<SearchIcon size={14} />}>Gather Similar</MenuItem>
</>}>
  <span>{cue}</span>
</ContextMenu>

<Menu trigger={<button aria-label="More"><MoreIcon size={16} /></button>}>
  <MenuItem onSelect={duplicate} shortcut="⌘D">Duplicate</MenuItem>
  <MenuItem onSelect={remove} danger shortcut="⌫">Delete</MenuItem>
</Menu>
```

## Rules

- Corrections win and are remembered for that exact text; after one, show a toast with Undo ("Correction remembered · for this exact text").
- Title Case for rows (macOS menus); the heading in the label role.
- One destructive row, last, red; its result has Undo.

## Accessibility

- Base UI Menu: `role="menu"`, rows `menuitem`, ↑ ↓ Home End and type-ahead, ↩ and Space choose, ⎋ closes and returns focus. The heading labels the group of rows.
- The context menu also opens from the keyboard's context-menu key and ⇧F10 on the focused target (the browser's `contextmenu` event).

## Tokens

`--mu-menu-*` (section), `--mu-menu-bg`, `--mu-menu-row-hover` (colorway), `--mu-raise`, `--mu-radius-plate`, `--mu-radius-row`, `--mu-engrave`, `--mu-rule`, `--mu-red`, `--mu-spring-settle`, `--mu-spring-release`. Swift: `MetalMenuMetrics`.
