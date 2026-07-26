import { defineConfig, devices } from '@playwright/test';

const PORT = 5183;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Kept modest (rather than unbounded) so many concurrent Chromium instances don't starve
  // each other's CPU time enough to delay the guided tour's setTimeout-based auto-trigger past
  // dismissTourIfPresent()'s wait window.
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx vite --mode e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
