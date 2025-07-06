import { test, expect } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

test.describe('Debug Join Game Test', () => {
	test.beforeEach(async ({ page }) => {
		// Reset database before each test
		await page.goto('/api/test/reset');
		await expect(page.locator('body')).toBeVisible();
	});

	test('should debug join game functionality', async ({ page, context }) => {
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

		// Create a new game
		await page.click('button:has-text("Create New Game")');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);
		const gameUrl = page.url();
		console.log('Game URL:', gameUrl);

		// Player 2 tries to access the game
		const page2 = await context.newPage();

		// Register player 2
		await page2.goto('/register');
		await page2.fill('input[name="email"]', player2.email);
		await page2.fill('input[name="username"]', player2.username);
		await page2.fill('input[name="password"]', player2.password);
		await page2.fill('input[name="confirmPassword"]', player2.password);
		await page2.click('button[type="submit"]');
		await page2.waitForURL('/dashboard');

		// Verify player 2 is authenticated
		await expect(page2.locator('h1')).toContainText(`Welcome, ${player2.username}!`);

		// Check if token is stored in localStorage
		const token = await page2.evaluate(() => localStorage.getItem('access_token'));
		console.log('Player 2 token exists:', !!token);

		// Now try to access the game
		await page2.goto(gameUrl);

		// Wait for the page to load
		await page2.waitForTimeout(3000);

		// Check what's on the page
		const pageContent = await page2.content();
		console.log('Page content length:', pageContent.length);

		// Check if there are any elements with 'join' in the class or text
		const joinElements = await page2.locator('[class*="join"], [class*="Join"]').count();
		console.log('Elements with "join" in class:', joinElements);

		const gameElements = await page2.locator('[class*="game"]').count();
		console.log('Elements with "game" in class:', gameElements);

		// Check if there are any buttons
		const buttons = await page2.locator('button').count();
		console.log('Total buttons on page:', buttons);

		// Check if there are any divs
		const divs = await page2.locator('div').count();
		console.log('Total divs on page:', divs);

		// Take a screenshot
		await page2.screenshot({ path: 'debug-join-game-final.png' });

		// Check if join button exists
		const joinButton = page2.locator('.join-game .btn-primary');
		const joinButtonExists = (await joinButton.count()) > 0;
		console.log('Join button exists:', joinButtonExists);

		if (joinButtonExists) {
			await expect(joinButton).toBeVisible();
			console.log('Join button is visible!');

			// Click the join button
			await joinButton.click();
			console.log('Clicked join button');

			// Wait for the game to update
			await page2.waitForTimeout(3000);

			// Check if GameBoard is now rendered
			const gameBoardExists = (await page2.locator('.game-status').count()) > 0;
			console.log('GameBoard exists after join:', gameBoardExists);

			if (gameBoardExists) {
				console.log('Success! GameBoard is rendered after join');
			} else {
				console.log('GameBoard still not rendered after join');
			}
		} else {
			console.log('Join button not found');
		}
	});
});
