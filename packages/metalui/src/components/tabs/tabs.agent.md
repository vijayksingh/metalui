# Tabs

Switches which panel is shown. React: `Tabs`, `TabList`, `TabPanel` from `@unlocalhosted/metalui`. SwiftUI: `MetalTabs`.

## Use it for

- Options that each own a panel: source views (React / Agent guide), the pages of a settings sheet, views of one object.

## Don't use it for

- Picking a value with no panel of its own (pen or marker, a connector look): `Switcher`.
- More than five or six options, or long labels: a `Select` or a side list.
- Moving between pages of the app: navigation links.

## Anatomy

`Tabs` holds the active tab. `TabList` is the switcher track: a well, tabs in ink2, the active tab a raised thumb in ink. One `TabPanel` per tab, anywhere inside `Tabs` (the list can sit in a head bar, the panel below).

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the track; active tab on the thumb | – |
| hover | label ink | .16 s |
| switch | thumb on the new tab | part spring glide, may overshoot against the end |
| new panel | – | 6 px drift from the side the thumb went, and a fade, settle spring |
| first panel | – | none |
| focus | 1.5 ring on the tab | – |
| disabled | 40 % | – |

Keys: ← → move and choose, Home / End jump, Tab goes into the panel. Reduce Motion: the thumb moves at once, the panel only fades.

## API

`<Tabs orientation ("horizontal" | "vertical") value onValueChange defaultValue>` · `<TabList items size ("regular" 28 | "compact" 24) aria-label />` · `<TabPanel value keepMounted>`

`items` is `[{ value, label, icon?, disabled? }]`.

Vertical tabs use Up/Down, Home/End and the same Base UI focus rules; Left/Right belong to horizontal tabs. The panel drifts along the selected axis. Track radius is derived from the row height plus its nest, with no new dimensions. Swift MetalTabs `orientation: .vertical` uses the same track material and native tab accessibility. Each item may describe a held or dirty state with `aria-describedby`.

Base UI keeps disabled tabs arrow-reachable while refusing activation; give them `aria-describedby` when a reason helps. Native tab controls follow platform keyboard behavior. Never reinterpret a disabled tab as a panel switch.
