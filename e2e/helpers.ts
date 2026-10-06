import type { Page } from '@playwright/test';

export type Colorway = 'bone' | 'graphite';
export const COLORWAYS: Colorway[] = ['bone', 'graphite'];

/** Opens a docs page in a colorway (the site's own switch persists it in localStorage). */
export async function open(page: Page, path: string, colorway: Colorway) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto(path);
  await page.waitForSelector('main h1');
  await page.evaluate(() => document.fonts.ready);
  // Captures are of the page, not the sticky header scrolled over it.
  await page.addStyleTag({ content: 'body > #root header { position: static !important; }' });
}

/** Emulates a media feature Playwright has no option for, through the DevTools protocol. */
export async function emulateMedia(page: Page, features: { name: string; value: string }[]) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', { features });
}

export const capture = (name: string) => `docs/captures/web/${name}.png`;

/**
 * Scrubs (Base UI's ScrubArea, the cues' unit scrub, the date cue's hold) ask for pointer lock. Headless
 * Linux Chromium grants it, but Playwright's synthetic moves under the lock then report bogus movement
 * (each step swings by the pointer's absolute position and back), so a 7px drag reads as ±400px. Refuse
 * the lock before the page loads: Base UI catches the refusal and scrubs on ordinary pointer events, a
 * path real browsers take too (Safari, denied permission), so the gesture under test is unchanged.
 */
export async function withoutPointerLock(page: Page) {
  await page.addInitScript(() => {
    Element.prototype.requestPointerLock = function () {
      return Promise.reject(new DOMException('Pointer lock is refused in the browser suite', 'NotSupportedError'));
    } as typeof Element.prototype.requestPointerLock;
  });
}
