# Mark

Recognition made visible on the text. React: `Mark`, `MarkUrl`, `MarkInferred`, `MarkUrgency`, `MarkLife` from `@unlocalhosted/metalui` (earlier `Cue`, `CueUrl`, `MarkInferred`, `CueUrgency`, `CueLife`); the checkbox is `Checkbox`. SwiftUI: `Text.metalCue(_:colorway:)`, `MetalCueText`, `MetalCueTag`, `MetalCueURLPill`, `MetalCueInferred`, `MetalCueUrgency`, `MetalCueLife`.

## Use it for

- Marking what a recognizer understood in a person's own writing: a date, a duration, an amount, a measurement, a tag, a colour, a link.
- A task's checkbox in the margin (`Checkbox`), a task the model inferred (`Checkbox ghost`), and urgency (`MarkUrgency`).
- The one life glyph trailing a block (`MarkLife` around a `Life*Icon` at 16).

## Don't use it for

- Changing the text. A cue never rewrites the saved words; full text ink carries tags, whose quiet colour identifies the name.
- Anything the person did not write: a value the model read that is not in the text is a `MarkInferred` pill after the words, never an underline.
- Status, errors or calls to action. Cues are quiet and have no toast, badge or sound.

## Anatomy

| Cue | Rest | While writing |
|---|---|---|
| date | dotted underline green .7, 1.5 thick, offset 3.5; hover chip with the resolved date | same |
| duration · amount | solid quiet underline 1, offset 3.5 (the text's own figures: tabular digits would change the advance) | same |
| measurement | solid green .42 underline 1.5, offset 4 | same |
| tag | raised tab with punched hole; padding 1/4 paid back by margin 0/−4; stable NFC identity tint and full ink | same |
| derived tag | same tab, dashed suggestion until explicitly confirmed | same |
| hex | 3 pt underline in the colour at 78 %, skip-ink off; the 11 pt swatch before it at rest | underline only |
| match | a search's matched words in a result row: weight 650, a green .55 underline 1.5 thick, offset 2.5 (heavier, so result rows only, never writing) | never |
| URL | a 20 tall host pill with the link glyph at 11 | the raw URL, plain |
| inferred | a 17 tall hollow pill in the label role after the last word | hidden |
| dimple | 16 pt well, radius 6, hanging at −25 in the gutter; checked: dark with a white tick | the raw `[ ] ` sits in the gutter |
| ghost dimple | 14 pt hollow, radius 5; the band grows left by 36 instead of indenting the words | hidden |
| urgency | 5 pt amber LED at −35 | hidden |
| life glyph | after a middle dot, 16 tuned cut, ink3 → ink2 on the host's hover, tint for feelings | hidden |

## Motion

The resolved-value chip rises 3 pt on the part spring (instant under Reduce Motion). The dimple's tick is drawn by a pen along the check glyph's route (a 40 ms beat, the short leg, a dwell at the corner, the long leg on the part spring) and drawn back before the key goes light; whole at once under Reduce Motion. The life glyph fades in 120 ms when recognised; its hover is the glyph's own. Nothing else moves.

## API

```tsx
import { Cue, CueUrl, CueInferred, CueLife, Dimple, CueUrgency } from '@unlocalhosted/metalui';
import { LinkIcon } from '@unlocalhosted/metalui/icons';
import { LifeCoffeeIcon } from '@unlocalhosted/metalui/icons/life';

<Dimple checked={done} onCheckedChange={tick} aria-label="Poster task" />
Send the poster <Cue kind="date" resolved="TUE 30 SEP · 16:00">tomorrow 4pm</Cue> for <Cue kind="tag">#poster</Cue>
<CueUrl host="figma.com" href={url} glyph={<LinkIcon size={11} />} />
<CueInferred resolved="FRI 3 OCT · RECOGNIZER 0.82">fri</CueInferred>
<CueLife><LifeCoffeeIcon size={16} /></CueLife>
```

| Component | Props |
|---|---|
| `Cue` | `kind` (`date`, `duration`, `amount`, `measurement`, `tag`, `derived-tag`, `hex`), `resolved` (hover chip), `color` and `swatch` (hex) |
| `CueUrl` | `host`, `glyph`, any anchor attribute |
| `MarkInferred` | `resolved` |
| `Dimple` | Base UI Checkbox props (`checked`, `onCheckedChange`, `disabled`), `doing`, `ghost` |
| `CueUrgency` | – |
| `CueLife` | the glyph as children |

## Rules

- Metric-neutral: every in-flow cue has the same advance as the plain text it marks (measured width delta 0.00 pt). Never add padding without paying it back.
- One life glyph per block, trailing; never a chip for a glyph; never while writing.
- Ticking a dimple is a person's action: the host writes `[x]` into the text and offers Undo. Applying a cue never rewrites text.
- Hidden confidence is a bug: an inferred value shows where it came from (`RECOGNIZER 0.82`) in its chip.

## Accessibility

- The dimple is a real checkbox (Base UI): Space toggles it, it has a focus ring, and `doing` is announced as mixed. Give it a label that names the task.
- The resolved-value chip also shows on keyboard focus. The hover chip repeats what the text already says, so it is not the only carrier.
- The URL pill is a link with its host as its name; the urgency LED has the label "Due soon".
- Colour is never the only cue: underline patterns differ (dotted date, solid values), and tags are shapes.

## Tokens

`--mu-cue-*`; per colorway `--mu-cue-quiet`, `--mu-cue-tag-bg`, `--mu-cue-tag-sh`, `--mu-cue-derived-sh`, `--mu-cue-ghost-sh`, `--mu-cue-url-ink`; `--mu-well*`, `--mu-led-amber`, `--mu-led-ring`, `--mu-frost-graphite-*`, `--mu-type-label`. Swift: `MetalCue`, `MetalTokens.<colorway>.cue*`.

## Semantic display and recognition

Use `MarkLine` around opt-in semantic marks. It reserves the compact Button glyph plus space-2 above **every wrapped line**, including raw mode. `meaning` is time, money, sleep, steps, colour or person; `meaningLabel` names the hover glyph. A person Object comes from the host through `meaningGlyph` (native `personGlyph`); the Mark Part never constructs an Avatar. Glyphs are decorative, add no Tab stop and never consume text advance. Plain Mark callers retain their original leading. `MarkLife label` describes the whole line only.

The host supplies `recognition`, a stable identity **after** the caret leaves a candidate and IME composition commits. One identity reveals the underline on settle, the glyph on object, and one authored glyph act. Raw mode fades the same slots without remounting the source. `formatted` reserves the wider source/display face before the amount drum turns. Recognition never mutates the saved string. Editing controls own separate source-range callbacks.

Tag hue uses shared blue/orange/gold/green-deep at the existing Status tint; red stays destructive. `tagIdentity` and `MetalCue.tagIdentity` hash NFC Unicode scalars with UInt32 wraparound. Full ink and the copied/accessibility name retain the hash. A background-only tip and hole never clip text. `inferred` stays dashed; a host confirms explicitly by click or keyboard. The docs confirmation hosts accept Tab focus, press the chip and acknowledge once with the authored spark. No sound or repeating clock.

SwiftUI display surfaces use `MetalCueText` and `MetalCueTag`; `MetalCueInferred(confirmed:onConfirm:)` supports an explicitly controlled suggestion. Native `Text.metalCue` remains a rendering attribute, and TextKit hosts own caret/selection/history. The avatar renderer keeps its existing native WIP status; this does not claim a full native Avatar port.

`resolved` on native `MetalCueText` uses the same graphite chip and finite part-plus-settle recognition pause. Semantic chips clear the reserved glyph as well as the words; their overlays never take layout space. Confirmation uses the existing Button travel for its finite stamp and Spark for one acknowledgment. OS or scoped Reduce Motion ends current travel immediately. The Cue page DialKit controls recognition motion and display amount formatting without changing source.
