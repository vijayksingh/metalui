import { defineConfig } from '@playwright/test';

// Feature slices against the real docs site: a page, real input, computed styles and captures.
const port = process.env.METALUI_TEST_PORT ?? '4193';
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  // an agent's checkout runs on its own port beside others: two browsers each keeps the machine responsive
  workers: process.env.METALUI_TEST_PORT ? 2 : undefined,
  use: { baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 },
  webServer: { command: `npm exec -w @metalui/docs -- vite --host 127.0.0.1 --port ${port}`, url: `http://127.0.0.1:${port}`, reuseExistingServer: !process.env.METALUI_TEST_PORT },
});
