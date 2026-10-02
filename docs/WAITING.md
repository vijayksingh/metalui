# Waiting policy

`foundations.waiting` defines one policy across action keys, glyph slots and loading hosts: a 400ms show delay, 300ms minimum visible wait and 10s long-work threshold. Fast work skips the waiting face. Once shown, a wait keeps its minimum so the result does not flash. A long operation may explain what remains once; never tick elapsed seconds or fabricate progress. Known amounts use Progress.

React `useWaiting(state, ref, {showDelay?, minVisible?, longAfter?})` returns the presented `phase` and `long` flag. The host owns idle/waiting/done/error and its actual data; this hook owns only presentation clocks. Idle cancels and resets immediately. Each prop transition cancels old result timers. CSS properties permit local timing overrides; generated constants supply the same defaults when no host is mounted. Swift `MetalWaiting` exposes those durations in seconds.

The clock starts on the actual request. It has at most one arrival/result timer and one explanation timer, no frame loop. A new operation cancels a deferred old result. A timing override during a request retains the original start for long-work explanation. The long flag stays with a minimum-duration waiting face until its result lands. Hosts choose explanatory words; the hook never announces them or claims success.

Waiting is information at its host. Unknown work in a small glyph slot uses a current-ink arc; known work shows real Progress. A large item's own shape waits, a place reserves its incoming structure, and background sync keeps the place operable. See the Spinner placement documentation for real host examples, and BUTTON-WAITING.md for the preceding action research and storyboard.
