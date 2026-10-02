import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The checkbox's tick is a pen stroke along the check glyph's route: drawn by its dash from the short
// leg's start, through the corner, up the long leg past the tip and back; drawn back before the key
// goes light; the mixed parent's dash bends into it. What is observed is what the eye sees: how much of
// the stroke is on screen, frame by frame, and the key's colour.

type Frame = { t: number; drawn: number; whole: boolean; hidden: boolean; d: string; keyChanged: boolean };

/** Film the checkbox's stroke for `ms`, one sample per frame, while `act` runs. */
async function film(box: Locator, ms: number, act: () => Promise<void>): Promise<Frame[]> {
  const frames = box.evaluate((el, ms) => new Promise<Frame[]>((done) => {
    const out: Frame[] = [];
    const on = getComputedStyle(el).backgroundImage;
    const t0 = performance.now();
    const step = () => {
      const path = el.querySelector('.mu-dimple-tick path') as SVGPathElement;
      const s = getComputedStyle(path);
      const dash = s.strokeDasharray;
      out.push({
        t: performance.now() - t0,
        drawn: dash === 'none' ? -1 : parseFloat(dash) - parseFloat(s.strokeDashoffset),
        whole: dash === 'none',
        hidden: s.visibility === 'hidden',
        d: path.getAttribute('d') ?? '',
        keyChanged: getComputedStyle(el).backgroundImage !== on,
      });
      if (performance.now() - t0 < ms) requestAnimationFrame(step); else done(out);
    };
    step();
  }), ms);
  await act();
  return frames;
}

/** A capture of the checkbox with room around it. */
async function shoot(box: Locator, name: string) {
  const b = (await box.boundingBox())!;
  await box.page().screenshot({ path: capture(name), clip: { x: b.x - 12, y: b.y - 12, width: b.width + 24, height: b.height + 24 } });
}

/** The route's length on screen (grid units): the sum of the legs of `M…L…L…`. */
const routeLength = (d: string) => {
  const n = d.match(/-?[\d.]+/g)!.map(Number);
  let sum = 0;
  for (let i = 2; i + 1 < Math.min(n.length, 6); i += 2) sum += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
  return sum;
};

for (const colorway of COLORWAYS) {
  test(`the tick is drawn by a pen, corner then a sprung long leg, and drawn back in ${colorway}`, async ({ page }) => {
    await open(page, '/components/checkbox', colorway);
    const box = page.getByRole('checkbox', { name: 'Call the printer' });
    await box.scrollIntoViewIfNeeded();

    const draw = await film(box, 900, () => box.click());
    const rest = draw.at(-1)!;
    expect(rest.whole && !rest.hidden).toBe(true);
    const route = routeLength(rest.d);
    const short = routeLength(rest.d.replace(/L[^L]*$/, ''));
    const drawing = draw.filter((f) => !f.whole && !f.hidden);
    // It starts from nothing, and the stroke only grows until it passes the tip.
    expect(drawing[0].drawn).toBeLessThan(short);
    const peak = drawing.reduce((m, f) => Math.max(m, f.drawn), 0);
    const toPeak = drawing.slice(0, drawing.findIndex((f) => f.drawn === peak) + 1);
    toPeak.forEach((f, i) => { if (i) expect(f.drawn).toBeGreaterThanOrEqual(toPeak[i - 1].drawn - 1e-3); });
    // A dwell at the corner: at least two frames with the short leg done and the long one not begun.
    expect(drawing.filter((f) => Math.abs(f.drawn - short) < 0.05).length).toBeGreaterThanOrEqual(2);
    // The tail overshoots the tip on the part spring, then settles back onto it.
    expect(peak).toBeGreaterThan(route + 0.3);
    expect(drawing.at(-1)!.drawn).toBeLessThan(peak);
    await shoot(box, `checkbox-tick-${colorway}`);

    const undraw = await film(box, 600, () => box.click());
    const going = undraw.filter((f) => !f.whole && !f.hidden);
    expect(going.length).toBeGreaterThan(2);
    // Drawn back from the tail: the stroke only shrinks, with the key still dark.
    going.forEach((f, i) => { if (i) expect(f.drawn).toBeLessThanOrEqual(going[i - 1].drawn + 1e-3); });
    going.forEach((f) => expect(f.keyChanged).toBe(false));
    // Then it is gone, and only after that does the key go light.
    const gone = undraw.findIndex((f) => f.hidden);
    expect(gone).toBeGreaterThan(0);
    expect(undraw.at(-1)!.keyChanged).toBe(true);
    await expect(box).toHaveAttribute('aria-checked', 'false');
  });
}

test('Reduce Motion: the tick is whole at once, and gone at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/checkbox', 'bone');
  const box = page.getByRole('checkbox', { name: 'Call the printer' });
  const on = await film(box, 200, () => box.click());
  on.filter((f) => !f.hidden).forEach((f) => expect(f.whole).toBe(true));
  expect(on.at(-1)!.hidden).toBe(false);
  await shoot(box, 'checkbox-tick-reduced');
  const off = await film(box, 200, () => box.click());
  expect(off.filter((f) => !f.hidden && !f.whole)).toEqual([]);
  expect(off.at(-1)!.hidden).toBe(true);
});

