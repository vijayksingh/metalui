# MetalUI agent rules

MetalUI is an open-source React and SwiftUI component library in the "Soft Hardware" style. Read `docs/PLAN.md` before you change structure. Production is `https://metalui.dev`. On npm it is `@unlocalhosted/metalui`, and on GitHub it is `vijayksingh/metalui`.

## Load-bearing rules

- **One source per fact.** Tokens live in `tokens/tokens.json`. Never hand-edit `components/tokens.css` or `swift/Sources/MetalUI/Tokens/MetalTokens.generated.swift`; run `npm run tokens` instead.
- **Every component ships three things together**, and they are changed together:
  - React: `components/<name>/<name>.tsx` + `.css`
  - SwiftUI: `swift/Sources/MetalUI/Components/Metal<Name>.swift`
  - Agent guide: `components/<name>/<name>.agent.md`

  Plus `meta.json` and a `.demo.tsx`. A change to behavior or API updates all of them.
- **React components wrap Base UI.** Don't reimplement focus management, keyboard handling, or ARIA that a Base UI part already provides. Style through `mu-*` classes and Base UI data attributes.
- **Component files are copy-paste artifacts.** A component `.tsx` imports only `react`, `@base-ui/react/*`, and its own `.css`. The `.css` imports only `../tokens.css`. No shared internal helpers.
- **Swift types are prefixed `Metal`** (`MetalButton`, `MetalButtonStyle`) so they don't clash with SwiftUI names. Minimum platforms: macOS 14 and iOS 17.
- **Material recipes are shared.** CSS and SwiftUI render the same fill and shadow stack. Don't tweak a shadow on one platform only.
- **Motion:** springs come from tokens. Under reduced motion, transitions are instant, but press travel stays because it is feedback.
- **Generated outputs are committed:** `public/r/*.json`, `public/AI.md`, `public/llms.txt`, `public/components.json`. Regenerate them with `npm run generate`. `npm run check` fails when they are stale.

## Commands

```bash
npm ci
npm run generate     # tokens, registry, agent docs
npm run check        # generated files are fresh
npm run typecheck
npm test
npm run build        # package (dist/) + site (site-dist/)
npm run dev          # site on http://127.0.0.1:4193
swift build
swift test
```

## Working style

- Work in coherent batches, for example one component with all three of its artifacts. Run targeted checks, then one full `npm run build` plus `swift build`.
- Commit each coherent chunk with a conventional commit message. Don't push unless asked.
- Visual changes: verify them in the running site in both colorways and with reduced motion before calling them done.
- Don't publish to npm, tag, or deploy without an explicit request.
