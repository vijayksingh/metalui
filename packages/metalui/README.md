# MetalUI

Soft Hardware components and animated icons for React. Alpha release; APIs may change before 1.0.

```sh
npm install @unlocalhosted/metalui
```

```tsx
import '@unlocalhosted/metalui/styles.css';
import '@unlocalhosted/metalui/icons.css';
import { Button } from '@unlocalhosted/metalui';
import { SendAwayIcon } from '@unlocalhosted/metalui/icons';

<Button cap="primary"><SendAwayIcon size={16} />New canvas</Button>
```

The package is ESM only (no `require()`; use `import`). Using Tailwind v3? Import `@unlocalhosted/metalui/styles.unlayered.css` instead of `styles.css`: the same rules without the cascade layers that Tailwind v3's PostCSS plugin rejects. `styles.css` contains the compiled component utilities and material tokens; import it once. It does not include a global CSS reset. Import `icons.css` or `icons/life.css` for the icon set you use. Set `data-mu-colorway="bone"` or `"graphite"` on an ancestor to choose a colorway; otherwise the system preference applies.

MetalUI also ships [SwiftUI through Swift Package Manager](https://github.com/vijayksingh/metalui#swiftui), [source for the shadcn registry](https://metalui.dev), and [agent guides](https://metalui.dev/AI.md). See [documentation](https://metalui.dev) and [source](https://github.com/vijayksingh/metalui). MIT licensed.

## Layout and spacing

New in the current checkout; not yet published. The source build provides three layout classes: `mu-stack` for vertical content, `mu-cluster` for wrapping rows, and `mu-auto-grid` for columns that fit their parent. Compose existing controls with semantic gaps (`gap-mu-related`, `gap-mu-group`, `gap-mu-section`) or approved steps such as `gap-mu-space-8` and `p-mu-space-24`.

```tsx
<div className="mu-stack gap-mu-group p-mu-space-24">
  <div className="mu-cluster gap-mu-space-8">
    <Button>Cancel</Button>
    <Button cap="primary">Save</Button>
  </div>
</div>
```

The precompiled build includes these base layouts, semantic gap aliases, and the approved `gap`, `p`, `px`, and `py` step families. Other spacing families and application-specific Tailwind v4 variants require a consumer Tailwind build: import `tokens.css` and `theme.css` after `tailwindcss` in your CSS entry and let Tailwind scan complete class names. Responsive container variants require an ancestor query container. The package leaves the host's spacing scale, fonts, and reset alone.

See the [CSS system guide](https://github.com/vijayksingh/metalui/blob/main/docs/CSS_SYSTEM.md) for token sources, intrinsic grids, typography rhythm, override rules, and guidance for coding agents. This describes the repository build; check your installed release before relying on newly added utilities.
