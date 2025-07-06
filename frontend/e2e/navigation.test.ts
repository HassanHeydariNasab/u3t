import { expect, test } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

// Set test suite name for database isolation
DatabaseHelper.setTestSuite('navigation');

test.describe('Navigation and Routing', () => {
	test.beforeEach(async ({ page }) => {
		// Clear database before each test
		await DatabaseHelper.clearDatabase();

		// Clear localStorage before each test
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('should redirect root to login when not authenticated', async ({ page }) => {
		await page.goto('/');

		// Should see loading state briefly then redirect to login
		await page.waitForURL('/login');
		await expect(page.locator('h2')).toContainText('Login');
	});

	test('should redirect root to dashboard when authenticated', async ({ page }) => {
		// First register a user
		await page.goto('/register');
		await page.fill('input[name="email"]', 'nav-test@example.com');
		await page.fill('input[name="username"]', 'navTestUser');
		await page.fill('input[name="password"]', 'testPassword123');
		await page.fill('input[name="confirmPassword"]', 'testPassword123');
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Now go to root - should redirect to dashboard
		await page.goto('/');
		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText('Welcome, navTestUser!');
	});

	test('should handle direct navigation to protected routes', async ({ page }) => {
		// Try to access dashboard directly when not authenticated
		await page.goto('/dashboard');

		// Should redirect to login
		await page.waitForURL('/login');
		await expect(page.locator('h2')).toContainText('Login');
	});

	test('should allow access to public routes', async ({ page }) => {
		// Login page should be accessible
		await page.goto('/login');
		await expect(page.locator('h2')).toContainText('Login');

		// Register page should be accessible
		await page.goto('/register');
		await expect(page.locator('h2')).toContainText('Register');
	});

	test('should handle browser back/forward navigation', async ({ page }) => {
		// Start at login
		await page.goto('/login');
		await expect(page.locator('h2')).toContainText('Login');

		// Navigate to register
		await page.goto('/register');
		await expect(page.locator('h2')).toContainText('Register');

		// Go back
		await page.goBack();
		await expect(page.locator('h2')).toContainText('Login');

		// Go forward
		await page.goForward();
		await expect(page.locator('h2')).toContainText('Register');
	});

	test('should handle 404 pages gracefully', async ({ page }) => {
		// Try to access a non-existent route
		await page.goto('/non-existent-page');

		// Should either redirect to login or show a proper error page
		// Since we don't have a 404 page set up, it will likely redirect to login
		await page.waitForURL('/login');
	});

	test('should maintain authentication state across navigation', async ({ page }) => {
		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', 'nav-auth-test@example.com');
		await page.fill('input[name="username"]', 'navAuthUser');
		await page.fill('input[name="password"]', 'testPassword123');
		await page.fill('input[name="confirmPassword"]', 'testPassword123');
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Navigate to different routes and back
		await page.goto('/');
		await page.waitForURL('/dashboard'); // Should redirect back to dashboard

		// Directly access dashboard again
		await page.goto('/dashboard');
		await expect(page.locator('h1')).toContainText('Welcome, navAuthUser!');
	});

	test('should handle URL parameters and fragments', async ({ page }) => {
		// Test with query parameters
		await page.goto('/login?redirect=dashboard');
		await expect(page.locator('h2')).toContainText('Login');

		// Test with fragment
		await page.goto('/register#top');
		await expect(page.locator('h2')).toContainText('Register');
	});

	test('should handle page title updates', async ({ page }) => {
		// Check login page title
		await page.goto('/login');
		await expect(page).toHaveTitle(/Ultimate Tic Tac Toe/);

		// Check register page title
		await page.goto('/register');
		await expect(page).toHaveTitle(/Ultimate Tic Tac Toe/);

		// Check dashboard title after authentication
		await page.fill('input[name="email"]', 'title-test@example.com');
		await page.fill('input[name="username"]', 'titleTestUser');
		await page.fill('input[name="password"]', 'testPassword123');
		await page.fill('input[name="confirmPassword"]', 'testPassword123');
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		await expect(page).toHaveTitle(/Dashboard - Ultimate Tic Tac Toe/);
	});
});
