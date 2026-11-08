const { defineConfig } = require('@playwright/test');
require('dotenv').config({ path: '.env.test' });

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['json', { outputFile: '../dashboard/results/e2e-results.json' }]],
  use: {
    baseURL: process.env.MEDUSA_STOREFRONT_URL || 'http://localhost:8000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
});
