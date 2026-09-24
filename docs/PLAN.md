# MetalUI plan

MetalUI publishes Kamui's approved "Soft Hardware" direction as an open-source component library. It covers bone and graphite soft-touch plastic, smoked glass, knurled metal, LEDs, and press-in mechanics. Every component ships in three forms:

1. **React (JSX)**: built on [Base UI](https://base-ui.com) (`@base-ui/react`). It can be copied from metalui.dev, installed from npm, or pulled through the shadcn registry.
2. **SwiftUI**: `import MetalUI` over SwiftPM, or copied from metalui.dev.
3. **Agent guide**: `<name>.agent.md` covers when to use the component and when not to, its anatomy, API, accessibility contract, tokens, and do's and don'ts. All the guides are aggregated into `AI.md`, `llms.txt`, and `components.json`.

## Owner decisions (2026-09-24)

| Topic | Decision |
|---|---|
| Name / domain | MetalUI, metalui.dev |
| Repository | `github.com/vijayksingh/metalui` (MIT) |
| npm | `@unlocalhosted/metalui`: one package with subpath exports, like `@unlocalhosted/dither-icons` |
| React distribution | npm package **and** shadcn registry (`npx shadcn add https://metalui.dev/r/<name>.json`) |
| Icons | Soft Hardware monoline + duotone style, with per-icon motion and dithered.dev-grade tooling. Starts from Kamui's 31 glyphs and grows to about 100 generic glyphs. Shipped as `@unlocalhosted/metalui/icons` and as SF Symbols. |
| Kamui-specific objects | Generalized. Keeper (mascot) and the canvas widget skins stay in Kamui. The `keeper` *icon* stays, since it is one of the 31 approved glyphs. |
| Visual source of truth | The object sheet (`sheet/index.html`, Rev B) is the spec. Tokens are its resolved CSS values, copied verbatim. A component is done only when its computed styles match the sheet. Kamui's app must match the same sheet, which it will by consuming MetalUI (phase 8). |
| Icon workflow | Every icon goes through `/interface-craft` (storyboard: a storyboard comment and timing per icon, generated into `catalog.generated.ts`) and `/impeccable` (craft floor). No critique cycles. |
| Styling (component layer) | Tailwind v4, the styling Base UI documents: an `@theme` generated from the Soft Hardware foundations, with Base UI state attributes styled through data-attribute variants. The foundations are approved first (kamui `design/soft-hardware/FOUNDATIONS.md`). |
| Tests | Integration and e2e only (Playwright feature slices). No unit tests; the current render tests will be replaced. |

## Source material

This comes from the Kamui repository, `design/soft-hardware/`, which the owner approved on 2026-09-23:

- `sheet/index.html` and `sheet/TOKENS.md`: KAMUI-01…20 objects and the exact Rev B material recipes
- `DIRECTION.md` and `SOFTNESS.md`: rules for materials, light, mechanics, and colorways
- `icons/src/icons.mjs`: the geometry and motion of the 31 glyphs, plus the SVG and SF Symbol exporters
- `widgets/*`: widget specs (checklist, kanban, text, technical, visual)
- `Sources/Design/KamuiUI/*.swift`: the existing SwiftUI implementation, about 4.7k lines, which gets ported with a `Kamui` → `Metal` rename

## Repository layout

```
Package.swift              SwiftPM at the root, so apps can install from the git URL
tokens/tokens.json         the single source for colorways, materials, signals, radii, type, and springs
components/tokens.css      generated CSS custom properties (--mu-*)
components/<name>/         one folder per component:
  <name>.tsx               React on Base UI; self-contained and copyable
  <name>.css               plain CSS keyed off Base UI data attributes; imports ../tokens.css
  <name>.demo.tsx          live demo on the site
  <name>.agent.md          agent guide
  meta.json                manifest: Base UI part, Swift symbol, sheet reference, status
swift/Sources/MetalUI/     SwiftUI: Foundation (recipe renderer, colorway), Tokens (generated), Components
src/index.ts               the npm entry, re-exporting components/*
site/                      metalui.dev (Vite + React)
scripts/                   generators for tokens, the registry, and agent docs
public/                    generated registry (r/*.json), AI.md, llms.txt, components.json
```

Registry targets mirror the repository layout (`components/metalui/<name>/…`, `components/metalui/tokens.css`), so the relative CSS imports keep working in a consumer's project.

## Styling contract

- Plain CSS, no Tailwind requirement. Class names are `mu-<name>` and variants are data attributes (`data-cap`, `data-size`). State comes from Base UI attributes (`data-disabled`, `data-pressed`, `data-checked`, `data-open`, …).
- Colorways use `data-mu-colorway="bone" | "graphite"` on any ancestor. With no attribute set, `prefers-color-scheme` decides.
- Materials are recipes: a fill gradient plus an ordered shadow stack. The same recipe renders as CSS `box-shadow` and as SwiftUI layered shadows, both generated from `tokens.json`.
- Springs are analytic damped springs. CSS gets them as sampled `linear()` curves; SwiftUI gets them as `.interpolatingSpring(stiffness:damping:)`.
- Reduced motion makes every transition instant. Press travel stays, because it is feedback.

## Component inventory

Sheet references are KAMUI-NN from the Kamui object sheet.

### Foundations
Surface (raised, raised-small, well, frosted, glass, metal) · LED · Kbd/keycap · Separator (engraved rule) · Engraved label · Focus ring

### Base UI components
| MetalUI | Base UI | Sheet |
|---|---|---|
| Button (standard, primary, destructive caps) | Button | 15 |
| Toggle / ToolButton (latched + LED) | Toggle | 01 |
| Toolbar (frosted rubber strip) | Toolbar | 01/02 |
| Segmented control | ToggleGroup / Tabs.Indicator | 04 |
| Dial (knurled, detents) | Slider | 05 |
| Switch | Switch | 15 |
| Checkbox, Checkbox group | Checkbox | 08 |
| Radio group | Radio | – |
| Search well / Input / Field | Input, Field, Fieldset, Form | 18 |
| Number field | NumberField | 05 |
| Select | Select | – |
| Menu, Context menu, Menubar | Menu, ContextMenu, Menubar | 06 |
| Command palette | Dialog + Combobox | 06 |
| Popover, Tooltip, Preview card | Popover, Tooltip, PreviewCard | – |
| Dialog, Alert dialog | Dialog, AlertDialog | – |
| Toast | Toast | 20 |
| Accordion / Checklist | Accordion + Checkbox | 08 |
| Tabs | Tabs | – |
| Progress, Meter | Progress, Meter | 16 |
| Scroll area | ScrollArea | – |
| Avatar | Avatar | – |

### Objects (no primitive needed)
Card (soft-touch, borderless at rest) · Glass screen (bezel + smoked glass) · Folder stack · Swatch chip · Signal card (capture chip) · Status badge · Selection frame (KAMUI-14) · Empty state · Size readout

## Quality bar

- Keyboard, focus, and ARIA behavior come from Base UI. Every component's agent guide states its accessibility contract.
- Both colorways, reduced motion, reduced transparency, and increased contrast.
- React tests (server render and state attributes) and Playwright visual snapshots in both colorways.
- Swift snapshot tests.
- A token-parity check: the generated CSS and Swift must match `tokens.json` (`npm run check`).
- A size budget per component.

## Phases

1. **Scaffold** ✅: repo, token pipeline (CSS + Swift), Button end to end (React, SwiftUI, agent guide, registry, site page), all 31 icons with their authored motion, tests.

**Parity gate (every component):** (a) the web component's computed styles equal the sheet element's in both colorways, checked in the browser; (b) a SwiftUI `ImageRenderer` snapshot sits beside the sheet crop for review; (c) the Kamui app's use of the component, once it adopts MetalUI, is screenshotted against the same crop.
2. **Foundations**: Surface, LED, Kbd, Separator, Engraved label.
3. **Base UI components**: the table above, in the order Toggle/Toolbar, Switch, Checkbox, Segmented, Dial, Field/Search, Menu, Popover/Tooltip, Dialog, Toast, Command palette, then the rest.
4. **Objects**: Card, Glass screen, Folder stack, Swatch, Signal card, Selection frame, Empty state.
5. **Icons**: port `icons.mjs`, then React components with hover and press motion, `icons.json`, SVG export, SF Symbols, and a Swift `MetalIcon`. Grow the set to about 100.
6. **Site**: metalui.dev, with a React / SwiftUI / Agent tab and copy buttons on each component page, a colorway switch, search, and an icon gallery.
7. **Release 0.1**: npm trusted publishing, a SwiftPM tag, the public GitHub repo, and a Cloudflare Pages deploy, following the dither-icons release process.
8. **Adoption**: Kamui depends on the MetalUI Swift package instead of `KamuiUI`.
