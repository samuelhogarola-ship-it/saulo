const { defineConfig, devices } = require('@playwright/test');

const useManagedWebServer = process.env.PLAYWRIGHT_MANAGED_SERVER !== 'false';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: useManagedWebServer
    ? {
        command: 'npm run dev',
        timeout: 120 * 1000,
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
