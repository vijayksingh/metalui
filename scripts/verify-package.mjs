#!/usr/bin/env node
// Exercise the actual npm tarball as a consumer, not the workspace symlink.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const temp = mkdtempSync(join(tmpdir(), 'metalui-consumer-'));
try {
  const packed = JSON.parse(execFileSync('npm', [
    'pack', '--json', '--workspace', '@unlocalhosted/metalui', '--pack-destination', temp,
  ], { cwd: root, encoding: 'utf8' }))[0];
  const names = new Set(packed.files.map((file) => file.path));
  for (const path of ['LICENSE', 'README.md', 'dist/index.js', 'dist/index.d.ts', 'dist/icons.js', 'dist/icons-life.js', 'dist/styles.css', 'dist/icons.css', 'dist/icons-life.css']) {
    if (!names.has(path)) throw new Error(`npm tarball missing ${path}`);
  }
  execFileSync('npm', [
    'install', '--prefix', temp, '--ignore-scripts', '--no-audit', '--no-fund', '--no-save',
    join(temp, packed.filename), 'react@^19', 'react-dom@^19',
  ], { cwd: root, stdio: 'pipe' });
  const smoke = `
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, Surface } from '@unlocalhosted/metalui';
import { SendAwayIcon } from '@unlocalhosted/metalui/icons';
import { LifeIcon } from '@unlocalhosted/metalui/icons/life';
const html = renderToStaticMarkup(createElement(Surface, { material: 'raise' }, createElement(Button, { cap: 'primary' }, 'Send')));
if (!html.includes('recipe-surface-raise') || !html.includes('recipe-button-primary') || !html.includes('Send')) throw new Error('React package render failed');
if (!SendAwayIcon || !LifeIcon) throw new Error('Icon subpath failed');
const css = readFileSync(new URL('./node_modules/@unlocalhosted/metalui/dist/styles.css', import.meta.url), 'utf8');
if (!css.includes('.recipe-button-primary') || !css.includes('.recipe-surface-raise') || !css.includes('--mu-page')) throw new Error('Component CSS missing');
if (css.includes('button,input,optgroup')) throw new Error('Global reset leaked into component CSS');
`;
  const script = join(temp, 'smoke.mjs');
  writeFileSync(script, smoke);
  execFileSync('node', [script], { cwd: temp, stdio: 'inherit' });
  console.log(`Package consumer: ${packed.name}@${packed.version}, ${packed.files.length} files, React render and CSS passed`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
