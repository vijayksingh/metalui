#!/usr/bin/env node
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { walk, staged, lintFile, applyAllowlist, report } from './lib/visual-lint.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const roots = [
  ['packages/metalui/src/components', ['.css', '.tsx']],
  ['packages/metalui/src/blocks', ['.css', '.tsx']],
  ['swift/Sources/MetalUI/Components', ['.swift']],
  ['swift/Sources/MetalUI/Blocks', ['.swift']],
];
const stagedFiles = process.argv.includes('--staged') ? staged(root) : null;
const files = roots.flatMap(([dir, extensions]) => walk(join(root, dir), extensions));
const findings = files.flatMap((path) => {
  const display = relative(root, path).replaceAll('\\', '/');
  if (stagedFiles && !stagedFiles.has(display)) return [];
  const source = stagedFiles ? execFileSync('git', ['show', `:${display}`], { cwd: root }).toString() : undefined;
  return lintFile(path, display, source);
});
process.exitCode = report(applyAllowlist(findings, join(root, 'scripts/lint-literals.allow.json')));
