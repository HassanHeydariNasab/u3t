import { getDatabase } from '../database.js';
import type { User, UserWithoutPassword } from '../models/user.js';
import bcrypt from 'bcrypt';

export class UsersService {
	private get db() {
		return getDatabase();
	}

	async findByEmail(email: string): Promise<User | null> {
		const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
		const user = stmt.get(email) as User | undefined;
		return user || null;
	}

	async findById(id: string): Promise<User | null> {
		const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
		const user = stmt.get(id) as User | undefined;
		return user || null;
	}

	async create(email: string, username: string, password: string): Promise<User> {
		const hashedPassword = await bcrypt.hash(password, 10);

		const stmt = this.db.prepare(`
			INSERT INTO users (email, username, password)
			VALUES (?, ?, ?)
		`);

		const result = stmt.run(email, username, hashedPassword);

		// Get the created user
		const createdUser = this.db
			.prepare('SELECT * FROM users WHERE rowid = ?')
			.get(result.lastInsertRowid) as User;

		return createdUser;
	}

	async validatePassword(user: User, password: string): Promise<boolean> {
		return bcrypt.compare(password, user.password);
	}

	async findAll(): Promise<UserWithoutPassword[]> {
		const stmt = this.db.prepare('SELECT id, email, username, created_at, updated_at FROM users');
		return stmt.all() as UserWithoutPassword[];
	}

	// Helper method to remove password from user object
	removePassword(user: User): UserWithoutPassword {
		const { password, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}

	async clearAll(): Promise<boolean> {
		try {
			const stmt = this.db.prepare('DELETE FROM users');
			const result = stmt.run();
			console.log(`Cleared ${result.changes} users from database`);
			return true;
		} catch (error) {
			console.error('Failed to clear users:', error);
			return false;
		}
	}
}

export const usersService = new UsersService();