test('the mixed parent draws a dash, which bends into the tick when everything is ticked', async ({ page }) => {
  await open(page, '/components/checkbox-group', 'bone');
  const g = page.getByRole('group', { name: 'Export contents', exact: true });
  const parent = g.getByRole('checkbox').first();
  await expect(parent).toHaveAttribute('aria-checked', 'mixed');
  const flat = (d: string) => new Set(d.match(/-?[\d.]+/g)!.filter((_, i) => i % 2).map(Number)).size === 1;
  const dash = await parent.locator('.mu-dimple-tick path').getAttribute('d');
  expect(flat(dash!)).toBe(true);

  const bend = await film(parent, 600, () => parent.click());
  // Never swapped: the same stroke, whole throughout, passes through shapes between the dash and the tick.
  bend.filter((f) => !f.hidden).forEach((f) => expect(f.whole).toBe(true));
  const between = bend.filter((f) => !flat(f.d) && f.d !== bend.at(-1)!.d);
  expect(between.length).toBeGreaterThan(2);
  expect(flat(bend.at(-1)!.d)).toBe(false);

  // Unticking a child bends the tick back into the dash; clearing that child withdraws the dash.
  const back = await film(parent, 600, () => g.getByText('Photos').click());
  expect(flat(back.at(-1)!.d)).toBe(true);
});

test('the parent\'s cascade draws each row\'s tick in turn, from the top', async ({ page }) => {
  await open(page, '/components/checkbox-group', 'bone');
  const g = page.getByRole('group', { name: 'Export contents', exact: true });
  const starts = await g.evaluate((el) => new Promise<number[]>((done) => {
    const paths = [...el.querySelectorAll('.mu-dimple-tick path')].slice(1) as SVGPathElement[];
    const first: number[] = paths.map(() => -1);
    const t0 = performance.now();
    (el.querySelector('[role=checkbox]') as HTMLElement).click();
    const step = () => {
      paths.forEach((p, i) => { if (first[i] < 0 && getComputedStyle(p).visibility !== 'hidden') first[i] = performance.now() - t0; });
      if (performance.now() - t0 < 600) requestAnimationFrame(step); else done(first);
    };
    step();
  }));
  // Notes was ticked already; photos, links, drawings and voice notes begin 30 ms apart.
  const fresh = starts.slice(-4);
  fresh.forEach((t, i) => { if (i) expect(t).toBeGreaterThan(fresh[i - 1]); });
  expect(fresh[3] - fresh[0]).toBeGreaterThan(60);
  expect(fresh[3] - fresh[0]).toBeLessThan(160);
});

test('the tick tuner drives the pen, and its group goes from mixed to all', async ({ page }) => {
  await open(page, '/components/checkbox', 'bone');
  const tuner = page.getByTestId('checkbox-tick-tuner');
  await tuner.scrollIntoViewIfNeeded();
  const task = tuner.getByRole('checkbox', { name: 'Tuned task' });
  const draw = await film(task, 900, () => task.click());
  expect(draw.some((f) => !f.whole && !f.hidden)).toBe(true);
  expect(draw.at(-1)!.whole).toBe(true);
  const parent = tuner.getByRole('checkbox').nth(1);
  await expect(parent).toHaveAttribute('aria-checked', 'mixed');
  await parent.click();
  await expect(parent).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(700);
  await tuner.screenshot({ path: capture('checkbox-tick-tuner') });
});

test('reducing a scope mid-stroke lands the selected mark and cancels its clock', async ({ page }) => {
  await open(page, '/components/checkbox', 'bone');
  const box = page.getByRole('checkbox', { name: 'Call the printer' });
  const path = box.locator('.mu-dimple-tick path');
  await box.click();
  await expect.poll(() => path.evaluate(el => el.getAnimations().length)).toBeGreaterThan(0);
  await box.evaluate(el => el.parentElement!.setAttribute('data-mu-motion', 'reduce'));
  await expect(path).toHaveAttribute('visibility', 'visible');
  await expect.poll(() => path.evaluate(el => el.getAnimations().length)).toBe(0);
  await expect.poll(() => path.evaluate(el => el.style.strokeDasharray)).toBe('');
  const resting = await path.getAttribute('d');
  await box.evaluate(el => el.parentElement!.removeAttribute('data-mu-motion'));
  await expect(path).toHaveAttribute('d', resting!);
  await expect.poll(() => path.evaluate(el => el.getAnimations().length)).toBe(0);
  await box.click();
  await expect.poll(() => path.evaluate(el => el.getAnimations().length)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(path).toHaveAttribute('visibility', 'hidden');
  await expect.poll(() => path.evaluate(el => el.getAnimations().length)).toBe(0);
  await expect(box).toHaveAttribute('aria-checked', 'false');
});
