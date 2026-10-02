# Calendar and date picker

A calendar for one day, a range or independent days, and a segmented field that opens it. React: `Calendar` and `DatePicker` from `@unlocalhosted/metalui` (a table grid following the ARIA date-grid pattern; the picker opens in the library's `Popover`). SwiftUI: `MetalCalendar`. The chosen day takes the `switcher` thumb look and hovered days its track, the title turns on the swap drum; the `calendar` recipe adds the grid, today's lamp and the month's arrival.

## Use it for

- Choosing a day where the weekday or nearby dates matter: a due date, a trip, a booking.
- `DatePicker` in a form.

## Don't use it for

- A scheduling grid across people: use the availability picker composition. Calendar-only entry is slow for known far dates; use DatePicker’s native typed segments.

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
| `DatePicker` same selection and eligibility props, plus `name`, `required`, `readOnly`, `presets`, `showTime`, `timeZone`, `timeZones` | `MetalDatePicker` `selection:`, `range:`, `dates:`, `required:`, `readOnly:`, `showTime:`, `timeZone:` |

## Keyboard and accessibility

- A `grid` named by its month. One day is in the tab order; arrows move by day and week, Page Up / Down by month (with Shift, by year), Home / End to the week's ends, Enter or Space chooses. Days are named in full ("Wednesday, 30 September 2026"); today says `aria-current="date"`; the chosen day is `aria-selected`.
- The picker combines a Base UI Field control, native date segments, and a calendar key naming the field and selection. FormField labels, descriptions, errors and disabled state reach the segmented entry; time-zone Select owns its own nested Field context so it cannot steal the date label or ID. The calendar opens focused on the chosen day (or today); Escape and selection return focus to its key.

## Rules

- The week starts where the reader's locale starts it.
- Say the range: disable days that cannot be chosen rather than refusing them after.

## Displayed month and selection

- `month` controls the displayed month; `onMonthChange` requests a new month as its first day. Only navigation or choosing a day in another month emits this callback; receiving a new prop does not.
- Without `month`, a changed controlled `value` reveals its month. Recreating a Date for the same calendar day preserves the browsed month. `defaultMonth` takes precedence for the initial display; otherwise it starts at the chosen day or today.
- With `month`, the host decides whether to accept navigation. A value in another month never overrides that decision. The visible grid retains one enabled day in the Tab order.
- Pointer focus on a neighbouring month's day does not replace its button; choosing it turns the month and keeps keyboard focus on the chosen day.
- `DatePicker` forwards the same display and eligibility props, including `min` and `max`.
- SwiftUI draws the same six-row calendar using the generated switcher track and thumb, calendar dimensions, focus ring, green lamps, part spring and settle arrival. Single, range and multiple bindings share that grid; `month:` controls browsing independently.

## Selection and eligibility

- `mode="single"` (default) chooses one `Date`; `range` takes `{ start: Date | null, end: Date | null }`; `multiple` takes `Date[]`. Values and callbacks follow the mode. Multiple selection toggles individual dates and returns calendar order.
- Ranges are inclusive: `minDays` and `maxDays` count both endpoints, using calendar dates across DST. First click starts a range; a later click orders the endpoints and completes it. Hover and keyboard movement preview the band. An invalid length or an unavailable day anywhere in the range prevents completion; after a completed range the next click starts again.
- `min` and `max` are inclusive. Out-of-range buttons are disabled and navigation stops at the boundary. `isDateUnavailable` days remain keyboard reachable, carry `aria-disabled`, announce `unavailableLabel`, and never emit a selection. This differs from range limits and supports explanations such as “Weekend” or “No available times”.
- `weekStartsOn` accepts 0 (Sunday) through 6 (Saturday); omit it for the locale default. `weekNumbers` uses ISO weeks regardless of the displayed week start. `months={2}` shows consecutive grids that wrap in a narrow host; outside dates become blank so every real date has one button and the whole calendar retains one tab stop.
- The title opens a month and year picker; limits apply there too. `markedDays(date)` returns a description or true for “Has events”; the lamp and full date label carry this information. Marks do not change eligibility.
- `readOnly` preserves navigation and inspection but prevents selection changes.
- Swift: use `selection:`, `range:` (`Binding<MetalDateRange>`), or `dates:` (`Binding<Set<Date>>`). `.calendarMonths`, `.calendarLocale(..., weekStartsOn:, weekNumbers:)`, `.calendarUnavailable`, `.calendarMarks`, and `.calendarReadOnly` provide the same presentation and eligibility contracts.

## Typed dates and forms

- DatePicker’s date inputs are native `type="date"` segments. Their text order and editing keys follow the browser language; `lang={locale}` is provided where the browser supports it. Calendar month and day names follow `locale`. Native semantics own segment focus, keyboard editing and required/min/max validation; MetalUI adds unavailable-day and range validation through custom validity.
- Invalid typed dates remain visible for correction and never emit an accepted value. Range endpoints must be ordered, fit the inclusive `minDays`/`maxDays`, and contain no unavailable day. Keyboard focus and the inline alert explain a rejected value.
- `name` submits one hidden canonical value: `YYYY-MM-DD` for a single day, `start/end` for a range, and comma-separated ISO days for multiple selection. No visible input repeats the submitted name. Use `DatePicker name` even inside a named FormField. For canonical ranges and instants, read `new FormData(event.currentTarget)` in `Form onSubmit`; Base UI’s `onFormSubmit` reads its registered primary native date segment. `required` validates visible native date controls; `readOnly` keeps the value submitted and prevents editing, opening or clearing; disabled values are omitted from the form.
- Clear emits null for single mode, `{ start: null, end: null }` for range, and `[]` for multiple. Today respects eligibility; for a range longer than one day it starts a pending range. `presets` are `{ label, value }`, where value may be a function evaluated when the picker renders. A complete range closes the popup; multiple selection keeps it open until Done.
- Native localized segments are also used by Swift `MetalDatePicker`, surrounded by the generated field well; its calendar is the custom MetalUI grid. Optional selection, clear, Today, ranges, multiple dates, unavailable predicates, required naming, read-only state and presets use the same contracts. Swift `name` is an accessibility identifier; form serialization belongs to the app.

## Date, time and time zones

- `showTime` adds a time field and an IANA time-zone Select in single mode. `value` then denotes an instant, and `name` submits `Date.toISOString()` plus `name.timeZone`. Without `showTime`, values are calendar dates in the host’s local calendar and serialize without a time zone.
- `timeZone` controls the display zone; `defaultTimeZone` starts an uncontrolled zone; `onTimeZoneChange` reports its change. Zone changes preserve the chosen instant and only reinterpret its date/time display. `timeZones` specifies the selectable IANA identifiers; default choices are the current zone and UTC.
- Typing or selecting changes the wall-clock day/time in that zone. Nonexistent DST-gap values are refused with a visible and native validity error. Repeated times resolve to the first occurrence. Date limits and unavailable predicates apply to the displayed civil day; exact instant limits still apply to accepted date/time values. The Today action and current-day lamp also follow the displayed zone (`Calendar today` supplies the civil-day override). No background clock runs.
- Swift’s native date/time segments inherit the selected TimeZone. The shared calendar also receives it; calendar day selection preserves the existing wall-clock hour/minute with strict DST matching and the first overlap occurrence. A zone change changes the display, preserving its Date instant.
