#!/usr/bin/env node
// Full-page screenshots in headless Chrome over CDP. Node stdlib + the global WebSocket (Node 22+).
// Headless only: no window opens and focus is never taken.
//
//   node apps/docs/scripts/capture.mjs [options] <url-or-path> …
//
//   <url-or-path>   a full URL, or a docs path like /components/button (resolved against BASE)
//   --name <n>      file stem for the first URL (default: derived from the URL)
//   --widths 1440,390        viewport widths (default both)
//   --colorways bone,graphite  sets documentElement.dataset.muColorway, and the docs' stored choice (default both)
//   --dpr 2         device pixel ratio (default 2)
//   --out <dir>     output directory (default docs/captures/review)
//   --tiles         also write 1x viewport-height tiles (<stem>.tile-N.png), for reading at a glance
//   --maxh 14000    cap on page height in CSS px (default 14000)
//   --wait 700      extra settle time after fonts are ready, in ms
//
// Env: BASE (default http://127.0.0.1:4193), CHROME (path to the Chrome binary).
// Output: <out>/<stem>-<width>-<colorway>.png, one image of the whole page.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { crc32, deflateSync, inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE || 'http://127.0.0.1:4193';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- args ---------- */
const opts = { widths: [1440, 390], colorways: ['bone', 'graphite'], dpr: 2, out: join(ROOT, 'docs/captures/review'), tiles: false, maxh: 14000, wait: 700, names: [] };
const targets = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--widths') opts.widths = argv[++i].split(',').map(Number);
  else if (a === '--colorways') opts.colorways = argv[++i].split(',');
  else if (a === '--dpr') opts.dpr = Number(argv[++i]);
  else if (a === '--out') opts.out = resolve(argv[++i]);
  else if (a === '--tiles') opts.tiles = true;
  else if (a === '--maxh') opts.maxh = Number(argv[++i]);
  else if (a === '--wait') opts.wait = Number(argv[++i]);
  else if (a === '--name') opts.names[targets.length] = argv[++i];
  else targets.push(a);
}
if (!targets.length) {
  console.error('usage: capture.mjs [--widths 1440,390] [--colorways bone,graphite] [--tiles] [--name stem] <url|/path> …');
  process.exit(1);
}
mkdirSync(opts.out, { recursive: true });

const stemOf = (url) => {
  const u = new URL(url);
  const local = u.protocol === 'file:' || u.hostname === '127.0.0.1' || u.hostname === 'localhost';
  const path = u.pathname.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '_') || 'index';
  return local ? path : `${u.hostname.replace(/^www\./, '').replace(/\./g, '_')}_${path}`;
};

/* ---------- chrome ---------- */
const port = 9300 + Math.floor(Math.random() * 500);
const profile = join(process.env.TMPDIR || '/tmp', `mu-capture-${port}`);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--hide-scrollbars', '--force-color-profile=srgb', '--no-first-run', '--no-default-browser-check',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank',
], { stdio: 'ignore' });

