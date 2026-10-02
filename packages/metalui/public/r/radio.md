# Radio group

One choice from a short list. React: `RadioGroup` and `Radio` from `@unlocalhosted/metalui`, on Base UI RadioGroup and Radio. SwiftUI: `MetalRadioGroup` (work in progress). The well's look is the `checkbox` recipe made round; the `radio` recipe adds the pip, the row and the motion.

## Use it for

- Two to about six options where every option should be visible at once, and exactly one holds: "Export as PNG · SVG · PDF".

## Don't use it for

- On or off (use a switch), several at once (use checkboxes), a long list (use a select), or switching views in place (use a switcher).

## Anatomy

- Group: the options stacked (gap 4) or in a line (`orientation="horizontal"`, gap 16).
- Row: a label, at least 24 tall; the well and the text 8 apart. The whole row is the hit area.
- Well: 16, round, the checkbox well; chosen, the checkbox's dark on look.
- Pip: 6, white, centred in the well.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | a recessed round well | – |
| hover | the well darkens a step (unchosen only) | 160 ms |
| pressed | the well already takes the dark on look | 50 ms: the key is going down |
| chosen | dark well, white pip | the pip scales in on the part spring (may overshoot against its stop) |
| the old choice | back to rest | its pip drops out on the release spring, in the same frame the new one latches |
| cancel (press, drag off) | back to rest | the well fades back; nothing latches |
| focus | the green ring on the well | keyboard only |
| invalid | a red hairline ring on unchosen wells | – |
| disabled | 40 %, no hover, no press | – |

Arrow keys choose without the press phase: the latch and release are the same. Reduce Motion: the pip is there or not at once; the well colour still fades.

## API

| React | SwiftUI |
|---|---|
| `RadioGroup` `value`, `defaultValue`, `onValueChange` | `selection:` |
| `RadioGroup` `orientation` (`vertical`, `horizontal`) | `axis:` |
| `RadioGroup` `name`, `disabled`, `readOnly`, `required` | `.disabled()` |
| `Radio` `value`, `disabled`, children (the label) | `MetalRadio(value:) { label }` |
| `RadioGroup.Root`, `RadioGroup.Item` | slots |

## Keyboard and accessibility

- The group is a `radiogroup`; each option is a `radio`. Tab enters on the chosen option (or the first); arrow keys move and choose; Space chooses the focused one.
- Name the group: `aria-labelledby` to a visible heading, or `aria-label`. Each option's label is its text.
- Inside a Base UI Field, `invalid` shows the red ring and the Field's error text explains it.
- A disabled checked option stays reachable by Tab, following Base UI's radio contract. This lets someone discover the held choice and hear why it is unavailable; it cannot change by Space, arrows or a label click. Unchecked disabled options are skipped. Attach the reason with `aria-describedby` on the group or option. Do not force `tabIndex`: it would break the group's managed focus.

## Rules

- Every option is visible; if the list does not fit, it is a select.
- Order options in a meaningful way (most common first, or natural order), and choose a default when one is safe.
- Labels are short nouns or phrases in the same form: "PNG", "SVG", "PDF".
