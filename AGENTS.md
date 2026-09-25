# MetalUI agent rules

MetalUI is an open-source React and SwiftUI component library in the "Soft Hardware" style. Read `docs/PLAN.md` before you change structure. Production is `https://metalui.dev`. On npm it is `@unlocalhosted/metalui`, and on GitHub it is `vijayksingh/metalui`.

## Layout

```
apps/docs/                 metalui.dev: Vite + React Router + Tailwind v4 + DialKit
  src/app/                 shell, navigation, colorway
  src/pages/               one file per route (foundations/*, components/*, icons)
  src/ui/                  docs-only building blocks (PageHeader, Section, Bench, Rules, Code)
packages/metalui/          the published package, @unlocalhosted/metalui
  src/components/<name>/   <name>.tsx, <name>.css, <name>.agent.md, meta.json
  src/components/tokens.css, theme.css   generated (--mu-* variables; Tailwind @theme)
  src/icons/               Icon runtime + generated catalog, CSS and components
  icons/src/               icon geometry and motion source (icons.mjs, tuned16.mjs)
  public/                  generated registry (r/), icon SVGs, AI.md, llms.txt, manifests
tokens/tokens.json         the one source for materials, colorways, springs and foundations
swift/ + Package.swift     MetalUI for SwiftUI (tokens generated from tokens.json)
scripts/                   generators: tokens, icons (product + life), SF Symbols, registry, agent docs
e2e/                       Playwright feature slices; captures land in docs/captures/
```

## Load-bearing rules

- **One source per fact.** Tokens live in `tokens/tokens.json` and icons in `packages/metalui/icons/src/icons.mjs`. Never hand-edit generated files (`tokens.css`, `theme.css`, `*.generated.*`, `MetalTokens.generated.swift`, `public/`); run `npm run generate`.
- **Six layers** (`docs/COMPOSITION.md`): Foundations → Parts → Components → Objects → Instruments → Places. Parts are pieces with a look and no job (well, plate, label, glyph, LED, keycap). Components are controls you operate (button, select, tabs). Objects are things with a body that stand for a person's stuff (folder, card, connector). Instruments exist only while you act (selection frame, lasso, cursor). Places have area and hold objects (region, lens, the past). Everything is Soft Hardware, so "it looks physical" never decides the layer; what it is to the person does. Place every new thing with the tests in that document before building it, and never call anything a "primitive".
- **Foundations first, then one component at a time.** Follow the owner's global rules: atomic layered changes, every state and transition of a component thought through before the next one starts.
- **Every component ships three things together:** React (`.tsx` + `.css`), SwiftUI (`swift/Sources/MetalUI/Components/Metal<Name>.swift`) and the agent guide (`<name>.agent.md`), plus `meta.json` and a docs page under `apps/docs/src/pages/components/`.
- **React components wrap Base UI.** Don't reimplement focus management, keyboard handling or ARIA that a Base UI part already provides. The component layer moves to Tailwind v4 utilities from `theme.css`.
- **Swift types are prefixed `Metal`.** Minimum platforms: macOS 14 and iOS 17.
- **Material recipes are shared.** CSS and SwiftUI render the same fill and shadow stack; never tune one platform alone.
- **Tests are integration or e2e only** (Playwright feature slices). No unit tests.
- **X-ray cards are handled, not slid.** Every x-ray card holds a specimen: the real component, changed by handling it, never sliders. Follow `docs/EDITING_LAYER.md` (the Button x-ray is the reference) and build on `apps/docs/src/ui/edit`.
- **Every docs page is real documentation.** No throwaway demo pages. Tunable values go in a DialKit panel on the page.

## Commands

```bash
npm ci
npm run dev          # docs on http://127.0.0.1:4193
npm run generate     # tokens, icons, registry, agent docs
npm run check        # generated files are fresh
npm run symbols      # SF Symbols for both icon sets (macOS, Xcode toolchain); symbols:check to verify
npm run test:e2e     # Playwright feature slices against the docs site
npm run symbols      # SF Symbols for both icon sets (macOS, Xcode toolchain); symbols:check to verify
npm run test:e2e     # Playwright feature slices against the docs site
npm run typecheck
npm run build        # check + package (packages/metalui/dist) + docs (apps/docs/dist)
swift build
```

## Working style

- Make atomic, layered changes: one foundation or one component at a time, finished and reviewed before the next. Run targeted checks, then one full `npm run build` plus `swift build`.
- Commit each coherent chunk with a conventional commit message. Don't push unless asked.
- Visual changes: verify them in the running site in both colorways and with reduced motion before calling them done.
- Don't publish to npm, tag, or deploy without an explicit request.
