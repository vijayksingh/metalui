import type { Page } from '@playwright/test';

export type Colorway = 'bone' | 'graphite';
export const COLORWAYS: Colorway[] = ['bone', 'graphite'];

/** Opens a docs page in a colorway (the site's own switch persists it in localStorage). */
export async function open(page: Page, path: string, colorway: Colorway) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto(path);
  await page.waitForSelector('main h1');
  await page.evaluate(() => document.fonts.ready);
}

/** Emulates a media feature Playwright has no option for, through the DevTools protocol. */
export async function emulateMedia(page: Page, features: { name: string; value: string }[]) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', { features });
}

export const capture = (name: string) => `docs/captures/web/${name}.png`;
