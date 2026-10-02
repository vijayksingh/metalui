#!/usr/bin/env node
// Exercise the npm tarball or published registry version as a consumer, not the workspace symlink.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const registry = process.argv.includes('--registry');
const pkg = JSON.parse(readFileSync(join(root, 'packages/metalui/package.json'), 'utf8'));
const temp = mkdtempSync(join(tmpdir(), 'metalui-consumer-'));
try {
  const packed = registry ? null : JSON.parse(execFileSync('npm', [
    'pack', '--json', '--workspace', '@unlocalhosted/metalui', '--pack-destination', temp,
  ], { cwd: root, encoding: 'utf8' }))[0];
  const required = ['LICENSE', 'README.md', 'dist/index.js', 'dist/index.d.ts', 'dist/icons.js', 'dist/icons-life.js', 'dist/sound.js', 'dist/sound.d.ts', 'dist/styles.css', 'dist/styles.unlayered.css', 'dist/icons.css', 'dist/icons-life.css'];
  const names = new Set(packed?.files.map((file) => file.path) ?? []);
  for (const path of required) {
    if (packed && !names.has(path)) throw new Error(`npm tarball missing ${path}`);
  }
  execFileSync('npm', [
    'install', '--prefix', temp, '--ignore-scripts', '--no-audit', '--no-fund', '--no-save',
    registry ? `${pkg.name}@${pkg.version}` : join(temp, packed.filename), 'react@^19', 'react-dom@^19',
  ], { cwd: root, stdio: 'pipe' });
  if (registry) for (const path of required) {
    if (!existsSync(join(temp, 'node_modules', '@unlocalhosted', 'metalui', path))) throw new Error(`Registry package missing ${path}`);
  }
  const smoke = `
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, Surface, NumericCue, EnumCue, DateCue, ColourCue, TagCue, TooltipProvider } from '@unlocalhosted/metalui';
import { SendAwayIcon } from '@unlocalhosted/metalui/icons';
import { LifeIcon } from '@unlocalhosted/metalui/icons/life';
import * as Sound from '@unlocalhosted/metalui/sound';
const html = renderToStaticMarkup(createElement(Surface, { material: 'raise' }, createElement(Button, { cap: 'primary' }, 'Send')));
if (!html.includes('recipe-surface-raise') || !html.includes('recipe-button-primary') || !html.includes('Send')) throw new Error('React package render failed');
// Exercise controlled source controls through the installed tarball, including their Base UI dependencies.
const noop = () => {};
const cues = [
  [NumericCue, { value: { value: 6, unit: 'h' }, units: [{ id: 'h', label: 'hours', factor: 1, format: String, source: String }], min: 0, max: 24, footprint: ['24'], label: 'Sleep', onValueChange: noop }, 'mu-numeric-cue'],
  [EnumCue, { value: '#done', choices: [{ value: '#todo' }, { value: '#done' }], label: 'Task', onChange: noop }, 'mu-enum-cue'],
  [DateCue, { value: '2026-10-04', today: '2026-10-03', min: '2026-10-01', max: '2026-10-31', footprint: ['2026-10-31', 'tomorrow'], label: 'Delivery', onValueChange: noop }, 'mu-date-cue'],
  [ColourCue, { value: '#FF6B3D', label: 'Ink', onChange: noop }, 'mu-colour-cue'],
  [TagCue, { value: '#poster', recentTags: ['#poster', '#studio'], label: 'Tag', onChange: noop }, 'mu-enum-cue'],
];
for (const [Control, props, marker] of cues) {
  const rendered = renderToStaticMarkup(createElement(TooltipProvider, null, createElement(Control, props)));
  if (!rendered.includes(marker) || !rendered.includes(props.label)) throw new Error('Installed cue render failed: ' + props.label);
}
if (!SendAwayIcon || !LifeIcon) throw new Error('Icon subpath failed');
if (!Object.keys(Sound).length) throw new Error('Sound subpath failed');
const css = readFileSync(new URL('./node_modules/@unlocalhosted/metalui/dist/styles.css', import.meta.url), 'utf8');
if (!css.includes('.recipe-button-primary') || !css.includes('.recipe-surface-raise') || !css.includes('--mu-page')) throw new Error('Component CSS missing');
const flat = readFileSync(new URL('./node_modules/@unlocalhosted/metalui/dist/styles.unlayered.css', import.meta.url), 'utf8');
if (/@layer\\b/.test(flat) || !flat.includes('.recipe-button-primary')) throw new Error('styles.unlayered.css is wrong');
if (css.includes('button,input,optgroup')) throw new Error('Global reset leaked into component CSS');
`;
  const script = join(temp, 'smoke.mjs');
  writeFileSync(script, smoke);
  execFileSync('node', [script], { cwd: temp, stdio: 'inherit' });
  console.log(`Package consumer: ${pkg.name}@${pkg.version} from ${registry ? 'registry' : 'local tarball'}, controlled cues, React render and CSS passed`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
