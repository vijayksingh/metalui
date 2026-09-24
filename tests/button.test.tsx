import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../components/button/button';
import { SendAwayIcon } from '../src/icons';

test('renders a native button with the standard cap and icon trigger', () => {
  const html = renderToStaticMarkup(<Button>Cancel</Button>);
  assert.match(html, /^<button type="button"/);
  assert.match(html, /class="mu-button mu-icon-trigger"/);
  assert.match(html, /data-cap="standard"/);
});

test('caps and extra classes', () => {
  assert.match(renderToStaticMarkup(<Button cap="primary">New</Button>), /data-cap="primary"/);
  assert.match(renderToStaticMarkup(<Button cap="destructive" className="x">Delete</Button>), /class="mu-button mu-icon-trigger x"/);
  assert.match(renderToStaticMarkup(<Button className={() => 'fn'}>A</Button>), /class="mu-button mu-icon-trigger fn"/);
});

test('disabled state comes from Base UI', () => {
  const html = renderToStaticMarkup(<Button disabled>Nope</Button>);
  assert.match(html, /disabled=""/);
  assert.match(html, /data-disabled=""/);
});

test('icons inside a button are decorative and keep their moving parts at 16px', () => {
  const html = renderToStaticMarkup(<Button><SendAwayIcon size={16} />Delete</Button>);
  assert.match(html, /<svg[^>]*class="mu-icon mu-ic-send-away"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /class="dot/);
  assert.doesNotMatch(html, /--sw/);
});

test('static icons at 16px use the tuned small cut', () => {
  const html = renderToStaticMarkup(<SendAwayIcon size={16} animate={false} />);
  assert.match(html, /--sw:1.9/);
  assert.doesNotMatch(html, /class="dot/);
});
