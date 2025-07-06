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
			db.exec('DROP TABLE IF EXISTS users');
			db.exec('DROP TABLE IF EXISTS games');
			console.log('Database tables cleared');
		} catch (error) {
			console.log("Error clearing tables (expected if tables don't exist):", error);
		}

		try {
			initializeTables();
			console.log('Database tables recreated');
		} catch (error) {
			console.log('Error recreating tables:', error);
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
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT UNIQUE NOT NULL,
			username TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`;

	const createGamesTable = `
		CREATE TABLE IF NOT EXISTS games (
			id TEXT PRIMARY KEY,
			player1_id TEXT NOT NULL,
			player2_id TEXT,
			current_player TEXT NOT NULL CHECK (current_player IN ('X', 'O')),
			status TEXT NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
			board TEXT NOT NULL,  -- JSON string of the game board
			winner TEXT CHECK (winner IN ('X', 'O', 'draw')),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (player1_id) REFERENCES users(id),
			FOREIGN KEY (player2_id) REFERENCES users(id)
		)
	`;

	const createIndexes = `
		CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
		CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
		CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
		CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
	`;

	db.exec(createUsersTable);
	db.exec(createGamesTable);
	db.exec(createIndexes);
}

// Handle graceful shutdown
process.on('exit', closeDatabase);
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);

// Clean up old test databases on startup
if (env.NODE_ENV === 'test') {
	cleanupTestDatabases();
}
