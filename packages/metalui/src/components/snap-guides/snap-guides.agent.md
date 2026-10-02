# Snap guides

The lines that explain a snap while a person moves or resizes an object on the canvas. React: `SnapGuides` from `@unlocalhosted/metalui`. SwiftUI: `MetalSnapGuides`.

## Use it for

- Moving or resizing objects on the canvas, when the core's snap lands an edge or a centre on a neighbour's. Pass the core's `guides` for this frame.

## Don't use it for

- Showing a grid, a ruler or a selection. Guides exist only while something is being moved, and only for the alignments that actually snapped.

## Anatomy

- One line per alignment, in world coordinates, drawn inside the transformed canvas world.
- `presence.guide-width` (1 pt) in `presence.guide` (`#3FB97A`; `presence.guide-dark` `#78D6A5` in Graphite).
- Edges solid; centres dashed `presence.guide-dash` on, the same off (3 / 3).
- Each line spans every aligned object plus `presence.guide-overshoot` (8 pt) at both ends.
- Width, dash and overshoot are screen points: pass the canvas `scale` and they stay the same at every zoom.

## States and motion

| State | Look |
|---|---|
| rest | nothing |
| snapping | the lines for this frame, updated in the same frame as the snap, never animated |
| release | the last lines fade on the release spring, then clear |

Reduce Motion: they clear at once.

## Haptics

`onEngage` fires once when a snap catches a line that was not caught in the previous frame. Staying on a line is silent; letting go is silent; catching a second line while on the first fires again.

- Mac: play `NSHapticFeedbackManager.defaultPerformer.perform(.alignment, performanceTime: .now)` in the same frame as the snap. `MetalSnapGuides` does this itself.
- Web: call `haptic('alignment')` from `onEngage`. It plays what this platform has and returns the path it took:

  | Path | Where | What plays |
  |---|---|---|
  | `'bridge'` | a web view whose host called `setHapticBridge` | the host's native haptic |
  | `'vibrate'` | a touch device with `navigator.vibrate` (Android) | an 8 ms pulse |
  | `'ios-switch'` | iOS Safari 17.4+ (a touch device that knows `<input switch>`) | the system tick, by toggling a hidden switch |
  | `'none'` | everywhere else, including every Mac and PC browser | nothing |

  ```tsx
  import { haptic, SnapGuides } from '@unlocalhosted/metalui';
  <SnapGuides guides={guides} scale={scale} onEngage={() => haptic('alignment')} />
  ```

  Browsers expose no trackpad haptics, so on a Mac the web is silent: say so (the docs demo shows the path), and never replace a haptic with a sound or a flash. Whether the web should stand in for it at all is the owner's decision; until then, the guide's own catch (it lights in the frame of the snap) is the only feedback.

### A web view in a Mac app

MetalUI ships an optional Mac `MetalHapticWebViewBridge`. Retain one per trusted controller and call `detach()` when that host closes. Its weak script handler does not retain the bridge; messages from subframes and unknown kinds are ignored. Install it before loading the page:

```swift
import MetalUI
import WebKit

let configuration = WKWebViewConfiguration()
let haptics = MetalHapticWebViewBridge(configuration.userContentController)
let webView = WKWebView(frame: .zero, configuration: configuration)
// Retain haptics alongside webView. At teardown: haptics.detach().
```

The bundled page opts in explicitly; ordinary browsers and SSR return `null`:

```tsx
import { connectWebKitHaptics } from '@unlocalhosted/metalui';
useEffect(() => connectWebKitHaptics() ?? undefined, []);
```

`connectWebKitHaptics()` installs the `metaluiHaptic` message handler as the `haptic()` transport. Its cleanup clears only its own installation. A later `setHapticBridge()` stays installed if an older host disposes. A disconnected host returns to browser paths; nothing is auto-connected merely because a global exists.

Electron and Tauri use the same typed semantic hook. Electron's preload exposes a fixed `native.haptic(kind)` IPC function; its main process validates the three names and invokes the app's native addon. Tauri exposes a fixed native `haptic` command. Those app-specific native adapters are owned by the host; a Node process cannot call AppKit without an addon.

```ts
import { setHapticBridge } from '@unlocalhosted/metalui';
// Electron preload: haptic: kind => ipcRenderer.send('metalui:haptic', kind)
const disconnect = setHapticBridge(kind => window.native.haptic(kind));
// Tauri host: a registered native command performs the matching pattern.
const disconnectTauri = setHapticBridge(kind => { void invoke('haptic', { kind }); });
// At teardown, call the cleanup belonging to the installed host.
```

The shipped Swift bridge performs the request immediately (`performanceTime: .now`):

| kind | NSHapticFeedbackManager.FeedbackPattern |
|---|---|
| alignment | alignment |
| detent | levelChange |
| refusal | generic |

`MetalHapticWebViewBridge` optionally accepts a `perform` callback for another native device. Tests use it to record pattern delivery from a real WKWebView; transport delivery does not measure a physical trackpad's response. Native apps still depend on available hardware and system settings.

## API

| React | SwiftUI |
|---|---|
| `guides: SnapGuide[]` (`axis`, `position`, `start`, `end`, `kind`) | `guides:` |
| `scale` | `scale:` |
| `onEngage` (call `haptic('alignment')`) | built in (the alignment haptic) |

## Rules

- A guide explains a snap that happened. Never draw one the snap did not use.
- Guides move with the snap in the same frame. A lagging guide would contradict the snap.
- ⌘ held turns snapping off, so there are no guides and no haptic.
- One haptic per new line caught, never one per frame.
