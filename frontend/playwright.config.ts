import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
	testDir: 'e2e',

	fullyParallel: false,

	// Fail the build on CI if you accidentally left test.only in the source code
	forbidOnly: !!process.env.CI,

	retries: 0,

	workers: 1,

	// Reporter to use
	reporter: [['list']],

	use: {
		// Base URL to use in actions like `await page.goto('/')`
		baseURL: process.env.PUBLIC_BASE_URL,

		// Collect trace when retrying the failed test
		trace: 'on-first-retry',

		// Take screenshot on failure
		screenshot: 'only-on-failure',

		// Record video on failure
		video: 'retain-on-failure'
	},

	// Configure projects for major browsers
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			// Set test suite name based on the test file
			testMatch: /.*\.test\.ts/
		}
	],

	// Run your local dev server before starting the tests
	webServer: {
		command: 'npm run build -- --mode test && npm run preview',
		url: process.env.PUBLIC_BASE_URL,
		timeout: 30 * 1000,
		reuseExistingServer: true,
		stdout: 'pipe',
		env: {
			...process.env,
			NODE_ENV: 'test'
		}
	}
});
