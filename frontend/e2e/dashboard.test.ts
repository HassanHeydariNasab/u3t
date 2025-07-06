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
		await expect(userInfo).toContainText(`Email: ${dashboardUser.email}`);
		await expect(userInfo).toContainText(`Username: ${dashboardUser.username}`);
	});

	test('should display game section elements', async ({ page }) => {
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

		// Check welcome card
		const welcomeCard = page.locator('.welcome-card');
		await expect(welcomeCard).toBeVisible();
		await expect(welcomeCard.locator('h2')).toContainText('Ultimate Tic Tac Toe');
		await expect(welcomeCard).toContainText('Ready to play the ultimate version of tic-tac-toe?');

		// Check game section
		const gameSection = page.locator('.game-section');
		await expect(gameSection).toBeVisible();
		await expect(gameSection.locator('h3')).toContainText('Game Options');

		// Check game buttons
		const gameButtons = page.locator('.game-btn');
		await expect(gameButtons).toHaveCount(3);

		const buttons = await gameButtons.allTextContents();
		expect(buttons).toContain('Start New Game');
		expect(buttons).toContain('Join Game');
		expect(buttons).toContain('View Game History');
	});

	test('should display logout button', async ({ page }) => {
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
	});

	test('should handle game button interactions', async ({ page }) => {
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

		// Test Start New Game button
		const startGameBtn = page.locator('.game-btn').filter({ hasText: 'Start New Game' });
		await expect(startGameBtn).toBeVisible();
		await expect(startGameBtn).toBeEnabled();

		// Test Join Game button
		const joinGameBtn = page.locator('.game-btn').filter({ hasText: 'Join Game' });
		await expect(joinGameBtn).toBeVisible();
		await expect(joinGameBtn).toBeEnabled();

		// Test View Game History button
		const historyBtn = page.locator('.game-btn').filter({ hasText: 'View Game History' });
		await expect(historyBtn).toBeVisible();
		await expect(historyBtn).toBeEnabled();

		// Click each button (they don't have functionality yet, but should be clickable)
		await startGameBtn.click();
		await joinGameBtn.click();
		await historyBtn.click();
	});

	test('should have proper styling and layout', async ({ page }) => {
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

		// Check main dashboard container
		const dashboard = page.locator('.dashboard');
		await expect(dashboard).toBeVisible();

		// Check header section
		const header = page.locator('header');
		await expect(header).toBeVisible();

		// Check main content area
		const main = page.locator('main');
		await expect(main).toBeVisible();

		// Check that game buttons are laid out in a grid
		const gameButtons = page.locator('.game-buttons');
		await expect(gameButtons).toBeVisible();

		// Verify responsive design - buttons should be visible and properly spaced
		const buttons = page.locator('.game-btn');
		for (let i = 0; i < (await buttons.count()); i++) {
			await expect(buttons.nth(i)).toBeVisible();
		}
	});

	test('should logout and redirect to login', async ({ page }) => {
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

		// Click logout button
		await page.click('.logout-btn');

		// Should redirect to login page
		await page.waitForURL('/login');

		// Verify we're on login page
		await expect(page.locator('h2')).toContainText('Login');

		// Should not be able to access dashboard anymore
		await page.goto('/dashboard');
		await page.waitForURL('/login');
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

		// Should still be on dashboard
		await expect(page.locator('h1')).toContainText(`Welcome, ${dashboardUser.username}!`);

		// User info should still be displayed
		await expect(page.locator('.user-info')).toContainText(dashboardUser.email);
	});

	test('should display loading state during authentication check', async ({ page }) => {
		// Clear localStorage and go to dashboard
		await page.evaluate(() => localStorage.clear());
		await page.goto('/dashboard');

		// Should redirect to login since not authenticated
		await page.waitForURL('/login');
	});
});
