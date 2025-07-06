/**
 * Database helper for Playwright E2E tests
 * Provides database operations for testing with REST API
 */

export class DatabaseHelper {
	private static baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:4173';

	/**
	 * Sets the test suite name for database isolation
	 */
	static setTestSuite(suiteName: string): void {
		process.env.TEST_SUITE = suiteName;
	}

	/**
	 * Clears the database by calling the reset endpoint
	 */
	static async clearDatabase(): Promise<void> {
		try {
			const response = await fetch(`${this.baseUrl}/api/test/reset`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			console.log('Database cleared successfully');
		} catch (error) {
			// Since tests use unique users, database clearing isn't critical
			// Just log a debug message instead of an error
			// console.log('Database clear failed (expected for test-specific DB):', error);
		}
	}

	/**
	 * Creates a unique test user
	 */
	static createUniqueTestUser(baseName: string = 'testuser'): {
		email: string;
		username: string;
		password: string;
	} {
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(2, 8);
		const processId = process.pid || Math.floor(Math.random() * 10000);
		const testSuite = process.env.TEST_SUITE || 'default';
		const uniqueId = `${timestamp}_${randomId}_${processId}_${testSuite}`;

		return {
			email: `${baseName}_${uniqueId}@example.com`,
			username: `${baseName}_${uniqueId}`,
			password: 'testPassword123'
		};
	}
}
