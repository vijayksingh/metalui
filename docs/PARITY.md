# Visual parity guardrails

`tokens/tokens.json` owns visual values and every component recipe. Generated CSS variables and Swift `MetalTokens`/`MetalRecipe` are the only value sources in hand-written components. Keep React and Swift recipes in one token entry; regenerate both outputs together.

## Commands

```sh
npm run hooks:install
npm run generate
npm run lint:literals
npm run check:recipes
npm run check
```

The pre-commit hook lints staged component files. CI runs `npm run check` and both guards. A lint failure prints `file:line`, rule and source line. Replace a literal with a generated `var(--mu-*)` or Swift token/recipe. Narrow exceptions belong in `scripts/lint-literals.allow.json` as `{ "file": "path", "pattern": "regex", "reason": "why" }`; empty reasons fail the checker. Do not add broad entries to hide migration work.

`check:recipes` parses the CSS and Swift frost shadow/fill/opaque layers and compares numbers, color channels, order, blur and backdrop values. New component recipes go in `componentRecipes` (or `components`/`recipes`) as named entries with an ordered `layers` array. Each generated layer needs `/* mu-recipe:<name>:<index> */` on its CSS line and `// mu-recipe:<name>:<index>` on its Swift line. The checker parses numbers from both output lines. It also requires a matching React and Swift component file for each entry, and one recipe entry for each component file. A recipe marker on only one platform fails.

## Baseline, 2026-09-24

Run against current `main` while component migration was active:

| Gate | Findings by rule |
| --- | --- |
| Literal lint | spacing 82; radius 39; shadow 19; duration 7; font 3; color 1; opacity 1. Total 152. |
| Recipe parity | component without recipe 40 (20 React, 20 Swift); frost layer mismatches 0. |
| `npm run check` | failed at literal lint after generated-file checks passed. |

To reach green: move each reported literal into `tokens.json`, generate CSS and Swift, add one recipe entry per component and generated layer markers, then rerun commands. Counts are a dated snapshot; the other agent is editing these sources concurrently.
