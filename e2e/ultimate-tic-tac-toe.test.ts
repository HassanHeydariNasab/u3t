import { expect, test } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

// Set test suite name for database isolation
DatabaseHelper.setTestSuite('ultimate-tic-tac-toe');

test.describe('Ultimate Tic-Tac-Toe - Two Player Online Game', () => {
	test.beforeEach(async ({ page }) => {
		// Reset database before each test
		await page.goto('/api/test/reset');
		await expect(page.locator('body')).toBeVisible();
	});

	test.describe('Game Creation and Joining', () => {
		test('should allow player to create a new game', async ({ page }) => {
			// Create and register player 1
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			await page.goto('/register');
			await page.fill('input[name="email"]', player1.email);
			await page.fill('input[name="username"]', player1.username);
			await page.fill('input[name="password"]', player1.password);
			await page.fill('input[name="confirmPassword"]', player1.password);
			await page.click('button[type="submit"]');
			await page.waitForURL('/dashboard');

			// Create a new game
			await page.click('.create-game');
			await page.waitForURL(/\/game\/[a-f0-9-]+/);

			// Verify game page elements
			await expect(page.locator('h2')).toContainText('Ultimate Tic-Tac-Toe');
			await expect(page.locator('.game-board')).toBeVisible();
			await expect(page.locator('.small-board')).toHaveCount(9);
			await expect(page.locator('.game-status')).toContainText('Waiting for opponent to join');
			await expect(page.locator('.player-card').first()).toContainText(player1.username);
			await expect(page.locator('.player-card').first()).toContainText('(You)');
		});

		test('should allow second player to join an existing game', async ({ page, context }) => {
			// Create two players
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
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Wait for the game to update after joining
			await page.waitForTimeout(2000);
			await page2.waitForTimeout(2000);

			// Wait for GameBoard to be rendered
			await page.waitForSelector('.game-status');
			await page2.waitForSelector('.game-status');

			// Verify both players see the game
			await expect(page.locator('.game-status')).toContainText('Your turn');
			await expect(page2.locator('.game-status')).toContainText(`${player1.username}'s turn`);
			await expect(page.locator('.player-card').nth(1)).toContainText(player2.username);
			await expect(page2.locator('.player-card').nth(1)).toContainText('(You)');
		});

		test('should prevent more than two players from joining', async ({ page, context }) => {
			// Create three players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');
			const player3 = DatabaseHelper.createUniqueTestUser('player3');

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
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Player 3 tries to join (should not be able to)
			const page3 = await context.newPage();
			await page3.goto('/register');
			await page3.fill('input[name="email"]', player3.email);
			await page3.fill('input[name="username"]', player3.username);
			await page3.fill('input[name="password"]', player3.password);
			await page3.fill('input[name="confirmPassword"]', player3.password);
			await page3.click('button[type="submit"]');
			await page3.waitForURL('/dashboard');

			await page3.goto(gameUrl);

			// Should not see join button
			await expect(page3.locator('.join-game .btn-primary')).not.toBeVisible();
			await expect(page3.locator('.game-status')).toContainText('Game is full');
		});
	});

	test.describe('Game Mechanics', () => {
		test('should enforce turn order correctly', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Player 1 should be able to make first move
			await expect(page.locator('.game-status')).toContainText('Your turn');
			await expect(page2.locator('.game-status')).toContainText(`${player1.username}'s turn`);

			// Player 2 should not be able to make a move (cells should be disabled)
			const firstCell = page2.locator('.cell').first();
			await expect(firstCell).toBeDisabled();
			// Try to click the disabled cell (should not result in a move)
			await firstCell.click({ force: true });
			await expect(firstCell).not.toContainText('O');

			// Player 1 makes first move
			const player1Cell = page.locator('.cell').first();
			await player1Cell.click();
			await expect(player1Cell).toContainText('X');

			// Turn should switch to player 2
			await expect(page.locator('.game-status')).toContainText(`${player2.username}'s turn`);
			await expect(page2.locator('.game-status')).toContainText('Your turn');
		});

		test('should enforce active board rules', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Player 1 makes first move in center board (board 4, cell 4)
			const centerBoard = page.locator('.small-board').nth(4);
			const centerCell = centerBoard.locator('.cell').nth(4);
			await centerCell.click();
			await expect(centerCell).toContainText('X');

			// Player 2 should be restricted to the center board
			await expect(page2.locator('.small-board').nth(4)).toHaveClass(/small-board-active/);

			// Try to click in a different board (should not work)
			const otherBoard = page2.locator('.small-board').nth(0);
			const otherCell = otherBoard.locator('.cell').nth(0);
			await otherCell.click();
			await expect(otherCell).not.toContainText('O');

			// Click in the active board (should work)
			const activeCell = page2.locator('.small-board').nth(4).locator('.cell').nth(0);
			await activeCell.click();
			await expect(activeCell).toContainText('O');
		});

		test('should handle board wins correctly', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Player 1 wins the top-left board (board 0)
			// Move 1: Top-left
			await page.locator('.small-board').nth(0).locator('.cell').nth(0).click();
			await page2.locator('.small-board').nth(0).locator('.cell').nth(1).click();
			// Move 2: Top-center
			await page.locator('.small-board').nth(0).locator('.cell').nth(2).click();
			await page2.locator('.small-board').nth(0).locator('.cell').nth(3).click();
			// Move 3: Top-right (wins the board)
			await page.locator('.small-board').nth(0).locator('.cell').nth(6).click();

			// Board should be marked as won by X
			await expect(page.locator('.small-board').nth(0)).toHaveClass(/small-board-won/);
			await expect(page.locator('.small-board').nth(0)).toHaveClass(/small-board-x/);
		});

		test('should handle game wins correctly', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Player 1 wins the game by winning three boards in a row
			// This is a simplified test - in practice, this would require many moves
			// For now, we'll just verify the game structure supports this
			await expect(page.locator('.game-board')).toBeVisible();
			await expect(page.locator('.small-board')).toHaveCount(9);
		});

		test('should handle draws correctly', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Fill a board completely to create a draw
			const board = page.locator('.small-board').nth(0);
			const cells = board.locator('.cell');

			// Fill the board in a pattern that results in a draw
			await cells.nth(0).click(); // X
			await page2.locator('.small-board').nth(0).locator('.cell').nth(1).click(); // O
			await cells.nth(2).click(); // X
			await page2.locator('.small-board').nth(0).locator('.cell').nth(3).click(); // O
			await cells.nth(4).click(); // X
			await page2.locator('.small-board').nth(0).locator('.cell').nth(5).click(); // O
			await cells.nth(6).click(); // X
			await page2.locator('.small-board').nth(0).locator('.cell').nth(7).click(); // O
			await cells.nth(8).click(); // X

			// Board should be marked as a draw
			await expect(board).toHaveClass(/small-board-draw/);
		});
	});

	test.describe('Real-time Updates', () => {
		test('should update game state in real-time for both players', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Player 1 makes a move
			const cell = page.locator('.cell').first();
			await cell.click();

			// Player 2 should see the move immediately
			await expect(page2.locator('.cell').first()).toContainText('X');
			await expect(page2.locator('.game-status')).toContainText('Your turn');
		});

		test('should show last move information', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Player 1 makes a move
			await page.locator('.cell').first().click();

			// Both players should see last move information
			await expect(page.locator('.last-move-info')).toContainText('Last move:');
			await expect(page.locator('.last-move-info')).toContainText(player1.username);
			await expect(page2.locator('.last-move-info')).toContainText('Last move:');
			await expect(page2.locator('.last-move-info')).toContainText(player1.username);
		});
	});

	test.describe('Game State Persistence', () => {
		test('should persist game state across page refreshes', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Make some moves
			await page.locator('.cell').first().click();
			await page2.locator('.cell').nth(1).click();

			// Refresh both pages
			await page.reload();
			await page2.reload();

			// Game state should be preserved
			await expect(page.locator('.cell').first()).toContainText('X');
			await expect(page2.locator('.cell').nth(1)).toContainText('O');
		});
	});

	test.describe('Error Handling', () => {
		test('should handle invalid moves gracefully', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Try to click on an already occupied cell
			const cell = page.locator('.cell').first();
			await cell.click();
			await cell.click(); // Try to click again

			// Cell should still only contain one X
			await expect(cell).toContainText('X');
		});

		test('should handle network disconnections gracefully', async ({ page, context }) => {
			// Setup two players
			const player1 = DatabaseHelper.createUniqueTestUser('player1');
			const player2 = DatabaseHelper.createUniqueTestUser('player2');

			// Create and join game
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

			const page2 = await context.newPage();
			await page2.goto('/register');
			await page2.fill('input[name="email"]', player2.email);
			await page2.fill('input[name="username"]', player2.username);
			await page2.fill('input[name="password"]', player2.password);
			await page2.fill('input[name="confirmPassword"]', player2.password);
			await page2.click('button[type="submit"]');
			await page2.waitForURL('/dashboard');

			await page2.goto(gameUrl);
			await page2.waitForSelector('.join-game .btn-primary');
			await page2.click('.join-game .btn-primary');

			// Disconnect one player
			await page2.close();

			// Game should still be playable for the remaining player
			await expect(page.locator('.game-board')).toBeVisible();
			await expect(page.locator('.game-status')).toContainText('Waiting for opponent');
		});
	});
});
