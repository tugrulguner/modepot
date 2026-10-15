import { defineConfig } from '@playwright/test';

const port = process.env.MODEPOT_PREVIEW_PORT || '4387';
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests',
  use: { baseURL },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
