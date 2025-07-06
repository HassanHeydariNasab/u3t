import { expect, test } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

// Set test suite name for database isolation
DatabaseHelper.setTestSuite('dashboard');

test.describe('Dashboard Functionality', () => {
	test.beforeEach(async ({ page }) => {
		// Clear database before each test
		await DatabaseHelper.clearDatabase();

		// Clear localStorage and register/login user
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('should display user information correctly', async ({ page }) => {
		// Create unique user for this test
		const dashboardUser = DatabaseHelper.createUniqueTestUser('dashboardUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', dashboardUser.email);
		await page.fill('input[name="username"]', dashboardUser.username);
		await page.fill('input[name="password"]', dashboardUser.password);
		await page.fill('input[name="confirmPassword"]', dashboardUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Check welcome message
		await expect(page.locator('h1')).toContainText(`Welcome, ${dashboardUser.username}!`);

		// Check user info section
		const userInfo = page.locator('.user-info');
		await expect(userInfo).toBeVisible();
		await expect(userInfo).toContainText(dashboardUser.email);
	});

	test('should display game creation functionality', async ({ page }) => {
		// Create unique user for this test
		const dashboardUser = DatabaseHelper.createUniqueTestUser('dashboardUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', dashboardUser.email);
		await page.fill('input[name="username"]', dashboardUser.username);
		await page.fill('input[name="password"]', dashboardUser.password);
		await page.fill('input[name="confirmPassword"]', dashboardUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Check game section title
		await expect(page.locator('h2')).toContainText('Ultimate Tic-Tac-Toe');

		// Check create game button
		const createGameBtn = page.locator('.create-game');
		await expect(createGameBtn).toBeVisible();
		await expect(createGameBtn).toContainText('Create New Game');
		await expect(createGameBtn).toBeEnabled();
	});

	test('should display game sections', async ({ page }) => {
		// Create unique user for this test
		const dashboardUser = DatabaseHelper.createUniqueTestUser('dashboardUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', dashboardUser.email);
		await page.fill('input[name="username"]', dashboardUser.username);
		await page.fill('input[name="password"]', dashboardUser.password);
		await page.fill('input[name="confirmPassword"]', dashboardUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Check My Games section
		const myGamesSection = page.locator('.games-section').first();
		await expect(myGamesSection.locator('h3')).toContainText('My Games');
		await expect(myGamesSection.locator('.no-games')).toContainText('No games yet');

		// Check Available Games section
		const availableGamesSection = page.locator('.games-section').nth(1);
		await expect(availableGamesSection.locator('h3')).toContainText('Available Games');
		await expect(availableGamesSection.locator('.no-games')).toContainText('No games waiting');

		// Check refresh button
		const refreshBtn = page.locator('.refresh-btn');
		await expect(refreshBtn).toBeVisible();
		await expect(refreshBtn).toContainText('Refresh Games');
	});

	test('should create a new game successfully', async ({ page }) => {
		// Create unique user for this test
		const dashboardUser = DatabaseHelper.createUniqueTestUser('dashboardUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', dashboardUser.email);
		await page.fill('input[name="username"]', dashboardUser.username);
		await page.fill('input[name="password"]', dashboardUser.password);
		await page.fill('input[name="confirmPassword"]', dashboardUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Click create game button
		await page.click('.create-game');

		// Should redirect to game page
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		await expect(page.locator('h2')).toContainText('Ultimate Tic-Tac-Toe');
	});

	test('should display logout button and functionality', async ({ page }) => {
		// Create unique user for this test
		const dashboardUser = DatabaseHelper.createUniqueTestUser('dashboardUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', dashboardUser.email);
		await page.fill('input[name="username"]', dashboardUser.username);
		await page.fill('input[name="password"]', dashboardUser.password);
		await page.fill('input[name="confirmPassword"]', dashboardUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		const logoutButton = page.locator('.logout-btn');
		await expect(logoutButton).toBeVisible();
		await expect(logoutButton).toContainText('Logout');

		// Click logout button
		await logoutButton.click();

		// Should redirect to login page
		await page.waitForURL('/login');
		await expect(page.locator('h2')).toContainText('Login');
	});

	test('should handle game refresh functionality', async ({ page }) => {
		// Create unique user for this test
		const dashboardUser = DatabaseHelper.createUniqueTestUser('dashboardUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', dashboardUser.email);
		await page.fill('input[name="username"]', dashboardUser.username);
		await page.fill('input[name="password"]', dashboardUser.password);
		await page.fill('input[name="confirmPassword"]', dashboardUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Click refresh button
		const refreshBtn = page.locator('.refresh-btn');
		await refreshBtn.click();

		// Button should show loading state briefly
		await expect(refreshBtn).toContainText('Loading...');

		// Wait for loading to complete
		await expect(refreshBtn).toContainText('Refresh Games');
	});

	test('should display games correctly when user has games', async ({ page }) => {
		// Create unique user for this test
		const dashboardUser = DatabaseHelper.createUniqueTestUser('dashboardUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', dashboardUser.email);
		await page.fill('input[name="username"]', dashboardUser.username);
		await page.fill('input[name="password"]', dashboardUser.password);
		await page.fill('input[name="confirmPassword"]', dashboardUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Go back to dashboard
		await page.click('.btn-secondary');
		await page.waitForURL('/dashboard');

		// Should now show the game in My Games section
		const myGamesSection = page.locator('.games-section').first();
		await expect(myGamesSection.locator('.game-card')).toBeVisible();
		await expect(myGamesSection.locator('.game-status')).toContainText('Waiting for opponent');
	});

	test('should handle page refresh while authenticated', async ({ page }) => {
		// Create unique user for this test
		const dashboardUser = DatabaseHelper.createUniqueTestUser('dashboardUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', dashboardUser.email);
		await page.fill('input[name="username"]', dashboardUser.username);
		await page.fill('input[name="password"]', dashboardUser.password);
		await page.fill('input[name="confirmPassword"]', dashboardUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Refresh the page
		await page.reload();

		// Should still be on dashboard and show user info
		await expect(page.locator('h1')).toContainText(`Welcome, ${dashboardUser.username}!`);
		await expect(page.locator('.user-info')).toContainText(dashboardUser.email);
	});

	test('should have proper responsive design', async ({ page }) => {
		// Create unique user for this test
		const dashboardUser = DatabaseHelper.createUniqueTestUser('dashboardUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', dashboardUser.email);
		await page.fill('input[name="username"]', dashboardUser.username);
		await page.fill('input[name="password"]', dashboardUser.password);
		await page.fill('input[name="confirmPassword"]', dashboardUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Dashboard should still be visible and functional
		await expect(page.locator('.dashboard')).toBeVisible();
		await expect(page.locator('.header')).toBeVisible();
		await expect(page.locator('.game-section')).toBeVisible();
		await expect(page.locator('.create-game')).toBeVisible();

		// Test tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(page.locator('.games-container')).toBeVisible();

		// Test desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });
		await expect(page.locator('.games-container')).toBeVisible();
	});
});
