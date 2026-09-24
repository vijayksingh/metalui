import { defineConfig } from '@playwright/test';

// Feature slices against the real docs site: a page, real input, computed styles and captures.
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4193', viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4193', reuseExistingServer: true },
});
