# Toolbar and tool button

A strip of tools. React: `Toolbar`, `ToolButton`, `ToolbarSeparator`, `ToolbarSearch` from `@unlocalhosted/metalui` (Base UI Toolbar, Toggle and Tooltip). SwiftUI: `MetalToolbar`, `MetalToolButton`, `MetalToolbarSeparator`. Sheet reference: KAMUI-01/02; Kamui brief: 04 §2.

## Use it for

- The canvas's tools (select, write, region, ink) as latched tools, and momentary actions (zoom, undo) beside them; a search well that opens the palette.

## Don't use it for

- Verbs over a selection (use the tool strip) or a form's actions (use buttons).
- Labelled actions: tools are icon-only with tooltips.

## Anatomy

- **Strip**: 48 tall (36 tools in a 6 nest), radius 24, so a true capsule; the strip frost in the colorway, or graphite (`variant="graphite"`) as the medium uses in both colorways.
- **Tool**: a circular 36 cap (the button material), a 16 glyph in the icon ink; latched: pressed (`pressed-bg`, `pressed-sh`) with a 4 pt green LED 5 in from its top right.
- **Separator**: a 1 × 22 engraved rule.
- **Search well**: a 36 tall pill well with the placeholder in ink3 and a `⌘K` keycap.
- **Tooltip**: a graphite label chip with the key, 10 above, after 120 ms: `SELECT · V`.

## States and motion

| State | Look | Motion |
|---|---|---|
| strip enters | – | one nest from its edge on surface |
| hover | ink glyph; the glyph's hover pose (the tool is its trigger) | the icon's own |
| pressed | down 1 into a well | 50 ms, back on release |
| latched | pressed + LED | instant |
| focus | a 1.5 ring, no offset | – |
| disabled | 40 % | – |

## API

```tsx
<Toolbar aria-label="Tools" variant="graphite">
  <ToolButton label="Select" shortcut="V" icon={<SelectIcon size={16} />} pressed={tool === 'select'} onPressedChange={() => setTool('select')} />
  <ToolButton label="Write" shortcut="T" icon={<TextIcon size={16} />} pressed={tool === 'write'} onPressedChange={() => setTool('write')} />
  <ToolbarSeparator />
  <ToolbarSearch onOpen={openPalette} icon={<SearchIcon size={14} />} />
</Toolbar>
```

## Rules

- Icon-only tools always have a tooltip with the key, and an accessible name.
- One latched tool at a time in a group; switching is instant.
- Glyphs from the set at 16: they play their hover from the whole tool.

## Accessibility

- Base UI Toolbar: one tab stop, arrows between tools; latched tools are toggles (`aria-pressed`); keys in `aria-keyshortcuts`.

## Tokens

`--mu-toolbar-*`, `.mu-frost-strip`, `.mu-frost-graphite`, `--mu-btn-*`, `--mu-pressed-*`, `--mu-led-green`, `--mu-radius-card`. Swift: `MetalToolbarMetrics`.
