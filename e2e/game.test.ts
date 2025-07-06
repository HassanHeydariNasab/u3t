import { expect, test } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

// Set test suite name for database isolation
DatabaseHelper.setTestSuite('game');

test.describe('Game Page Functionality', () => {
	test.beforeEach(async ({ page }) => {
		// Clear database before each test
		await DatabaseHelper.clearDatabase();

		// Clear localStorage before each test
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('should redirect to login when not authenticated', async ({ page }) => {
		// Try to access a game page directly
		await page.goto('/game/test-game-id');
		await page.waitForURL('/login');
		await expect(page.locator('h2')).toContainText('Login');
	});

	test('should show game not found for invalid game ID', async ({ page }) => {
		// Create unique user for this test
		const gameUser = DatabaseHelper.createUniqueTestUser('gameUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', gameUser.email);
		await page.fill('input[name="username"]', gameUser.username);
		await page.fill('input[name="password"]', gameUser.password);
		await page.fill('input[name="confirmPassword"]', gameUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Try to access invalid game
		await page.goto('/game/invalid-game-id');

		// Should show error or redirect back to dashboard
		await expect(page.locator('.error')).toBeVisible();
	});

	test('should create and display a new game', async ({ page }) => {
		// Create unique user for this test
		const gameUser = DatabaseHelper.createUniqueTestUser('gameUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', gameUser.email);
		await page.fill('input[name="username"]', gameUser.username);
		await page.fill('input[name="password"]', gameUser.password);
		await page.fill('input[name="confirmPassword"]', gameUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a new game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Check game page elements
		await expect(page.locator('h2')).toContainText('Ultimate Tic-Tac-Toe');
		await expect(page.locator('.game-info')).toBeVisible();
		await expect(page.locator('.player-info')).toContainText('You are: X');
		await expect(page.locator('.game-status')).toContainText('Waiting for opponent');

		// Check game board
		await expect(page.locator('.game-board')).toBeVisible();
		await expect(page.locator('.small-board')).toHaveCount(9);
	});

	test('should allow second player to join a game', async ({ page, context }) => {
		// Create two users
		const player1 = DatabaseHelper.createUniqueTestUser('player1');
		const player2 = DatabaseHelper.createUniqueTestUser('player2');

		// Player 1 creates a game
		await page.goto('/register');
		await page.fill('input[name="email"]', player1.email);
		await page.fill('input[name="username"]', player1.username);
		await page.fill('input[name="password"]', player1.password);
		await page.fill('input[name="confirmPassword"]', player1.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Get the game URL
		const gameUrl = page.url();

		// Player 2 joins the game in a new tab
		const page2 = await context.newPage();
		await page2.goto('/register');
		await page2.fill('input[name="email"]', player2.email);
		await page2.fill('input[name="username"]', player2.username);
		await page2.fill('input[name="password"]', player2.password);
		await page2.fill('input[name="confirmPassword"]', player2.password);
		await page2.click('button[type="submit"]');
		await page2.waitForURL('/dashboard');

		// Navigate to the game
		await page2.goto(gameUrl);

		// Should see join game option
		await expect(page2.locator('.join-game')).toBeVisible();
		await expect(page2.locator('.join-game h2')).toContainText('Join this game?');

		// Join the game
		await page2.click('.join-game button');

		// Should now show game board
		await expect(page2.locator('.game-board')).toBeVisible();
		await expect(page2.locator('.player-info')).toContainText('You are: O');
	});

	test('should display correct game status for both players', async ({ page, context }) => {
		// Create two users
		const player1 = DatabaseHelper.createUniqueTestUser('player1');
		const player2 = DatabaseHelper.createUniqueTestUser('player2');

		// Player 1 creates a game
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

		// Player 2 joins
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

		// Check game status for both players
		await expect(page.locator('.game-status')).toContainText('Your turn');
		await expect(page2.locator('.game-status')).toContainText("Opponent's turn");
	});

	test('should allow making moves in the game', async ({ page, context }) => {
		// Create two users
		const player1 = DatabaseHelper.createUniqueTestUser('player1');
		const player2 = DatabaseHelper.createUniqueTestUser('player2');

		// Player 1 creates a game
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

		// Player 2 joins
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

		// Player 1 makes first move
		const firstCell = page.locator('.cell-playable').first();
		await firstCell.click();

		// Cell should now show X
		await expect(firstCell).toContainText('X');

		// Game status should change
		await expect(page.locator('.game-status')).toContainText("Opponent's turn");
		await expect(page2.locator('.game-status')).toContainText('Your turn');
	});

	test('should handle back to dashboard navigation', async ({ page }) => {
		// Create unique user for this test
		const gameUser = DatabaseHelper.createUniqueTestUser('gameUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', gameUser.email);
		await page.fill('input[name="username"]', gameUser.username);
		await page.fill('input[name="password"]', gameUser.password);
		await page.fill('input[name="confirmPassword"]', gameUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a new game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Click back to dashboard
		await page.click('.btn-secondary');
		await page.waitForURL('/dashboard');

		// Should be back on dashboard
		await expect(page.locator('h1')).toContainText(`Welcome, ${gameUser.username}!`);
	});

	test('should show game board correctly', async ({ page }) => {
		// Create unique user for this test
		const gameUser = DatabaseHelper.createUniqueTestUser('gameUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', gameUser.email);
		await page.fill('input[name="username"]', gameUser.username);
		await page.fill('input[name="password"]', gameUser.password);
		await page.fill('input[name="confirmPassword"]', gameUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a new game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Check game board structure
		await expect(page.locator('.game-board')).toBeVisible();
		await expect(page.locator('.small-board')).toHaveCount(9);

		// Each small board should have 9 cells when no opponent is present
		// (cells are not clickable when waiting for opponent)
		await expect(page.locator('.small-board').first()).toBeVisible();
	});

	test('should be responsive on different screen sizes', async ({ page }) => {
		// Create unique user for this test
		const gameUser = DatabaseHelper.createUniqueTestUser('gameUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', gameUser.email);
		await page.fill('input[name="username"]', gameUser.username);
		await page.fill('input[name="password"]', gameUser.password);
		await page.fill('input[name="confirmPassword"]', gameUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a new game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await expect(page.locator('.game-container')).toBeVisible();
		await expect(page.locator('.game-board')).toBeVisible();

		// Test tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(page.locator('.game-container')).toBeVisible();
		await expect(page.locator('.game-board')).toBeVisible();

		// Test desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });
		await expect(page.locator('.game-container')).toBeVisible();
		await expect(page.locator('.game-board')).toBeVisible();
	});

	test('should handle game loading states', async ({ page }) => {
		// Create unique user for this test
		const gameUser = DatabaseHelper.createUniqueTestUser('gameUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', gameUser.email);
		await page.fill('input[name="username"]', gameUser.username);
		await page.fill('input[name="password"]', gameUser.password);
		await page.fill('input[name="confirmPassword"]', gameUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a new game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Game should load without showing loading state for too long
		await expect(page.locator('.game-container')).toBeVisible();

		// Should not show loading state after initial load
		await expect(page.locator('.loading')).not.toBeVisible();
	});

	test('should display game metadata correctly', async ({ page }) => {
		// Create unique user for this test
		const gameUser = DatabaseHelper.createUniqueTestUser('gameUser');

		// Register user
		await page.goto('/register');
		await page.fill('input[name="email"]', gameUser.email);
		await page.fill('input[name="username"]', gameUser.username);
		await page.fill('input[name="password"]', gameUser.password);
		await page.fill('input[name="confirmPassword"]', gameUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a new game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Check game metadata
		await expect(page.locator('.game-meta h1')).toContainText('Game #');
		await expect(page.locator('.game-meta p')).toContainText('Opponent: Waiting...');
	});
});
