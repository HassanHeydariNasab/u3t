import { test, expect } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

test.describe('Simple Button Test', () => {
	test.beforeEach(async ({ page }) => {
		// Reset database before each test
		await page.goto('/api/test/reset');
		await expect(page.locator('body')).toBeVisible();
	});

	test('should test button click functionality', async ({ page, context }) => {
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

		// Now try to access the game
		await page2.goto(gameUrl);

		// Wait for the page to load
		await page2.waitForTimeout(2000);

		// Check if join button exists
		const joinButton = page2.locator('.join-game .btn-primary');
		await expect(joinButton).toBeVisible();

		// Add a simple click handler to test if clicks work
		await page2.evaluate(() => {
			const button = document.querySelector('.join-game .btn-primary');
			if (button) {
				button.addEventListener('click', () => {
					console.log('Button clicked via addEventListener!');
					// Add a data attribute to mark that the click was registered
					button.setAttribute('data-clicked', 'true');
				});
			}
		});

		// Click the button
		await joinButton.click();

		// Wait a bit
		await page2.waitForTimeout(1000);

		// Check if the click was registered
		const clicked = await page2.evaluate(() => {
			const button = document.querySelector('.join-game .btn-primary');
			return button?.getAttribute('data-clicked') === 'true';
		});

		console.log('Button click registered via addEventListener:', clicked);

		// Check if the game status changed (this should happen regardless of frontend issues)
		await page2.waitForTimeout(2000);

		// Check if GameBoard is now rendered
		const gameBoardExists = (await page2.locator('.game-status').count()) > 0;
		console.log('GameBoard exists after join:', gameBoardExists);

		// Take a screenshot
		await page2.screenshot({ path: 'simple-button-test.png' });
	});
});
