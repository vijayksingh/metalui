# Neutral names: owner review

Proposed migration only. No existing API or file is renamed by this guard. Baseline on 2026-09-24: **547 findings** from authored source. `node scripts/lint-neutral-names.mjs --report-only --json` gives every `file:line`, word, and suggestion. Counts include source path segments as findings. They exclude `docs/KAMUI_IMPORT_STATUS.md`, this proposal, credits/acknowledgements, and generated output; registry JSON, `public/AI.md`, icon manifests, token CSS, generated Swift and SF Symbols follow their authored sources. A new hand-authored file under `packages/metalui/public/` is scanned.

| Found name | Count | Where it appears | Proposed neutral name | Public API? |
|---|---:|---|---|---|
| `KAMUI-<n>` | 61 | Component `meta.json`, `.agent.md`, CSS comments, Swift, docs, token descriptions. Of these, `KAMUI-14` has 22 references. | Replace sheet IDs with the component or material name: `selection frame` for 14; `toolbar/tool button` for 01, `segmented control` for 04, `command palette` for 06, `cue/dimple` for 08, `button` for 15, `status badge` for 16, `toast` for 20. Put historical sheet attribution in `CREDITS.md`. | Docs/registry metadata and generated public copy change; usually no runtime symbol. |
| `Kamui` outside numbered IDs | 183 | `tokens/tokens.json` (28), docs (19), scripts (13), component sources (55), docs site (55), Swift (10), icon sources (3). | `MetalUI` for library ownership, `Soft Hardware` for style, `reference design` for provenance. Move exact origin paths to `CREDITS.md`. | Yes if any exposed metadata/source strings are consumed; no current exported `Kamui` type found. |
| `Jev` | 175 | `packages/metalui/icons/src/life.mjs` (83), component sources (39), docs site (27), Swift (21), tokens (2), scripts (2), e2e (1). | `recognizer`, `inference`, or `source` by context. Example: `source="jev"` to `source="inference"`; `MetalLensSource.jev` to `.inference`; labels `ASKING JEV`/`VIA JEV` to `ANALYZING`/`VIA INFERENCE`. Keep confidence values and explicit origin. | **Yes:** React prop union and Swift enum case; also user-visible status. |
| `Keeper` | 60 | Icon geometry/catalog, Swift icon references, `docs/ICON-GRAMMAR.md` and proposals, docs site. | Owner choice: remove mascot glyph from the general catalog, or replace it with a new generic `character` glyph and geometry. `KeeperIcon`, `MetalIconName.keeper`, SVG/SF Symbol names, and registry/icon catalog entries must migrate together. | **Yes:** icon names and assets. Existing `docs/PLAN.md` says the keeper icon stays; that decision conflicts with this task and needs owner resolution. |
| `fragment` / `fragments` | 16 | Command palette section labels and docs, Swift palette descriptions, token prose, life icon source. `React.Fragment` and the adjective `fragmented` are explicit exceptions. | `item`, `block`, `content segment`; palette section `ITEMS` or `BLOCKS` after checking the data it displays. | **Potentially:** section strings can be passed into palette row APIs; changing them may affect consumers. |
| `medium` as product noun | 52 | Reference-demo paths and descriptions in tokens, component comments/guides, docs, Swift comments, scripts. Typography weights and platform `.medium` sizes are explicit exceptions. | `canvas`, `reference demo`, or `compact` for pill size, depending on meaning. Remove old source paths from public docs; retain provenance in credits. | No exported `Medium` component found; token descriptions and public docs change. |
| `clipme` | 0 | None. | `clipboard` or `capture` if introduced. | No. |
| `typesafe` | 0 | None. | `typed` or `type-safe` if introduced. | No. |

## Names for owner decision

These are review candidates, not currently blocked by the strict word list. Counts are source text occurrences, including identifiers and class names, excluding generated output.

| Existing name | Count | Where | Proposal | Public API? |
|---|---:|---|---|---|
| `LensBar` / `lens-bar` / `lens bar` | 122 | React and Swift components, `lensbar` tokens/classes, docs route and navigation. | `FilterBar` if the contract is query/filter/view switching; `QueryBar` if asking and provenance are central. Decide behavior before naming. | **Yes:** React/Swift types, props, token keys, CSS classes, registry slug, route. |
| `MemoryScrubber` / `memory-scrubber` / `memory scrubber` | 52 | React and Swift components, docs route, registry metadata, e2e. | `TimeScrubber` (or `TimelineScrubber` if marks become the primary meaning). | **Yes:** React/Swift types, registry slug, CSS classes, route. |

`bone` and `graphite` are material/color names, not Kamui names. Keep both colorway IDs. `life` describes the icon set's everyday events and states; keep the set name, but remove Jev-specific `hook` strings from its source. LED colors (`live`, `waiting`, `failed`, `link`, `off`) describe reusable state and can stay; sample badges and provenance labels naming Jev need neutral text. Blue currently means a link/capture kind; document this as a component semantic instead of a product status.

## Guard rollout

- `npm run lint:names` fails on any finding and prints `file:line` plus a suggested replacement.
- Pre-commit runs the strict guard on staged files from the index. A touched legacy file must clear its flagged names before commit.
- `npm run check` and the `neutral-names` CI job use `--report-only` while this baseline is nonzero; they print the total and per-word counts without failing. To exercise strict `check` now, run `npm run check -- --strict` (the explicit flag overrides report-only).
- At zero baseline, remove `--report-only` from `check` and the CI job, or replace it with `--strict`. Then both fail on regressions.
- Add only genuine generic-language/framework exceptions to `scripts/lint-neutral-names.allow.json`, with exact file, match, context, and reason. Generated outputs must be fixed through sources.
