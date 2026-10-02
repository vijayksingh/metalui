# Backlog performance verification · 2026-10-03

The final production-build checks passed at `916dce18`: package and docs typechecks, `npm run build` (including generated-source and transition checks), the installed-tarball `verify:package` consumer, and `bench:bundle:gate`. The consumer renders the public controlled cue exports and imports the shipped CSS. The preceding `60ed0078` preserves legacy inferred-return callbacks; its installed consumer and package compilation passed. NumericCue and DateCue emitted JavaScript is identical to `f979b692` after that type-only change.

## Consumer bytes

The five enforced gzip budgets passed. Other exports are measured without a gate ceiling.

| Import | Measured gzip bytes | Ceiling |
|---|---:|---:|
| Button | 7,562 | 9 KB |
| Switch | 7,040 | 12 KB |
| Led | 1,478 | 6 KB |
| Well | 927 | 6 KB |
| Surface | 1,009 | 6 KB |

The benchmark measured 179 exports. Thirty-nine exceed 40 KB gzip; TagCue is the largest at 118,227 bytes (115.5 KB); DatePicker is 116,743 bytes (114.0 KB). Passing the five-budget gate does not mean every export is below 40 KB. Package output totals are 1,083,341 raw bytes, 163,064 gzip and 132,764 Brotli. These are consumer-bundle measurements, not browser loading or execution timings. The earlier `dbaa783f` measurements remain separately recorded in the JSON evidence.

## Idle counters

The original single-worker sweep measured all 112 sitemap routes from the production build at `f979b6928a10275c3eaf1cbcd3d904f229d07fcd`. Each Bone page used 1280 × 900 at DPR 1, awaited fonts, placed the pointer at (0, 0), settled for two seconds and sampled for five. External requests were aborted. All 112 measurement fixtures completed; this alone is not a budget pass.

Every original sample had zero running finite animations. The original budget gate failed on the changed LED class signature, ten newly documented routes without budgets, six increased lamp counts, Weather style recalculations and PastBanner style recalculations. Original samples remain in the [JSON evidence](captures/performance/idle-2026-10-03.json); targeted investigations do not overwrite them.

The LED signature migration preserves existing allowed counts. The ten new quiet-route budgets allow zero layouts, three style recalculations per second and the single waiting lamp shared by the docs chrome; original observed style rates were 1.598–2.398 per second. Existing layout/style ceilings remain unchanged.

The `6084d497` lamp policy removes breathing from historical Fixed headings, away avatars and negative weekly comparisons, and pauses the hidden hover engraving lamp. Six focused feature cases plus two existing dwell cases passed. Only two active-state count allowances increase: LensBar permits its one explicit ASKING specimen plus the shared docs lamp (two); Status permits its waiting LED and waiting badge specimens plus the shared lamp (three). The [lamp guide](../packages/metalui/src/components/led/led.agent.md) names those source fixtures and the inactive/off-screen feature proofs. These allowances do not permit other idle loops.

Weather originally measured 27.783 style recalculations/s against 19.7. The docs clock at `84da8cdf` uses the existing 166 ms sky step and actual elapsed time, retaining the 48-second day. Its targeted sample measured 10.768 style recalculations/s and 5.982 layouts/s, inside the unchanged 19.7/15 ceilings. Seven Weather/clock feature cases and three colorway/reduced-motion captures passed. The later `916dce18` host correction preserves the fixed component recipe while fitting 1280 px columns, making 375 px content keyboard-scrollable, and keeping the clock awake whenever either specimen is visible. Eight layout/visual cases and four mobile captures passed; its pre-gate targeted window measured 11.395 style recalculations/s and 5.998 layouts/s.

PastBanner originally measured 2.7966 style recalculations/s against 2.5. Three unchanged-source paired samples measured 1.9984, 1.9992 and 2.3976; the matching quiet page measured 2.3986, 2.1982 and 2.3986. All six had zero layouts, one shared waiting lamp and zero running finite animations. Source inspection found no PastBanner or scrubber idle clock. The original breach remains recorded; the bounded investigation did not reproduce extra PastBanner work, and neither runtime nor ceiling was changed.

CPU durations and power are not validated: this was an unpinned macOS diagnostic run and `environment.valid` is false. No duration, battery, production traffic or physical-device smoothness claim follows from it. The evidence records animation multiplicity rather than subtracting all identical signatures as if they were one shared lamp.

The final `916dce18` seven-route targeted run passed. Changelog, StudioWeek, Avatar and HoverEngraving each returned to the one shared lamp; LensBar and Status retained exactly their two/three reviewed active lamps. Every target had zero running finite animations. Final Weather measured 10.151 style recalculations/s and 6.170 layouts/s. `bench:gate` then passed all 112 recorded rows: 104 unchanged original samples, the conservative worst PastBanner repeat and seven final targeted samples. This is an original full sweep plus bounded reruns, not a second clean full sweep.

The full build regenerated package declarations. A parallel launch-video typecheck initially read the temporary gap while `dist` was being rebuilt; the typecheck passed across all three workspaces when run after the completed build. No source correction was required.
