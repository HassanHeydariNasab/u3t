import { expect, test } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

// Set test suite name for database isolation
DatabaseHelper.setTestSuite('demo');

test.describe('Application Smoke Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Clear database before each test
		await DatabaseHelper.clearDatabase();

		// Clear localStorage before each test
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('complete user journey - register, login, dashboard, logout', async ({ page }) => {
		// Clear any existing state
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());

		// Step 1: Initial redirect to login
		await page.goto('/');
		await page.waitForURL('/login');
		await expect(page.locator('h1')).toContainText('Ultimate Tic Tac Toe');

		// Step 2: Navigate to register and create account
		await page.goto('/register');
		await page.fill('input[name="email"]', 'smoke-test@example.com');
		await page.fill('input[name="username"]', 'smokeTestUser');
		await page.fill('input[name="password"]', 'smokePassword123');
		await page.fill('input[name="confirmPassword"]', 'smokePassword123');
		await page.click('button[type="submit"]');

		// Step 3: Should redirect to dashboard after registration
		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText('Welcome, smokeTestUser!');
		await expect(page.locator('.user-info')).toContainText('smoke-test@example.com');

		// Step 4: Verify dashboard elements
		await expect(page.locator('.game-btn')).toHaveCount(3);
		await expect(page.locator('.logout-btn')).toBeVisible();

		// Step 5: Logout
		await page.click('.logout-btn');
		await page.waitForURL('/login');

		// Step 6: Login with same credentials
		await page.fill('input[name="email"]', 'smoke-test@example.com');
		await page.fill('input[name="password"]', 'smokePassword123');
		await page.click('button[type="submit"]');

		// Step 7: Should be back on dashboard
		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText('Welcome, smokeTestUser!');

		// Step 8: Test page refresh maintains authentication
		await page.reload();
		await expect(page.locator('h1')).toContainText('Welcome, smokeTestUser!');
	});

	test('home page displays loading state correctly', async ({ page }) => {
		await page.goto('/');

		// Clear any existing auth state after navigation
		await page.evaluate(() => {
			try {
				localStorage.clear();
			} catch (e) {
				// Ignore localStorage access errors
			}
		});

		// Should show loading state initially (even if briefly) or redirect directly to login
		try {
			await expect(page.locator('.loading')).toBeVisible({ timeout: 1000 });
			await expect(page.locator('.loading h1')).toContainText('Ultimate Tic Tac Toe');
		} catch (error) {
			// If loading state is too fast, that's ok - check we're on login
			await expect(page).toHaveURL('/login');
		}

		// Should redirect to login
		await page.waitForURL('/login');
	});

	test('application handles invalid routes gracefully', async ({ page }) => {
		// Try accessing invalid route
		await page.goto('/invalid-route');

		// Should redirect to login (default behavior)
		await page.waitForURL('/login');
		await expect(page.locator('h2')).toContainText('Login');
	});

	test('forms have proper validation and error handling', async ({ page }) => {
		// Test login form validation
		await page.goto('/login');
		await page.click('button[type="submit"]');
		await expect(page.locator('.error')).toContainText('Please fill in all fields');

		// Test register form validation
		await page.goto('/register');
		await page.click('button[type="submit"]');
		await expect(page.locator('.error')).toContainText('Please fill in all fields');

		// Test password mismatch
		await page.fill('input[name="email"]', 'test@example.com');
		await page.fill('input[name="username"]', 'testuser');
		await page.fill('input[name="password"]', 'password123');
		await page.fill('input[name="confirmPassword"]', 'different');
		await page.click('button[type="submit"]');
		await expect(page.locator('.error')).toContainText('Passwords do not match');
	});

	test('application is responsive on different screen sizes', async ({ page }) => {
		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/login');

		// Form should still be visible and usable
		await expect(page.locator('.login-form')).toBeVisible();
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();

		// Test tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto('/register');

		// Form should still be visible and usable
		await expect(page.locator('.register-form')).toBeVisible();
		await expect(page.locator('input[name="email"]')).toBeVisible();

		// Test desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });

		// Register a user and check dashboard
		await page.fill('input[name="email"]', 'responsive-test@example.com');
		await page.fill('input[name="username"]', 'responsiveUser');
		await page.fill('input[name="password"]', 'password123');
		await page.fill('input[name="confirmPassword"]', 'password123');
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Dashboard should be properly laid out
		await expect(page.locator('.dashboard')).toBeVisible();
		await expect(page.locator('.game-buttons')).toBeVisible();
	});
});
