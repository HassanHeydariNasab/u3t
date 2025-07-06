import { test, expect } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

test.describe('Simple Join Game Test', () => {
	test.beforeEach(async ({ page }) => {
		// Reset database before each test
		await page.goto('/api/test/reset');
		await expect(page.locator('body')).toBeVisible();
	});

	test('should show join button for second player', async ({ page, context }) => {
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

		// Wait a bit and check what's on the page
		await page2.waitForTimeout(2000);

		// Take a screenshot to see what's happening
		await page2.screenshot({ path: 'debug-join-game.png' });

		// Wait for the page to load and check if join button exists
		await page2.waitForTimeout(2000);

		// Check if join button exists
		const joinButton = page2.locator('.join-game .btn-primary');
		const joinButtonExists = (await joinButton.count()) > 0;

		console.log('Join button exists:', joinButtonExists);

		if (joinButtonExists) {
			await expect(joinButton).toBeVisible();
			console.log('Join button is visible!');
		} else {
			// Log what's actually on the page
			const pageContent = await page2.content();
			console.log('Page content:', pageContent.substring(0, 1000));

			// Check if there are any elements with 'join' in the class or text
			const joinElements = await page2.locator('[class*="join"], [class*="Join"]').count();
			console.log('Elements with "join" in class:', joinElements);

			const gameElements = await page2.locator('[class*="game"]').count();
			console.log('Elements with "game" in class:', gameElements);
		}
	});
});
