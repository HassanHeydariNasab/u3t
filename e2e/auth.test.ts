import { expect, test } from '@playwright/test';
import { DatabaseHelper } from './test-helpers/database-helper';

// Set test suite name for database isolation
DatabaseHelper.setTestSuite('auth');

test.describe('Authentication Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Clear database before each test
		await DatabaseHelper.clearDatabase();

		// Clear localStorage before each test
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());

		// Add console logging to debug form submissions
		page.on('console', (msg) => {
			console.log('Browser console:', msg.text());
		});
	});

	test('should redirect to login when not authenticated', async ({ page }) => {
		await page.goto('/dashboard');
		await page.waitForURL('/login');
		await expect(page).toHaveURL('/login');
	});

	test('should show registration form', async ({ page }) => {
		await page.goto('/register');

		// Check registration form elements
		await expect(page.locator('h2')).toContainText('Register');
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="username"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('should validate registration form', async ({ page }) => {
		// Create unique user for this test
		const testUser = DatabaseHelper.createUniqueTestUser('e2eTestUser');

		await page.goto('/register');

		// Try to submit empty form
		await page.click('button[type="submit"]');

		// Wait a bit for the error to appear
		await page.waitForTimeout(1000);
		await expect(page.locator('.error')).toContainText('Please fill in all fields');

		// Fill form with mismatched passwords
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="username"]', testUser.username);
		await page.fill('input[name="password"]', 'password1');
		await page.fill('input[name="confirmPassword"]', 'password2');

		await page.click('button[type="submit"]');

		await page.waitForTimeout(1000);
		await expect(page.locator('.error')).toContainText('Passwords do not match');
	});

	test('should register new user successfully', async ({ page }) => {
		// Create unique user for this test
		const testUser = DatabaseHelper.createUniqueTestUser('e2eTestUser');

		await page.goto('/register');

		// Fill form with valid data
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="username"]', testUser.username);
		await page.fill('input[name="password"]', testUser.password);
		await page.fill('input[name="confirmPassword"]', testUser.password);

		// Submit the form
		await page.click('button[type="submit"]');

		// Should redirect to dashboard
		await page.waitForURL('/dashboard');

		// Check dashboard elements
		await expect(page.locator('h1')).toContainText(`Welcome, ${testUser.username}!`);
	});

	test('should prevent duplicate user registration', async ({ page }) => {
		// Create unique user for this test
		const testUser = DatabaseHelper.createUniqueTestUser('e2eTestUser');

		// First registration
		await page.goto('/register');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="username"]', testUser.username);
		await page.fill('input[name="password"]', testUser.password);
		await page.fill('input[name="confirmPassword"]', testUser.password);

		await page.click('button[type="submit"]');

		// Wait for successful registration
		await page.waitForURL('/dashboard');

		// Logout
		await page.click('.logout-btn');
		await page.waitForURL('/login');

		// Try to register again with the same email
		await page.goto('/register');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="username"]', 'differentusername');
		await page.fill('input[name="password"]', testUser.password);
		await page.fill('input[name="confirmPassword"]', testUser.password);

		await page.click('button[type="submit"]');

		// Should show error
		await expect(page.locator('.error')).toContainText('User with this email already exists');
	});

	test('should validate login form', async ({ page }) => {
		await page.goto('/login');

		// Try to submit empty form
		await page.click('button[type="submit"]');

		await page.waitForTimeout(1000);
		await expect(page.locator('.error')).toContainText('Please fill in all fields');

		// Try with invalid credentials
		await page.fill('input[name="email"]', 'invalid@example.com');
		await page.fill('input[name="password"]', 'wrongpassword');

		await page.click('button[type="submit"]');

		// Wait a bit for the error to appear and increase timeout
		await page.waitForTimeout(2000);
		await expect(page.locator('.error')).toContainText('Invalid credentials', { timeout: 10000 });
	});

	test('should login with valid credentials', async ({ page }) => {
		// Create unique user for this test
		const existingUser = DatabaseHelper.createUniqueTestUser('existingUser');

		// First register a user
		await page.goto('/register');
		await page.fill('input[name="email"]', existingUser.email);
		await page.fill('input[name="username"]', existingUser.username);
		await page.fill('input[name="password"]', existingUser.password);
		await page.fill('input[name="confirmPassword"]', existingUser.password);

		await page.click('button[type="submit"]');

		await page.waitForURL('/dashboard');

		// Logout
		await page.click('.logout-btn');
		await page.waitForURL('/login');

		// Now login with the same credentials
		await page.fill('input[name="email"]', existingUser.email);
		await page.fill('input[name="password"]', existingUser.password);

		await page.click('button[type="submit"]');

		await page.waitForURL('/dashboard');
		await expect(page.locator('h1')).toContainText(`Welcome, ${existingUser.username}!`);
	});

	test('should logout successfully', async ({ page }) => {
		// Create unique user for this test
		const testUser = DatabaseHelper.createUniqueTestUser('e2eTestUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="username"]', testUser.username);
		await page.fill('input[name="password"]', testUser.password);
		await page.fill('input[name="confirmPassword"]', testUser.password);

		await page.click('button[type="submit"]');

		await page.waitForURL('/dashboard');

		// Logout
		await page.click('.logout-btn');
		await page.waitForURL('/login');

		// Try to access dashboard - should redirect to login
		await page.goto('/dashboard');
		await page.waitForURL('/login');
	});

	test('should persist authentication on page refresh', async ({ page }) => {
		// Create unique user for this test
		const testUser = DatabaseHelper.createUniqueTestUser('e2eTestUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="username"]', testUser.username);
		await page.fill('input[name="password"]', testUser.password);
		await page.fill('input[name="confirmPassword"]', testUser.password);

		await page.click('button[type="submit"]');

		await page.waitForURL('/dashboard');

		// Refresh page
		await page.reload();

		// Should still be on dashboard
		await expect(page).toHaveURL('/dashboard');
		await expect(page.locator('h1')).toContainText(`Welcome, ${testUser.username}!`);
	});

	test('should handle navigation between login and register', async ({ page }) => {
		await page.goto('/login');
		await expect(page).toHaveURL('/login');

		await page.click('a[href="/register"]');
		await expect(page).toHaveURL('/register');

		await page.click('a[href="/login"]');
		await expect(page).toHaveURL('/login');
	});

	test('should redirect authenticated users away from auth pages', async ({ page }) => {
		// Create unique user for this test
		const testUser = DatabaseHelper.createUniqueTestUser('e2eTestUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="username"]', testUser.username);
		await page.fill('input[name="password"]', testUser.password);
		await page.fill('input[name="confirmPassword"]', testUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Try to access login page while authenticated
		await page.goto('/login');
		await page.waitForURL('/dashboard');

		// Try to access register page while authenticated
		await page.goto('/register');
		await page.waitForURL('/dashboard');
	});

	test('should maintain authentication state across game navigation', async ({ page }) => {
		// Create unique user for this test
		const testUser = DatabaseHelper.createUniqueTestUser('e2eTestUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="username"]', testUser.username);
		await page.fill('input[name="password"]', testUser.password);
		await page.fill('input[name="confirmPassword"]', testUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Navigate back to dashboard
		await page.click('.btn-secondary');
		await page.waitForURL('/dashboard');

		// Should still be authenticated
		await expect(page.locator('h1')).toContainText(`Welcome, ${testUser.username}!`);
	});

	test('should handle logout from game page', async ({ page }) => {
		// Create unique user for this test
		const testUser = DatabaseHelper.createUniqueTestUser('e2eTestUser');

		// Register and login
		await page.goto('/register');
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="username"]', testUser.username);
		await page.fill('input[name="password"]', testUser.password);
		await page.fill('input[name="confirmPassword"]', testUser.password);
		await page.click('button[type="submit"]');
		await page.waitForURL('/dashboard');

		// Create a game
		await page.click('.create-game');
		await page.waitForURL(/\/game\/[a-f0-9-]+/);

		// Go back to dashboard and logout
		await page.click('.btn-secondary');
		await page.waitForURL('/dashboard');
		await page.click('.logout-btn');
		await page.waitForURL('/login');

		// Try to access the game page after logout
		await page.goto('/game/some-game-id');
		await page.waitForURL('/login');
	});

	test('should display proper error messages for authentication failures', async ({ page }) => {
		await page.goto('/login');

		// Test with non-existent user
		await page.fill('input[name="email"]', 'nonexistent@example.com');
		await page.fill('input[name="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');

		await page.waitForTimeout(2000);
		await expect(page.locator('.error')).toContainText('Invalid credentials');

		// Error should be visible and styled
		const errorElement = page.locator('.error');
		await expect(errorElement).toBeVisible();
		await expect(errorElement).toHaveCSS('color', /rgb\(.*\)/); // Should have some color styling
	});
});
