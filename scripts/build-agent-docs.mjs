// Agent context: public/AI.md (full guide), public/llms.txt (index), public/components.json (manifest).
import { readFileSync } from 'node:fs';
import { root, emit, finish } from './lib/emit.mjs';
import { components } from './lib/components.mjs';

const ORIGIN = 'https://metalui.dev';
const list = components();
const icons = JSON.parse(readFileSync(root('packages/metalui/public/icons.json'), 'utf8'));
// Repository and public agents read the same CSS contract; do not maintain a second summary.
const cssSystem = readFileSync(root('docs/CSS_SYSTEM.md'), 'utf8').trim()
  .replace(/\]\((COMPOSITION|PERFORMANCE)\.md\)/g, (_, name) => `](https://github.com/vijayksingh/metalui/blob/main/docs/${name}.md)`);

const intro = `# MetalUI: agent integration guide

MetalUI is a set of Soft Hardware components: bone and graphite soft-touch plastic, smoked glass, knurled metal, LEDs, and press-in mechanics. Each component exists as React on Base UI (\`@unlocalhosted/metalui\`) and as SwiftUI (the \`MetalUI\` Swift package), and the two render the same material recipes.

## Setup

React:

\`\`\`sh
npm install @unlocalhosted/metalui
\`\`\`

\`\`\`tsx
import '@unlocalhosted/metalui/styles.css'; // once, at the app root
import '@unlocalhosted/metalui/icons.css';  // once, if you use icons
\`\`\`

The package is ESM only: use \`import\`, not \`require()\`. In a Tailwind v3 app import \`@unlocalhosted/metalui/styles.unlayered.css\` instead of \`styles.css\` (the same rules without cascade layers, which Tailwind v3's PostCSS rejects). Components are client components (they carry \`"use client"\`), so they work in Next.js App Router.

Or copy the source into your project with the shadcn CLI (Tailwind v4): \`npx shadcn@latest add ${ORIGIN}/r/<name>.json\`. The first install also adds \`@unlocalhosted/metalui\` and imports its \`tokens.css\` and \`theme.css\` into your global CSS, which is what styles the copied component; files land under \`components/metalui/\` in the same layout as the package, so imports between components resolve. Whole screens (blocks) install the same way as \`${ORIGIN}/r/block-<name>.json\` into \`components/metalui/screens/<name>/\`. Both routes work in Vite and Next.js (\`app/\` and \`src/app/\`). Release notes: ${ORIGIN}/changelog.

SwiftUI: add the package \`https://github.com/vijayksingh/metalui\` and \`import MetalUI\`. It needs macOS 14 or iOS 17.

## Global rules

- **Colorway:** set \`data-mu-colorway="bone" | "graphite"\` on any ancestor, or use \`.metalColorway(.bone)\` in SwiftUI. Without it, the system color scheme decides. Don't restyle materials with custom backgrounds, borders or shadows.
- **Signal color:** one per object, at most. Phosphor green marks intent (focus, selection, live state), never a call to action. Red is destructive only. \`--mu-success\` always sits beside a check glyph and \`--mu-warning\` beside a label or glyph, never hue alone. \`--mu-photon\` is for its listed places only. Status LEDs: green on, amber waiting, red failed, blue capture or link kind, off idle.
- **Feelings tints** (\`.mu-tint-ember | blush | tide | spark | graphite | dusk | iris\`, SwiftUI \`.metalTint(.blush)\`): only on glyphs that carry a feeling, or a moment with an unmistakable one (a date is affection, a party is joy). The tint names the kind of feeling (joy, affection, calm, wonder, neutral, low, tension), never its strength, which the glyph's shape shows. The tint colors the glyph's stroke, so the line itself evokes the feeling; a tinted glyph's vessel is not filled. Never red or green, never on words, never for status or intent. Off under Increase Contrast and inside \`data-mu-untinted\` (\`.metalUntinted()\`), so the glyph must read without it.
- **Motion:** it comes from the component, and reduced motion is built in. Don't add your own transitions on top. Under Reduce Motion each spring class resolves one way (\`tokens.json\` \`springs.*.reduced\`): part, object, hinge and refusal apply at once; surface and settle lose travel and fade in place; release (the press) plays as authored. Lift is two motions (T5): a hover lift rides \`settle\` (one step, no overshoot, still by the time the pointer leaves); a land (a drop into place) rides \`object\`, a stop, and rare. Web: ride \`--mu-spring-<class>-d\` and multiply enter or exit offsets by \`--mu-travel-<class>\`; \`data-mu-motion=\"reduce\"\` on any ancestor forces the policy. SwiftUI: \`.metalAnimation(.settle, value:)\` or \`MetalMotion.resolve(_:reduceMotion:)\`, never \`accessibilityReduceMotion\` directly.
- **Read motion policy:** \`motionReduced(element)\` combines the OS preference with \`data-mu-motion="reduce"\` on an ancestor and the docs site motion switch. \`useReducedMotion(element)\` subscribes to live changes for rendering; both are SSR safe.
- **Remove a row:** \`leaveRow(element, onLeft, { onStart })\` uses the release spring and the row's own nest distance. Capture neighboring bounds in \`onStart\`, remove in \`onLeft\`, and cancel on unmount. OS or scoped Reduce Motion removes rows immediately; the release spring for a pressed cap remains unchanged.
- **Carry a colorway through a portal:** \`usePortalColorway(anchorElement)\` reads the nearest explicit ancestor colorway and follows changes. Copy its result to \`data-mu-colorway\` on the portalled positioner; keep the popup outside clipping containers. SwiftUI carries \`.metalColorway()\` through its environment.
- **Choose by component name.** Only use exports listed in \`components.json\` and \`icons.json\`. Never invent names.
- **Show real outcomes.** An animation never stands in for a real result such as a save, delete or sync.

---

${cssSystem}

---

## Components
`;

