# Waiting on an action

Research precedes this placement. Apple's [progress indicator guidance](https://developer.apple.com/design/human-interface-guidelines/progress-indicators) locates feedback near the operation and distinguishes unknown duration from known progress. [Vercel's interface guidelines](https://vercel.com/design/guidelines) preserve a loading button's label and recommend a show delay and a minimum visible duration; [Geist Spinner](https://vercel.com/geist/spinner) directs action waits to the Button's loading API. MetalUI retains those causal contracts with its own shared 400ms delay and 300ms minimum.

[Linear's app documentation](https://linear.app/docs/get-the-app) describes automatic sync and locally retained changes during connectivity failures. The inference for MetalUI is that background sync should preserve ongoing work rather than borrow the action key's blocking state. This is not evidence for a particular Linear animation or timing. [Teenage Engineering's OP-1 guide](https://teenage.engineering/guides/op-1) was examined as a hardware feedback reference; it does not supply a web loading-button timing contract, so no animation or timing is claimed from it.

## Storyboard

1. At activation, the host enters waiting and starts one request. The key refuses another press, remains focused, and marks its real work busy. No waiting face appears yet.
2. At 400ms, the leading glyph's slot carries an arc in the cap's ink. Save turns to Saving… on the existing label drum. The cap remains sunk. Its width was reserved from the initial idle face, so the surrounding footer stays still.
3. The host commits its real data before setting done or error. If an arc appeared, the same slot holds it for at least 300ms. Then the arc yields to the host's semantic result glyph and the label turns to Saved or Try again.
4. Done refuses another operation until the host resets idle; error permits retry. Every prop transition cancels the old delayed result timer, so a new request cannot acquire a previous request's stale face.

Reduce Motion: no rotation or label travel; an opacity breath and label crossfade preserve the information. Hidden or offscreen waiting arcs pause. No clock exists on an idle or result face. Swift uses a still arc under Reduce Motion, and pauses its waiting timeline when inactive or absent.

Known progress belongs to Progress at the host rather than a simulated percentage in this unknown-duration key. Long-work explanation and the other waiting placements remain separate backlog slices.
