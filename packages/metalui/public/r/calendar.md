# Calendar and date picker

A month to choose a day from, and a field that opens one. React: `Calendar` and `DatePicker` from `@unlocalhosted/metalui` (a table grid following the ARIA date-grid pattern; the picker opens in the library's `Popover`). SwiftUI: `MetalCalendar` (work in progress). The chosen day takes the `switcher` thumb look and hovered days its track, the title turns on the swap drum; the `calendar` recipe adds the grid, today's lamp and the month's arrival.

## Use it for

- Choosing a day where the weekday or nearby dates matter: a due date, a trip, a booking.
- `DatePicker` in a form.

## Don't use it for

- A birth date or a far date people know by heart (three fields or a typed date are faster), or a time.

## Anatomy

- Head: previous and next keys (compact caps), the month and year (title type) between.
- Grid: weekday initials (meta type, ink3), then six rows of 32 days, 2 apart, radius 10.
- Today: a 4 green lamp under the number. Outside the month: ink3. Out of range: disabled, 40 %.
- Picker: the form field's regular well with a calendar glyph and the chosen day.

## States and motion

| State | Look | Motion |
|---|---|---|
| hover | the day sinks a touch (the switcher's track) | – |
| chosen | the switcher's raised thumb look | lands into it on the part spring (from 0.9) |
| later month | title turns up; the grid comes from the right | drum and settle spring, fading in |
| earlier month | title turns down; the grid comes from the left | the same, mirrored |
| focus | the green ring on the day | – |
| picker chosen | the popover closes; the field's text turns | the drum |

Reduce Motion: the grid arrives and the choice lands at once; the fades stay.

## API

| React | SwiftUI |
|---|---|
| `Calendar` `value`, `defaultValue`, `onValueChange`, `defaultMonth`, `month`, `onMonthChange`, `min`, `max`, `locale` | `selection:`, `in:` |
| `DatePicker` the same, plus `placeholder`, `format`, `invalid`, `disabled`, `aria-label` | `DatePicker` |

## Keyboard and accessibility

- A `grid` named by its month. One day is in the tab order; arrows move by day and week, Page Up / Down by month (with Shift, by year), Home / End to the week's ends, Enter or Space chooses. Days are named in full ("Wednesday, 30 September 2026"); today says `aria-current="date"`; the chosen day is `aria-selected`.
- The picker is a button naming the field and its day; the calendar opens with focus on the chosen day (or today) and Esc returns to the field.

## Rules

- The week starts where the reader's locale starts it.
- Say the range: disable days that cannot be chosen rather than refusing them after.

## Displayed month and selection

- `month` controls the displayed month; `onMonthChange` requests a new month as its first day. Only navigation or choosing a day in another month emits this callback; receiving a new prop does not.
- Without `month`, a changed controlled `value` reveals its month. Recreating a Date for the same calendar day preserves the browsed month. `defaultMonth` takes precedence for the initial display; otherwise it starts at the chosen day or today.
- With `month`, the host decides whether to accept navigation. A value in another month never overrides that decision. The visible grid retains one enabled day in the Tab order.
- Pointer focus on a neighbouring month's day does not replace its button; choosing it turns the month and keeps keyboard focus on the chosen day.
- `DatePicker` forwards the same display and eligibility props, including `min` and `max`.
- SwiftUI remains a system graphical DatePicker placeholder. Its selection and range are supported; controlled displayed month and MetalUI motion are not yet implemented.
