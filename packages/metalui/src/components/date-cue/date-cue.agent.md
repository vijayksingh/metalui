# Date cue

Component: a civil calendar day operated inline. NumericCue owns day/week detents and focus/keyboard semantics; its held scale is an Instrument. Calendar selection belongs in the existing Popover anchored to the actual spinbutton. Existing materials and motion remain shared.

## API

Controlled `value`, explicit `today`, `min`, `max` are valid civil `YYYY-MM-DD` strings. `onValueChange(day)`, `label`, and explicit `footprint` are required. A civil date is not a UTC instant: UTC ordinals perform day arithmetic; local Calendar boundaries convert back to the same civil string. DST crossings therefore add a calendar day.

`format(day)` decorates the face; `source(day)` supplies lossless replacement words. The default source grammar is English yesterday/today/tomorrow, last/next weekday within seven days, ISO outside that window. Hosts with other language/recognition grammars override source. `relativeDateWords(day,today)` exposes that exact grammar. The today snapshot gives these words one meaning; hosts update it when their document context changes.

`hint={false}` suppresses visual inner help when a provenance host supplies it; resolved date and keyboard instructions remain accessible. `inputAria` forwards descriptions to the actual spinbutton, merging its own date instructions. `locale`, `raw`, `disabled`, `readOnly` follow shared policies. `onBegin`, `onSourceChange`, `onCommit`, `onCancel(reason)` match NumericCue source transactions. Begin is deferred until the first changed day; holding merely opens Calendar without a source/history transaction. Calendar acceptance is one transaction. Escape during scrub restores captured day/source; externally changed controlled values invalidate stale capture.

React hosts may return `false` from `onBegin` or `onSourceChange` to refuse an occupied capture or lost source replacement. Scrubbing then keeps its previous date and source; Calendar confirmation publishes no date, commit or haptic and remains open. Source acceptance precedes the controlled value callback. Void callbacks retain their accepted behavior.

## Interaction

Vertical drag or Arrow Up/Down steps one day; Shift steps one week; Alt/Option still steps one day. Relative words turn on the shared drum, then real date labels appear farther away. The resolved full date remains available as title/help and in Calendar's description. Formatted date words remain while focused; numeric ordinal typing is blocked without marking the component read-only.

Long hold uses Button's existing hold duration; movement cancels the hold before scrubbing starts. Alt+Down, Enter or Space opens Calendar immediately. Base UI handles the portalled panel, collision avoidance, selected-day focus and final focus back to the actual spinbutton. No wrapper button or extra tab stop is introduced. Direct-anchor colorway inheritance follows the nearest scope and live changes.

Fixed footprint includes the widest raw, relative and formatted face over the allowed range; glyph clearance is reserved by the semantic line. OS/site/scoped reduction preserves values and removes drum travel. Haptics occur once per accepted day, never for inactive/disabled/read-only interactions. Source host owns UTF16 ranges, caret and one undo entry per gesture.

Swift uses the same civil-string API through MetalDateCue, MetalNumericCue and MetalCalendar. Its existing MetalPopover uses the native system panel (documented shared Popover material WIP), with no duplicate recipe invented here.
