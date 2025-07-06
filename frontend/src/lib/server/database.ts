import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import path from 'path';
import fs from 'fs';

let db: Database.Database;

export function getDatabase(): Database.Database {
	if (!db) {
		const nodeEnv = env.NODE_ENV || 'development';
		const isTest = nodeEnv === 'test';

		let dbPath: string;

		if (isTest) {
			// Use test-specific database files instead of in-memory
			const testSuite = env.TEST_SUITE || 'default';
			const testDbName = `test_${testSuite}_${Date.now()}.sqlite`;
			dbPath = path.resolve('./test-dbs', testDbName);

			// Ensure test-dbs directory exists
			const testDbDir = path.dirname(dbPath);
			if (!fs.existsSync(testDbDir)) {
				fs.mkdirSync(testDbDir, { recursive: true });
			}
		} else {
			dbPath = env.DATABASE_PATH || 'database.sqlite';
			if (dbPath !== ':memory:') {
				dbPath = path.resolve(dbPath);
			}
		}

		db = new Database(dbPath);

		// Enable foreign keys
		db.pragma('foreign_keys = ON');

		// Initialize tables
		initializeTables();

		console.log(`Database initialized: ${dbPath} (env: ${nodeEnv})`);
	}

	return db;
}

export function resetDatabase(): void {
	if (db) {
		try {
			// Clear all data first
			db.exec('DELETE FROM users');
			console.log('Database tables cleared');
		} catch (error) {
			console.log("Error clearing tables (expected if tables don't exist):", error);
		}

		// For test databases, we can also recreate tables to ensure clean state
		const nodeEnv = env.NODE_ENV || 'development';
		if (nodeEnv === 'test') {
			try {
				db.exec('DROP TABLE IF EXISTS users');
				initializeTables();
				console.log('Database tables recreated');
			} catch (error) {
				console.log('Error recreating tables:', error);
			}
		}

		console.log('Database reset completed');
	} else {
		console.log('No database instance to reset');
	}
}

export function closeDatabase() {
	if (db) {
		const dbPath = db.name;
		db.close();
		db = null as any;

		// Clean up test database files
		const nodeEnv = env.NODE_ENV || 'development';
		if (nodeEnv === 'test' && dbPath && dbPath !== ':memory:' && fs.existsSync(dbPath)) {
			try {
				fs.unlinkSync(dbPath);
				console.log(`Cleaned up test database: ${dbPath}`);
			} catch (error) {
				console.log(`Failed to clean up test database: ${dbPath}`, error);
			}
		}
	}
}

// Clean up old test databases on startup
export function cleanupTestDatabases() {
	const testDbDir = path.resolve('./test-dbs');
	if (fs.existsSync(testDbDir)) {
		try {
			const files = fs.readdirSync(testDbDir);
			files.forEach((file) => {
				if (file.startsWith('test_') && file.endsWith('.sqlite')) {
					const filePath = path.join(testDbDir, file);
					try {
						fs.unlinkSync(filePath);
						console.log(`Cleaned up old test database: ${file}`);
					} catch (error) {
						console.log(`Failed to clean up old test database: ${file}`, error);
					}
				}
			});
		} catch (error) {
			console.log('Failed to clean up test databases directory:', error);
		}
	}
}

function initializeTables() {
	const createUsersTable = `
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
			email TEXT UNIQUE NOT NULL,
			username TEXT NOT NULL,
			password TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`;

	const createTrigger = `
		CREATE TRIGGER IF NOT EXISTS update_users_updated_at
		AFTER UPDATE ON users
		BEGIN
			UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
		END
	`;

	db.exec(createUsersTable);
	db.exec(createTrigger);
}

// Handle graceful shutdown
process.on('exit', closeDatabase);
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);

// Clean up old test databases on startup
if (env.NODE_ENV === 'test') {
	cleanupTestDatabases();
}
