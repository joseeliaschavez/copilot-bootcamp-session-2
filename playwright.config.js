const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    ...devices['Desktop Chrome'],
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run start:backend',
      url: 'http://127.0.0.1:3030/',
      reuseExistingServer: true,
      timeout: 90_000,
    },
    {
      command: 'npm run start:frontend',
      url: 'http://127.0.0.1:3000/',
      reuseExistingServer: true,
      timeout: 90_000,
    },
  ],
});
