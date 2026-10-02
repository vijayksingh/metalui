# Waiting policy

`foundations.waiting` defines one policy across action keys, glyph slots and loading hosts: a 400ms show delay, 300ms minimum visible wait and 10s long-work threshold. Fast work skips the waiting face. Once shown, a wait keeps its minimum so the result does not flash. A long operation may explain what remains once; never tick elapsed seconds or fabricate progress. Known amounts use Progress.

React `useWaiting(state, ref, {showDelay?, minVisible?, longAfter?})` returns the presented `phase` and `long` flag. The host owns idle/waiting/done/error and its actual data; this hook owns only presentation clocks. Idle cancels and resets immediately. Each prop transition cancels old result timers. CSS properties permit local timing overrides; generated constants supply the same defaults when no host is mounted. Swift `MetalWaiting` exposes those durations in seconds.

The clock starts on the actual request. It has at most one arrival/result timer and one explanation timer, no frame loop. A new operation cancels a deferred old result. A timing override during a request retains the original start for long-work explanation. The long flag stays with a minimum-duration waiting face until its result lands. Hosts choose explanatory words; the hook never announces them or claims success.

Waiting is information at its host. Unknown work in a small glyph slot uses a current-ink arc; known work shows real Progress. A large item's own shape waits, a place reserves its incoming structure, and background sync keeps the place operable. See the Spinner placement documentation for real host examples, and BUTTON-WAITING.md for the preceding action research and storyboard.

## Placement research and storyboard

[Apple's progress guidance](https://developer.apple.com/design/human-interface-guidelines/progress-indicators) distinguishes known from unknown work and locates feedback by the task. [Vercel's interface guidance](https://vercel.com/design/guidelines) recommends show-delay/minimum-time, stable content skeletons and polite async feedback. MetalUI keeps its reviewed 400/300 policy rather than copying their example durations. [Linear's offline/sync behavior](https://linear.app/docs/get-the-app) motivates keeping background work nonblocking; that is our inference, not a claim about Linear's animation timing. The [OP–1 field guide](https://teenage.engineering/guides/op-1) keeps operational information in the relevant device/display; it supplies placement inspiration, not a web spinner recipe.

| Host | Before | Waiting after delay | Result |
|---|---|---|---|
| Action | Save key with glyph | Its glyph becomes an arc, label Saving…; width fixed, repeat refused | Saved/check or Try again |
| Small item | Named attachment/row | Same glyph slot, current ink arc; only this item's action disabled and dimmed | Check in the slot fades; name remains |
| Large item | Card's image/text structure | The same structure as skeletons plus operational words; real known count uses Progress | Content fills those exact areas |
| Field | Search value with clear key | Trailing glyph arc replaces clear; typing remains possible and cancels stale requests | Results or error; clear returns |
| Place | View's headings/rows | Matching skeletons and a thin known route progress bar, no central ring | Incoming view takes the same footprint |
| Background | Sync lamp with words | Lamp breathes, unrelated controls remain enabled | Steady live lamp or failed words/retry |

All hosts mark actual requests busy immediately, even during the visual show delay. They announce start and outcome once; percentages and animation frames are not live announcements. At 10s a useful explanation may replace the initial words once. The page's DialKit changes request latency and presentation policy; its requests simulate network latency and explicitly label counted batches. Production progress must come from completed work, never elapsed time. Only pending, visible content runs a loop. Reduced motion removes sheen/travel and replaces an arc's turn with opacity breathing.