let page;
for (let i = 0; i < 100 && !page; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
  if (!page) await sleep(120);
}
if (!page) { chrome.kill(); throw new Error('Chrome did not start'); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}, ms = 60000) => new Promise((res) => {
  const id = ++seq;
  const t = setTimeout(() => { pending.delete(id); res({ error: { message: `timeout ${method}` } }); }, ms);
  pending.set(id, (m) => { clearTimeout(t); res(m); });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Page.enable');
await send('Runtime.enable');

/* ---------- png: decode, stack, encode (stdlib zlib) ---------- */
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function decodePNG(buf) {
  let o = 8, w = 0, h = 0, type = 0;
  const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), kind = buf.toString('ascii', o + 4, o + 8), data = buf.subarray(o + 8, o + 8 + len);
    if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); type = data[9]; if (data[8] !== 8 || data[12]) throw new Error('unsupported png'); }
    else if (kind === 'IDAT') idat.push(data);
    o += 12 + len;
  }
  const bpp = type === 6 ? 4 : type === 2 ? 3 : 0;
  if (!bpp) throw new Error(`unsupported png colour type ${type}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp, out = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride, up = dst - stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0, b = y ? out[up + x] : 0, c = x >= bpp && y ? out[up + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[dst + x] = v & 255;
    }
  }
  return { w, h, bpp, type, px: out };
}
function encodePNG({ w, h, bpp, type, px }) {
  const stride = w * bpp, raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const chunk = (kind, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(kind, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = type;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- capture ---------- */
// A single very tall capture stalls the compositor (backdrop filters), so the page is shot in
// viewport tiles and stacked. For the stack to read as one page, sticky parts are laid out in flow
// and small fixed overlays (floating panels) show only in the first tile.
const FLATTEN = `(() => {
  const s = document.createElement('style'); s.id = '__cap'; s.textContent = '[data-cap-static]{position:static!important}[data-cap-hide].__cap-later{visibility:hidden!important}';
  document.head.appendChild(s);
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position === 'sticky') el.setAttribute('data-cap-static', '');
    else if (cs.position === 'fixed') { const r = el.getBoundingClientRect(); if (r.width < innerWidth * 0.9 || r.height < innerHeight * 0.9) el.setAttribute('data-cap-hide', ''); }
  }
})()`;

async function shoot(url, stem, width, colorway) {
  const mobile = width < 600;
  const vh = mobile ? 844 : 900;
  const tile = mobile ? 1400 : 1600;
  // The docs store their colorway choice; set it before any script runs so the first paint is right.
  const boot = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{localStorage.setItem('metalui:colorway',${JSON.stringify(colorway)})}catch(e){};document.documentElement.dataset.muColorway=${JSON.stringify(colorway)};`,
  });
  await send('Emulation.setDeviceMetricsOverride', { width, height: vh, deviceScaleFactor: opts.dpr, mobile });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: colorway === 'graphite' ? 'dark' : 'light' }] });
  await send('Page.navigate', { url });
  await evaluate(`new Promise(r => { const go = () => document.fonts.ready.then(() => setTimeout(r, ${opts.wait})); document.readyState === 'complete' ? go() : addEventListener('load', go); setTimeout(r, 12000); })`);
  // Keep the colorway if the page resets it after load.
  await evaluate(`document.documentElement.dataset.muColorway = ${JSON.stringify(colorway)}; new Promise(r => setTimeout(r, 250))`);
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: boot.result?.identifier });

  const overflow = await evaluate('document.documentElement.scrollWidth - innerWidth');
  const file = join(opts.out, `${stem}-${width}-${colorway}.png`);

  if (opts.tiles) {
    // Reading tiles: what a visitor sees, one screen at a time, at 1x.
    await send('Emulation.setDeviceMetricsOverride', { width, height: vh, deviceScaleFactor: 1, mobile });
    const h = await evaluate('document.documentElement.scrollHeight');
    const n = Math.ceil(Math.min(opts.maxh, h) / vh);
    for (let k = 0; k < n; k++) {
      await evaluate(`window.scrollTo(0, ${k * vh}); new Promise(r => setTimeout(r, 250))`);
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      if (shot.result) writeFileSync(file.replace(/\.png$/, `.tile-${k}.png`), Buffer.from(shot.result.data, 'base64'));
    }
  }

  await send('Emulation.setDeviceMetricsOverride', { width, height: tile, deviceScaleFactor: opts.dpr, mobile });
  await evaluate(`${FLATTEN}; window.scrollTo(0, 0); new Promise(r => setTimeout(r, 300))`);
  const total = Math.min(opts.maxh, await evaluate('Math.ceil(document.documentElement.scrollHeight)'));
  const rows = [];
  let meta;
  for (let y = 0; y < total; y += tile) {
    const got = await evaluate(`window.scrollTo(0, ${y}); ${y ? "document.querySelectorAll('[data-cap-hide]').forEach(e => e.classList.add('__cap-later'));" : ''} new Promise(r => requestAnimationFrame(() => setTimeout(() => r(scrollY), 250)))`);
    const shot = await send('Page.captureScreenshot', { format: 'png' }, 120000);
    if (!shot.result) { console.error('failed tile', y, shot.error?.message); break; }
    const img = decodePNG(Buffer.from(shot.result.data, 'base64'));
    meta ??= img;
    // The last scroll clamps; take only the rows this tile adds.
    const skip = Math.round((y - got) * opts.dpr);
    const take = Math.min(img.h - skip, Math.round((total - y) * opts.dpr));
    rows.push(img.px.subarray(skip * img.w * img.bpp, (skip + take) * img.w * img.bpp));
  }
  const px = Buffer.concat(rows);
  writeFileSync(file, encodePNG({ ...meta, h: px.length / (meta.w * meta.bpp), px }));
  console.log(`${file}  ${width}×${total} @${opts.dpr}x${overflow > 0 ? `  HORIZONTAL OVERFLOW ${overflow}px` : ''}`);
}

try {
  for (const [i, t] of targets.entries()) {
    const url = /^(https?|file):/.test(t) ? t : BASE + (t.startsWith('/') ? t : `/${t}`);
    const stem = opts.names[i] || stemOf(url);
    for (const w of opts.widths) for (const cw of opts.colorways) await shoot(url, stem, w, cw);
  }
} finally {
  ws.close();
  chrome.kill();
  await sleep(200);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
