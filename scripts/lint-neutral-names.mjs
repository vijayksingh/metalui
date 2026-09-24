#!/usr/bin/env node
// Source and public-surface naming guard. --staged reads the index, not the working tree.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const staged = process.argv.includes('--staged');
const advisory = process.argv.includes('--report-only') && !process.argv.includes('--strict');
const json = process.argv.includes('--json');
const allow = JSON.parse(readFileSync(new URL('./lint-neutral-names.allow.json', import.meta.url), 'utf8'));
const suggestions = {
  'kamui-id': 'selection frame / object-sheet reference',
  kamui: 'MetalUI, Soft Hardware, or source attribution in CREDITS.md',
  clipme: 'clipboard or capture',
  jev: 'recognizer or inference source',
  keeper: 'character glyph (owner review: remove mascot)',
  typesafe: 'typed or type-safe',
  fragment: 'item, block, or content segment',
  medium: 'canvas or reference demo',
};
const pattern = /KAMUI-\d+|kamui|clipme|jev|keeper|typesafe|fragments?|medium/gi;
const ignoredDirs = new Set(['.git', '.build', '.swiftpm', 'node_modules', 'dist', 'test-results', 'playwright-report', 'captures']);
const ignoredFiles = new Set([
  'docs/KAMUI_IMPORT_STATUS.md', // historical ledger, to move out later
  'docs/NEUTRAL_NAMES.md', // this migration inventory
  'scripts/lint-neutral-names.mjs', // rules contain the names they detect
  'scripts/lint-neutral-names.allow.json', // exception keys contain the names they permit
  'packages/metalui/registry.json', // generated from component meta.json
  'package-lock.json',
]);
const generatedPublic = new Set(['AI.md', 'llms.txt', 'components.json', 'icons.json', 'icons-life.json']);
const sourceExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.scss', '.swift', '.ts', '.tsx', '.txt', '.yml', '.yaml']);

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function eligible(file) {
  const parts = file.split('/');
  if (parts.some((part) => ignoredDirs.has(part))) return false;
  if (ignoredFiles.has(file) || /(^|\/)(CREDITS|ACKNOWLEDG(E)?MENTS)\.md$/i.test(file)) return false;
  if (/\.generated\.|(^|\/)(tokens|theme)\.css$/.test(file)) return false;
  if (file.startsWith('packages/metalui/public/r/') || file.startsWith('packages/metalui/public/icons/')) return false;
  if (file.startsWith('packages/metalui/public/') && generatedPublic.has(file.slice('packages/metalui/public/'.length))) return false;
  if (file.startsWith('swift/Sources/MetalUI/Resources/MetalIcons.xcassets/')) return false; // generated SF Symbols
  if (file.startsWith('docs/captures/') || file.startsWith('docs/demo-parity/')) return false;
  if (/\.tmp\./.test(file) || file.endsWith('.tsbuildinfo')) return false;
  return true; // Even a binary or extensionless authored file can expose a path name.
}

const files = (staged
  ? git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'])
  : git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']))
  .split('\0').filter(Boolean).filter(eligible).sort();

function wordOf(value) {
  const lower = value.toLowerCase();
  if (/^kamui-\d+$/.test(lower)) return 'kamui-id';
  if (lower.startsWith('fragment')) return 'fragment';
  return lower;
}

function validMatch(text, match) {
  if (match[0].toLowerCase() !== 'jev') return true;
  const before = text[match.index - 1] ?? '';
  const after = text[match.index + match[0].length] ?? '';
  const startsWord = !/[a-z0-9]/i.test(before) || (/[a-z]/.test(before) && /[A-Z]/.test(match[0][0]));
  const endsWord = !/[a-z0-9]/i.test(after) || /[A-Z]/.test(after);
  return startsWord && endsWord;
}

function permitted(finding) {
  return allow.some((entry) => {
    if (!entry.reason || entry.file !== finding.file || entry.word !== finding.word) return false;
    if (entry.match !== finding.match) return false;
    return entry.lineIncludes ? finding.line.includes(entry.lineIncludes) : true;
  });
}

const findings = [];
for (const file of files) {
  // A path is itself an API surface. One finding per offending path segment.
  for (const segment of file.split('/')) {
    for (const match of segment.matchAll(pattern)) {
      if (!validMatch(segment, match)) continue;
      const finding = { file, lineNumber: 1, word: wordOf(match[0]), match: match[0], line: '[path]' };
      if (!permitted(finding)) findings.push(finding);
    }
  }
  if (!sourceExtensions.has(extname(file)) && file !== 'Package.swift') continue;
  let content;
  try {
    content = staged ? git(['show', `:${file}`]) : readFileSync(resolve(root, file), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') continue; // concurrent removal from worktree
    throw error;
  }
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    for (const match of line.matchAll(pattern)) {
      if (!validMatch(line, match)) continue;
      const finding = { file, lineNumber: index + 1, word: wordOf(match[0]), match: match[0], line };
      if (!permitted(finding)) findings.push(finding);
    }
  }
}

const counts = Object.fromEntries(Object.keys(suggestions).map((word) => [word, findings.filter((finding) => finding.word === word).length]));
if (json) {
  console.log(JSON.stringify({ total: findings.length, counts, findings }, null, 2));
} else {
  if (!advisory) {
    for (const finding of findings) {
      console.log(`${finding.file}:${finding.lineNumber}: ${finding.match} -> ${suggestions[finding.word]}`);
    }
  }
  console.log(`Neutral names: ${findings.length} finding(s) in ${files.length} scanned file(s). ${Object.entries(counts).map(([word, count]) => `${word}=${count}`).join(', ')}`);
  if (advisory && findings.length) console.log('Advisory only. Remove --report-only after baseline reaches 0.');
}
if (!advisory && findings.length) process.exitCode = 1;
