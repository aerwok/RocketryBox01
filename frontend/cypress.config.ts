import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(_on, config) {
      // implement node event listeners here
      return config;
    },
  },
  env: {
    apiUrl: 'http://localhost:8000/api/v2',
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 120000,
  requestTimeout: 10000,
  responseTimeout: 30000,
  chromeWebSecurity: false,
}); 