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

`styles.css` contains the compiled component utilities and material tokens; import it once. It does not include a global CSS reset. Import `icons.css` or `icons/life.css` for the icon set you use. Set `data-mu-colorway="bone"` or `"graphite"` on an ancestor to choose a colorway; otherwise the system preference applies.

MetalUI also ships [SwiftUI through Swift Package Manager](https://github.com/vijayksingh/metalui#swiftui), [source for the shadcn registry](https://metalui.dev), and [agent guides](https://metalui.dev/AI.md). See [documentation](https://metalui.dev) and [source](https://github.com/vijayksingh/metalui). MIT licensed.
