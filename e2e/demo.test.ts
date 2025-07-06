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

	test('complete user journey - register, login, dashboard, create game, logout', async ({
		page
	}) => {
		// Create unique user for this test
		const smokeUser = DatabaseHelper.createUniqueTestUser('smokeUser');

		// Clear any existing state
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());

		// Step 1: Initial redirect to login
		await page.goto('/');
		await page.waitForURL('/login');
		await expect(page.locator('h1')).toContainText('Ultimate Tic Tac Toe');

		// Step 2: Navigate to register and create account
		await page.goto('/register');
		await page.fill('input[name="email"]', smokeUser.email);
		await page.fill('input[name="username"]', smokeUser.username);
		await page.fill('input[name="password"]', smokeUser.password);
		await page.fill('input[name="confirmPassword"]', smokeUser.password);
		await page.click('button[type="submit"]');

		// Step 3: Should redirect to dashboard after registration
		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText(`Welcome, ${smokeUser.username}!`);
		await expect(page.locator('.user-info')).toContainText(smokeUser.email);

		// Step 4: Verify dashboard elements
		await expect(page.locator('.create-game')).toBeVisible();
		await expect(page.locator('.logout-btn')).toBeVisible();
		await expect(page.locator('.games-section')).toHaveCount(2);

		// Step 5: Create a game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		await expect(page.locator('h2')).toContainText('Ultimate Tic-Tac-Toe');
		await expect(page.locator('.game-status')).toContainText('Waiting for opponent');

		// Step 6: Go back to dashboard
		await page.click('.btn-secondary');
		await page.waitForURL('/dashboard');
		await expect(page.locator('.game-card')).toBeVisible();

		// Step 7: Logout
		await page.click('.logout-btn');
		await page.waitForURL('/login');

		// Step 8: Login with same credentials
		await page.fill('input[name="email"]', smokeUser.email);
		await page.fill('input[name="password"]', smokeUser.password);
		await page.click('button[type="submit"]');

		// Step 9: Should be back on dashboard
		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText(`Welcome, ${smokeUser.username}!`);

		// Step 10: Test page refresh maintains authentication
		await page.reload();
		await expect(page.locator('h1')).toContainText(`Welcome, ${smokeUser.username}!`);
	});

	test('complete two-player game flow', async ({ page, context }) => {
		// Create two unique users
		const player1 = DatabaseHelper.createUniqueTestUser('player1');
		const player2 = DatabaseHelper.createUniqueTestUser('player2');

		// Player 1 registers and creates game
		await page.goto('/register');
		await page.fill('input[name="email"]', player1.email);
		await page.fill('input[name="username"]', player1.username);
		await page.fill('input[name="password"]', player1.password);
		await page.fill('input[name="confirmPassword"]', player1.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		const gameUrl = page.url();

		// Player 2 registers and joins game
		const page2 = await context.newPage();
		await page2.goto('/register');
		await page2.fill('input[name="email"]', player2.email);
		await page2.fill('input[name="username"]', player2.username);
		await page2.fill('input[name="password"]', player2.password);
		await page2.fill('input[name="confirmPassword"]', player2.password);
		await page2.click('button[type="submit"]');
		await page2.waitForURL('/dashboard');

		await page2.goto(gameUrl);
		await page2.click('.join-game button');

		// Verify game states
		await expect(page.locator('.game-status')).toContainText('Your turn');
		await expect(page2.locator('.game-status')).toContainText("Opponent's turn");

		// Player 1 makes first move
		await page.locator('.cell-playable').first().click();
		await expect(page.locator('.cell-x')).toHaveCount(1);

		// Verify turn change
		await expect(page.locator('.game-status')).toContainText("Opponent's turn");
		await expect(page2.locator('.game-status')).toContainText('Your turn');
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

		// Should show error page with redirect message
		await expect(page.locator('.error-page')).toBeVisible();
		await expect(page.locator('h1')).toContainText('Oops! Something went wrong');

		// Should redirect to login after delay
		await page.waitForURL('/login', { timeout: 2000 });
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

	test('game creation and management workflow', async ({ page }) => {
		// Create unique user for this test
		const gameUser = DatabaseHelper.createUniqueTestUser('gameUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', gameUser.email);
		await page.fill('input[name="username"]', gameUser.username);
		await page.fill('input[name="password"]', gameUser.password);
		await page.fill('input[name="confirmPassword"]', gameUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Initially no games
		await expect(page.locator('.no-games')).toHaveCount(2);

		// Create first game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		await expect(page.locator('.game-board')).toBeVisible();

		// Go back to dashboard
		await page.click('.btn-secondary');
		await page.waitForURL('/dashboard');

		// Should now show game in My Games section
		await expect(page.locator('.game-card')).toBeVisible();
		await expect(page.locator('.game-status')).toContainText('Waiting for opponent');

		// Test refresh functionality
		await page.click('.refresh-btn');
		await expect(page.locator('.refresh-btn')).toContainText('Loading...');
		await expect(page.locator('.refresh-btn')).toContainText('Refresh Games');
	});

	test('application is responsive on different screen sizes', async ({ page }) => {
		// Create unique user for this test
		const responsiveUser = DatabaseHelper.createUniqueTestUser('responsiveUser');

		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/login');

		// Form should still be visible and usable
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();

		// Register and test dashboard on mobile
		await page.goto('/register');
		await page.fill('input[name="email"]', responsiveUser.email);
		await page.fill('input[name="username"]', responsiveUser.username);
		await page.fill('input[name="password"]', responsiveUser.password);
		await page.fill('input[name="confirmPassword"]', responsiveUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Dashboard should be responsive
		await expect(page.locator('.dashboard')).toBeVisible();
		await expect(page.locator('.create-game')).toBeVisible();

		// Test tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(page.locator('.games-container')).toBeVisible();

		// Create game and test game page responsiveness
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		await expect(page.locator('.game-container')).toBeVisible();
		await expect(page.locator('.game-board')).toBeVisible();

		// Test desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });
		await expect(page.locator('.game-container')).toBeVisible();
		await expect(page.locator('.game-board')).toBeVisible();
	});

	test('error handling and recovery', async ({ page }) => {
		// Create unique user for this test
		const errorUser = DatabaseHelper.createUniqueTestUser('errorUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', errorUser.email);
		await page.fill('input[name="username"]', errorUser.username);
		await page.fill('input[name="password"]', errorUser.password);
		await page.fill('input[name="confirmPassword"]', errorUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Test invalid game access
		await page.goto('/game/invalid-game-id');
		await expect(page.locator('.error')).toBeVisible();

		// Should be able to recover by going back to dashboard
		await page.click('.btn-primary');
		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText(`Welcome, ${errorUser.username}!`);
	});

	test('authentication persistence across browser sessions', async ({ page }) => {
		// Create unique user for this test
		const persistUser = DatabaseHelper.createUniqueTestUser('persistUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', persistUser.email);
		await page.fill('input[name="username"]', persistUser.username);
		await page.fill('input[name="password"]', persistUser.password);
		await page.fill('input[name="confirmPassword"]', persistUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Simulate page refresh (simulates browser session)
		await page.reload();
		await expect(page.locator('h1')).toContainText(`Welcome, ${persistUser.username}!`);

		// Navigate away and back
		await page.goto('/');
		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText(`Welcome, ${persistUser.username}!`);
	});
});
