import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    browserName: 'chromium',
    headless: true,
    screenshot: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm.cmd run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
