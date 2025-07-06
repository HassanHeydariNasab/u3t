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
		// Create unique user for this test
		const navUser = DatabaseHelper.createUniqueTestUser('navUser');

		// First register a user
		await page.goto('/register');
		await page.fill('input[name="email"]', navUser.email);
		await page.fill('input[name="username"]', navUser.username);
		await page.fill('input[name="password"]', navUser.password);
		await page.fill('input[name="confirmPassword"]', navUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Now go to root - should redirect to dashboard
		await page.goto('/');
		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText(`Welcome, ${navUser.username}!`);
	});

	test('should handle direct navigation to protected routes', async ({ page }) => {
		// Try to access dashboard directly when not authenticated
		await page.goto('/dashboard');

		// Should redirect to login
		await page.waitForURL('/login');
		await expect(page.locator('h2')).toContainText('Login');

		// Try to access game page directly when not authenticated
		await page.goto('/game/test-game-id');
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

		// Should show error page with redirect message
		await expect(page.locator('.error-page')).toBeVisible();
		await expect(page.locator('h1')).toContainText('Oops! Something went wrong');
		await expect(page.locator('p')).toContainText('Page not found. Redirecting to login...');

		// Should redirect to login after delay
		await page.waitForURL('/login', { timeout: 2000 });
	});

	test('should maintain authentication state across navigation', async ({ page }) => {
		// Create unique user for this test
		const navUser = DatabaseHelper.createUniqueTestUser('navUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', navUser.email);
		await page.fill('input[name="username"]', navUser.username);
		await page.fill('input[name="password"]', navUser.password);
		await page.fill('input[name="confirmPassword"]', navUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Navigate to different routes and back
		await page.goto('/');
		await page.waitForURL('/dashboard'); // Should redirect back to dashboard

		// Directly access dashboard again
		await page.goto('/dashboard');
		await expect(page.locator('h1')).toContainText(`Welcome, ${navUser.username}!`);
	});

	test('should handle game navigation flow', async ({ page }) => {
		// Create unique user for this test
		const navUser = DatabaseHelper.createUniqueTestUser('navUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', navUser.email);
		await page.fill('input[name="username"]', navUser.username);
		await page.fill('input[name="password"]', navUser.password);
		await page.fill('input[name="confirmPassword"]', navUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		await expect(page.locator('h2')).toContainText('Ultimate Tic-Tac-Toe');

		// Navigate back to dashboard
		await page.click('.btn-secondary');
		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText(`Welcome, ${navUser.username}!`);
	});

	test('should handle invalid game ID navigation', async ({ page }) => {
		// Create unique user for this test
		const navUser = DatabaseHelper.createUniqueTestUser('navUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', navUser.email);
		await page.fill('input[name="username"]', navUser.username);
		await page.fill('input[name="password"]', navUser.password);
		await page.fill('input[name="confirmPassword"]', navUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Try to access invalid game ID
		await page.goto('/game/invalid-game-id');

		// Should show error or redirect back to dashboard
		await expect(page.locator('.error')).toBeVisible();
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
		await expect(page).toHaveTitle(/Login - Ultimate Tic Tac Toe/);

		// Check register page title
		await page.goto('/register');
		await expect(page).toHaveTitle(/Register - Ultimate Tic Tac Toe/);

		// Create unique user for this test
		const navUser = DatabaseHelper.createUniqueTestUser('navUser');

		// Register and check dashboard title
		await page.fill('input[name="email"]', navUser.email);
		await page.fill('input[name="username"]', navUser.username);
		await page.fill('input[name="password"]', navUser.password);
		await page.fill('input[name="confirmPassword"]', navUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		await expect(page).toHaveTitle(/Dashboard - Ultimate Tic-Tac-Toe/);

		// Create game and check game page title
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		await expect(page).toHaveTitle(/Ultimate Tic-Tac-Toe - Game/);
	});

	test('should handle deep linking to game pages', async ({ page }) => {
		// Create unique user for this test
		const navUser = DatabaseHelper.createUniqueTestUser('navUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', navUser.email);
		await page.fill('input[name="username"]', navUser.username);
		await page.fill('input[name="password"]', navUser.password);
		await page.fill('input[name="confirmPassword"]', navUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		const gameUrl = page.url();

		// Navigate away
		await page.goto('/dashboard');
		await page.waitForURL('/dashboard');

		// Navigate back to game using direct URL
		await page.goto(gameUrl);
		await expect(page.locator('h2')).toContainText('Ultimate Tic-Tac-Toe');
	});

	test('should handle navigation after logout', async ({ page }) => {
		// Create unique user for this test
		const navUser = DatabaseHelper.createUniqueTestUser('navUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', navUser.email);
		await page.fill('input[name="username"]', navUser.username);
		await page.fill('input[name="password"]', navUser.password);
		await page.fill('input[name="confirmPassword"]', navUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		const gameUrl = page.url();

		// Go back to dashboard and logout
		await page.click('.btn-secondary');
		await page.waitForURL('/dashboard');
		await page.click('.logout-btn');
		await page.waitForURL('/login');

		// Try to access the game URL after logout
		await page.goto(gameUrl);
		await page.waitForURL('/login');
		await expect(page.locator('h2')).toContainText('Login');
	});

	test('should handle concurrent navigation in multiple tabs', async ({ page, context }) => {
		// Create unique user for this test
		const navUser = DatabaseHelper.createUniqueTestUser('navUser');

		// Register and login in first tab
		await page.goto('/register');
		await page.fill('input[name="email"]', navUser.email);
		await page.fill('input[name="username"]', navUser.username);
		await page.fill('input[name="password"]', navUser.password);
		await page.fill('input[name="confirmPassword"]', navUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		const gameUrl = page.url();

		// Open second tab and login with same user
		const page2 = await context.newPage();
		await page2.goto('/login');
		await page2.fill('input[name="email"]', navUser.email);
		await page2.fill('input[name="password"]', navUser.password);
		await page2.click('button[type="submit"]');
		await page2.waitForURL('/dashboard');

		// Navigate to the same game in second tab
		await page2.goto(gameUrl);
		await expect(page2.locator('h2')).toContainText('Ultimate Tic-Tac-Toe');

		// Both tabs should show the same game
		await expect(page.locator('.game-status')).toContainText('Waiting for opponent');
		await expect(page2.locator('.game-status')).toContainText('Waiting for opponent');
	});
});
