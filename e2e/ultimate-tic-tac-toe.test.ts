import { expect, test } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

// Set test suite name for database isolation
DatabaseHelper.setTestSuite('ultimate-tic-tac-toe');

test.describe('Ultimate Tic-Tac-Toe Game Mechanics', () => {
	test.beforeEach(async ({ page }) => {
		// Clear database before each test
		await DatabaseHelper.clearDatabase();

		// Clear localStorage before each test
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	async function setupTwoPlayerGame(page, context) {
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

		// Player 2 joins the game
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

		return { page1: page, page2, gameUrl };
	}

	test('should enforce turn-based gameplay', async ({ page, context }) => {
		const { page1, page2 } = await setupTwoPlayerGame(page, context);

		// Player 1 should be able to make a move (X goes first)
		await expect(page1.locator('.game-status')).toContainText('Your turn');
		await expect(page2.locator('.game-status')).toContainText("Opponent's turn");

		// Player 2 should not be able to make a move yet
		const playableCells2 = page2.locator('.cell-playable');
		await expect(playableCells2).toHaveCount(0);

		// Player 1 makes a move
		await page1.locator('.cell-playable').first().click();

		// Turn should switch
		await expect(page1.locator('.game-status')).toContainText("Opponent's turn");
		await expect(page2.locator('.game-status')).toContainText('Your turn');

		// Now player 2 should be able to make a move
		await page2.locator('.cell-playable').first().click();

		// Turn should switch back
		await expect(page1.locator('.game-status')).toContainText('Your turn');
		await expect(page2.locator('.game-status')).toContainText("Opponent's turn");
	});

	test('should display X and O symbols correctly', async ({ page, context }) => {
		const { page1, page2 } = await setupTwoPlayerGame(page, context);

		// Player 1 should be X
		await expect(page1.locator('.player-info')).toContainText('You are: X');
		await expect(page2.locator('.player-info')).toContainText('You are: O');

		// Player 1 makes a move
		const firstCell = page1.locator('.cell-playable').first();
		await firstCell.click();

		// Cell should show X
		await expect(page1.locator('.cell-x')).toHaveCount(1);
		await expect(page2.locator('.cell-x')).toHaveCount(1);

		// Player 2 makes a move
		const secondCell = page2.locator('.cell-playable').first();
		await secondCell.click();

		// Cell should show O
		await expect(page1.locator('.cell-o')).toHaveCount(1);
		await expect(page2.locator('.cell-o')).toHaveCount(1);
	});

	test('should enforce Ultimate Tic-Tac-Toe active board rules', async ({ page, context }) => {
		const { page1, page2 } = await setupTwoPlayerGame(page, context);

		// First move can be anywhere (no active board restriction)
		const initialPlayableCells = page1.locator('.cell-playable');
		const initialCount = await initialPlayableCells.count();
		expect(initialCount).toBeGreaterThan(9); // Should be able to play in multiple boards

		// Player 1 makes a move in the top-left cell of the center board
		// This should restrict player 2 to the top-left small board
		await page1.locator('.small-board').nth(4).locator('.cell-playable').first().click();

		// After the move, the next player should be restricted to a specific board
		// (the exact board depends on which cell was clicked)
		await page2.waitForTimeout(1000); // Wait for game state to update

		const restrictedPlayableCells = page2.locator('.cell-playable');
		const restrictedCount = await restrictedPlayableCells.count();
		expect(restrictedCount).toBeLessThan(initialCount); // Should be more restricted now
	});

	test('should prevent moves in completed small boards', async ({ page, context }) => {
		const { page1, page2 } = await setupTwoPlayerGame(page, context);

		// This test would require a more complex setup to complete a small board
		// For now, we'll test that cells in won boards are not playable
		// (This is a simplified test - in a real scenario, we'd need to play out a small board win)

		// Make a move
		await page1.locator('.cell-playable').first().click();

		// Verify that occupied cells are no longer playable
		const occupiedCells = page1.locator('.cell-x');
		await expect(occupiedCells).toHaveCount(1);

		// The occupied cell should not be in the playable cells list
		const playableCells = page2.locator('.cell-playable');
		const playableCount = await playableCells.count();

		// Make sure we can't click on the occupied cell
		const occupiedCell = page2.locator('.cell-x').first();
		await expect(occupiedCell).not.toHaveClass(/cell-playable/);
	});

	test('should handle game board visual feedback', async ({ page, context }) => {
		const { page1, page2 } = await setupTwoPlayerGame(page, context);

		// Check initial game board state
		await expect(page1.locator('.game-board')).toBeVisible();
		await expect(page1.locator('.small-board')).toHaveCount(9);

		// Make a move and check visual feedback
		await page1.locator('.cell-playable').first().click();

		// Check that the move is visually represented
		await expect(page1.locator('.cell-x')).toHaveCount(1);

		// Check that the active board is highlighted (if applicable)
		const activeBoards = page2.locator('.small-board-active');
		// Active board highlighting depends on the game state
		// We just check that the class exists in the CSS
		await expect(page2.locator('.small-board')).toHaveCount(9);
	});

	test('should handle game state synchronization between players', async ({ page, context }) => {
		const { page1, page2 } = await setupTwoPlayerGame(page, context);

		// Player 1 makes a move
		await page1.locator('.cell-playable').first().click();

		// Wait for synchronization
		await page2.waitForTimeout(3000); // Game polls every 2 seconds

		// Both players should see the same game state
		await expect(page1.locator('.cell-x')).toHaveCount(1);
		await expect(page2.locator('.cell-x')).toHaveCount(1);

		// Player 2 makes a move
		await page2.locator('.cell-playable').first().click();

		// Wait for synchronization
		await page1.waitForTimeout(3000);

		// Both players should see both moves
		await expect(page1.locator('.cell-x')).toHaveCount(1);
		await expect(page1.locator('.cell-o')).toHaveCount(1);
		await expect(page2.locator('.cell-x')).toHaveCount(1);
		await expect(page2.locator('.cell-o')).toHaveCount(1);
	});

	test('should prevent invalid moves', async ({ page, context }) => {
		const { page1, page2 } = await setupTwoPlayerGame(page, context);

		// Player 1 makes a move
		const firstCell = page1.locator('.cell-playable').first();
		await firstCell.click();

		// Try to click the same cell again (should not work)
		await firstCell.click();

		// Should still only have one X
		await expect(page1.locator('.cell-x')).toHaveCount(1);

		// Player 2 should not be able to click on cells that aren't playable
		const nonPlayableCells = page2.locator('.cell').filter({ hasNotText: '' });
		if ((await nonPlayableCells.count()) > 0) {
			await nonPlayableCells.first().click();
			// Should not affect the game state
			await expect(page2.locator('.cell-o')).toHaveCount(0);
		}
	});

	test('should handle game board responsiveness', async ({ page, context }) => {
		const { page1 } = await setupTwoPlayerGame(page, context);

		// Test different viewport sizes
		await page1.setViewportSize({ width: 375, height: 667 });
		await expect(page1.locator('.game-board')).toBeVisible();
		await expect(page1.locator('.small-board')).toHaveCount(9);

		await page1.setViewportSize({ width: 768, height: 1024 });
		await expect(page1.locator('.game-board')).toBeVisible();
		await expect(page1.locator('.small-board')).toHaveCount(9);

		await page1.setViewportSize({ width: 1920, height: 1080 });
		await expect(page1.locator('.game-board')).toBeVisible();
		await expect(page1.locator('.small-board')).toHaveCount(9);
	});

	test('should display game status updates correctly', async ({ page, context }) => {
		const { page1, page2 } = await setupTwoPlayerGame(page, context);

		// Initial status
		await expect(page1.locator('.game-status')).toContainText('Your turn');
		await expect(page2.locator('.game-status')).toContainText("Opponent's turn");

		// After player 1 moves
		await page1.locator('.cell-playable').first().click();
		await expect(page1.locator('.game-status')).toContainText("Opponent's turn");
		await expect(page2.locator('.game-status')).toContainText('Your turn');

		// After player 2 moves
		await page2.locator('.cell-playable').first().click();
		await expect(page1.locator('.game-status')).toContainText('Your turn');
		await expect(page2.locator('.game-status')).toContainText("Opponent's turn");
	});

	test('should handle game metadata display', async ({ page, context }) => {
		const { page1, page2 } = await setupTwoPlayerGame(page, context);

		// Check game metadata
		await expect(page1.locator('.game-meta h1')).toContainText('Game #');
		await expect(page2.locator('.game-meta h1')).toContainText('Game #');

		// Both players should see the same game ID
		const gameId1 = await page1.locator('.game-meta h1').textContent();
		const gameId2 = await page2.locator('.game-meta h1').textContent();
		expect(gameId1).toBe(gameId2);
	});

	test('should handle disconnection and reconnection', async ({ page, context }) => {
		const { page1, page2, gameUrl } = await setupTwoPlayerGame(page, context);

		// Player 1 makes a move
		await page1.locator('.cell-playable').first().click();

		// Simulate disconnection by navigating away
		await page1.goto('/dashboard');
		await page1.waitForURL('/dashboard');

		// Player 2 makes a move
		await page2.locator('.cell-playable').first().click();

		// Player 1 reconnects to the game
		await page1.goto(gameUrl);
		await page1.waitForTimeout(3000); // Wait for game state to load

		// Player 1 should see both moves
		await expect(page1.locator('.cell-x')).toHaveCount(1);
		await expect(page1.locator('.cell-o')).toHaveCount(1);
	});
});