const iconsDoc = `
---

# Icons

\`@unlocalhosted/metalui/icons\` has ${icons.count} Soft Hardware glyphs: monoline + duotone on a 24×24 grid, with a 1.7 stroke. Each glyph has an authored one-shot act on hover or press, then rests. Icons inherit \`currentColor\`. A static icon (\`animate={false}\`) at 16px or below uses a tuned small cut with a heavier stroke.

\`\`\`tsx
import { SendAwayIcon, Icon } from '@unlocalhosted/metalui/icons';

<Button cap="destructive"><SendAwayIcon size={16} />Delete</Button>
<Icon name="synced" size={13} title="Synced" />
\`\`\`

- **Status and environment:** \`info\` names information; \`warning\` names a warning with its triangular enclosure. Morph \`sun\` ↔ \`moon\` when changing colorway. \`sidebar\` describes a rail in a fixed window; turn 180 for a rail on the right. Always retain a visible or accessible status label.
- **Adjustment and visibility:** \`settings\` adjusts values; \`filter\` narrows results; \`sort\` orders rows (turn for the reverse order). Morph \`eye\` ↔ \`eye-off\` when the same key changes visibility; \`lock\` describes access. The eye enclosure stays recognizable behind its shutter.
- **Transfer and record:** \`save\` retains a document; \`download\` receives into this device; \`upload\` transfers to the service; \`send\` dispatches a message. \`copy\` takes a paper copy to the clipboard (\`paste\` retrieves it, \`duplicate\` creates another object). \`external\` opens another context. Pair the glyph with the action verb.
- **Triggering:** an icon inside any element with the class \`mu-icon-trigger\` plays from that element, and MetalUI Buttons already have it. Otherwise the icon plays from its own hover and press.
- **Accessibility:** icons without \`title\` are decorative (\`aria-hidden\`). Give icon-only controls an \`aria-label\`.
- **State glyphs morph:** \`MorphIcon\` (copy, check, plus, close, minus, menu, arrows, chevrons, play/pause, download/upload) transforms into another state glyph instead of being replaced: \`<MorphIcon name={copied ? 'check' : 'copy'} size={14} />\`.
- **Static:** \`animate={false}\` keeps a glyph static. Reduced motion does this automatically.
- **SwiftUI and SVG:** the same glyphs ship as custom SF Symbols, plus static and animated SVGs at \`${ORIGIN}/icons/svg/<name>.svg\`.

| Component | Name | Category | Hover | Press |
|---|---|---|---|---|
${icons.icons.map((i) => `| \`${i.component}\` | \`${i.name}\` | ${i.category} | ${i.hover} | ${i.press} |`).join('\n')}
`;

const guides = list.map((m) => readFileSync(root('packages/metalui/src', m.dir, m.agent ?? `${m.name}.agent.md`), 'utf8').trim()).join('\n\n---\n\n');

emit('packages/metalui/public/AI.md', `${intro}\n${guides}\n${iconsDoc}`);

emit('packages/metalui/public/llms.txt', `# MetalUI

> Soft Hardware components for React (on Base UI) and SwiftUI, with animated duotone icons. Every component ships React, SwiftUI and an agent guide.

- [Full agent guide](${ORIGIN}/AI.md)
- [Component manifest](${ORIGIN}/components.json)
- [Icon manifest](${ORIGIN}/icons.json)
- [Changelog](${ORIGIN}/changelog)
- [Spacing and layout foundations](${ORIGIN}/foundations/spacing): shared Tailwind layout rules; full extension contract in the agent guide.

## Install

- React from npm (ESM only): \`npm install @unlocalhosted/metalui\`, then import \`@unlocalhosted/metalui/styles.css\` once.
- React source into your project (Tailwind v4): \`npx shadcn@latest add ${ORIGIN}/r/<name>.json\`; whole screens as \`${ORIGIN}/r/block-<name>.json\` (settings, task-inbox, share-panel, ai-composer, availability-picker, studio-week).
- SwiftUI: add \`https://github.com/vijayksingh/metalui\` with Swift Package Manager (macOS 14 or iOS 17).

## Components

${list.map((m) => `- [${m.title}](${ORIGIN}/r/${m.name}.md): ${m.description}`).join('\n')}
`);

emit('packages/metalui/public/components.json', JSON.stringify({
  $description: 'MetalUI components. Each has a React export, a SwiftUI symbol, a shadcn registry item and an agent guide.',
  components: list.map((m) => ({
    name: m.name,
    title: m.title,
    status: m.status,
    description: m.description,
    react: { package: '@unlocalhosted/metalui', export: m.react.export, base: m.base },
    swift: { package: 'MetalUI', symbol: m.swift.symbol },
    registry: `${ORIGIN}/r/${m.name}.json`,
    agent: `${ORIGIN}/r/${m.name}.md`,
    sheet: m.sheet,
  })),
}, null, 2) + '\n');
finish(`agent docs (${list.length} components)`);
