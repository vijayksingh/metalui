# MetalUI

**Soft Hardware components for React and SwiftUI.**

MetalUI looks like small, well-made physical objects: bone and graphite soft-touch plastic, smoked glass, knurled metal, LEDs, and buttons that press in and spring back. Every component ships three ways:

- **React (JSX)**, built on [Base UI](https://base-ui.com), from npm or copied in through the shadcn registry
- **SwiftUI**, via SwiftPM, rendering the same material recipes
- **An agent guide** that tells coding agents when and how to use the component

Icons come too: Soft Hardware monoline + duotone glyphs, each with its own hover pose and press animation.

[metalui.dev](https://metalui.dev) · [Agent guide](packages/metalui/public/AI.md) · [Plan](docs/PLAN.md) · MIT

> Status: alpha. APIs and visual recipes may change before 1.0. See [docs/PLAN.md](docs/PLAN.md) for the roadmap.

## React

```sh
npm install @unlocalhosted/metalui
```

```tsx
import '@unlocalhosted/metalui/styles.css';
import '@unlocalhosted/metalui/icons.css';
import { Button } from '@unlocalhosted/metalui';
import { SendAwayIcon } from '@unlocalhosted/metalui/icons';

<Button cap="primary">New Canvas</Button>
<Button>Cancel</Button>
<Button cap="destructive"><SendAwayIcon size={16} />Delete</Button>
```

To copy the source into your project instead:

```sh
npx shadcn@latest add https://metalui.dev/r/button.json
```

Colorway: set `data-mu-colorway="bone"` or `"graphite"` on any ancestor. Without it, `prefers-color-scheme` decides.

## SwiftUI

```swift
.package(url: "https://github.com/vijayksingh/metalui", from: "0.1.0")
```

```swift
import MetalUI

MetalButton("New Canvas", cap: .primary) { create() }
    .metalColorway(.graphite)
```

macOS 14+ and iOS 17+.

## For agents

- [`AI.md`](packages/metalui/public/AI.md): the full integration guide
- [`components.json`](packages/metalui/public/components.json) and [`icons.json`](packages/metalui/public/icons.json): exact export names
- `packages/metalui/src/components/<name>/<name>.agent.md`: one guide per component, also served at `metalui.dev/r/<name>.md`

## Develop

```sh
npm ci
npm run dev        # the docs site on http://127.0.0.1:4193
npm run generate   # tokens, icons, registry, agent docs
npm run build
swift build
```

To contribute, open an issue or pull request against `main`. Run `npm run build`, `npm run typecheck`, `npm run verify:package`, and `swift build` before submitting. Release steps live in [docs/RELEASING.md](docs/RELEASING.md); website deployment is documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

The docs site (`apps/docs`) is the design system reference: foundations (color, type, radius, spacing, sizing, elevation, motion), components and icons. Every page has a DialKit panel for tuning its values live.

Tokens live in `tokens/tokens.json`, lifted verbatim from the approved Soft Hardware object sheet. Icons live in `packages/metalui/icons/src/icons.mjs`. Everything else is generated from those two files. See [AGENTS.md](AGENTS.md).
