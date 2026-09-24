import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { Icon, ICON_CATALOG, ICON_NAMES } from '../src/icons';
import * as Icons from '../src/icons';
import { ICONS } from '../icons/src/icons.mjs';

test('all 31 Soft Hardware icons are exported with their authored geometry', () => {
  assert.equal(ICON_NAMES.length, 31);
  for (const source of ICONS) {
    const record = ICON_CATALOG[source.name as keyof typeof ICON_CATALOG];
    assert.ok(record, source.name);
    assert.equal(record.body, source.body, `${source.name} geometry drifted`);
    const component = source.name.split('-').map((p: string) => p[0].toUpperCase() + p.slice(1)).join('') + 'Icon';
    assert.ok(component in Icons, `${component} missing`);
    assert.ok(record.pressMs > 0, `${source.name} has no press track`);
  }
});

test('every authored motion rule ships in the icon CSS', () => {
  const css = readFileSync(new URL('../src/icons/icons.generated.css', import.meta.url), 'utf8');
  for (const source of ICONS) {
    for (const kf of (source.mo ?? '').matchAll(/@keyframes ([\w-]+)/g)) {
      assert.ok(css.includes(`@keyframes ${kf[1]}`), `${source.name}: ${kf[1]}`);
    }
  }
  assert.match(css, /@media \(prefers-reduced-motion:no-preference\)/);
});

test('ids in defs are unique per instance', () => {
  const html = renderToStaticMarkup(<><Icon name="image" /><Icon name="image" /></>);
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(!html.includes('&-'));
});

test('title makes the icon an image; static opt-out', () => {
  const html = renderToStaticMarkup(<Icon name="synced" title="Synced" animate={false} />);
  assert.match(html, /role="img"/);
  assert.match(html, /<title>Synced<\/title>/);
  assert.match(html, /data-static=""/);
  assert.doesNotMatch(html, /aria-hidden/);
});
