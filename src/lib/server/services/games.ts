import { getDatabase } from '../database.js';
import type { Game, GameBoard } from '../models/game.js';
import { randomUUID } from 'crypto';

export class GamesService {
	private get db() {
		return getDatabase();
	}

	/**
	 * Create a new game
	 */
	async create(gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>): Promise<Game> {
		const id = randomUUID();
		const now = new Date().toISOString();

		const stmt = this.db.prepare(`
			INSERT INTO games (id, player1_id, player2_id, current_player, status, board, winner, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		stmt.run(
			id,
			gameData.player1_id,
			gameData.player2_id,
			gameData.current_player,
			gameData.status,
			JSON.stringify(gameData.board),
			gameData.winner,
			now,
			now
		);

		return this.findById(id)!;
	}

	/**
	 * Find a game by ID
	 */
	findById(id: string): Game | null {
		const stmt = this.db.prepare('SELECT * FROM games WHERE id = ?');
		const row = stmt.get(id) as any;

		if (!row) return null;

		return this.rowToGame(row);
	}

	/**
	 * Update a game
	 */
	async update(
		id: string,
		updates: Partial<Omit<Game, 'id' | 'created_at'>>
	): Promise<Game | null> {
		const game = this.findById(id);
		if (!game) return null;

		const updatedGame = { ...game, ...updates, updated_at: new Date().toISOString() };

		const stmt = this.db.prepare(`
			UPDATE games 
			SET player2_id = ?, current_player = ?, status = ?, board = ?, winner = ?, updated_at = ?
			WHERE id = ?
		`);

		stmt.run(
			updatedGame.player2_id,
			updatedGame.current_player,
			updatedGame.status,
			JSON.stringify(updatedGame.board),
			updatedGame.winner,
			updatedGame.updated_at,
			id
		);

		return this.findById(id);
	}

	/**
	 * Find games by player ID
	 */
	findByPlayerId(playerId: string): Game[] {
		const stmt = this.db.prepare(`
			SELECT * FROM games 
			WHERE player1_id = ? OR player2_id = ?
			ORDER BY updated_at DESC
		`);
		const rows = stmt.all(playerId, playerId) as any[];

		return rows.map((row) => this.rowToGame(row));
	}

	/**
	 * Find games waiting for players
	 */
	findWaitingGames(): Game[] {
		const stmt = this.db.prepare(`
			SELECT * FROM games 
			WHERE status = 'waiting'
			ORDER BY created_at ASC
		`);
		const rows = stmt.all() as any[];

		return rows.map((row) => this.rowToGame(row));
	}

	/**
	 * Find active games for a player
	 */
	findActiveGamesByPlayerId(playerId: string): Game[] {
		const stmt = this.db.prepare(`
			SELECT * FROM games 
			WHERE (player1_id = ? OR player2_id = ?)
			AND status IN ('waiting', 'playing')
			ORDER BY updated_at DESC
		`);
		const rows = stmt.all(playerId, playerId) as any[];

		return rows.map((row) => this.rowToGame(row));
	}

	/**
	 * Delete a game
	 */
	delete(id: string): boolean {
		const stmt = this.db.prepare('DELETE FROM games WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	/**
	 * Clear all games (for testing)
	 */
	clearAll(): boolean {
		try {
			const stmt = this.db.prepare('DELETE FROM games');
			const result = stmt.run();
			console.log(`Cleared ${result.changes} games from database`);
			return true;
		} catch (error) {
			console.error('Failed to clear games:', error);
			return false;
		}
	}

	/**
	 * Convert database row to Game object
	 */
	private rowToGame(row: any): Game {
		return {
			id: row.id,
			player1_id: row.player1_id,
			player2_id: row.player2_id,
			current_player: row.current_player,
			status: row.status,
			board: JSON.parse(row.board) as GameBoard,
			winner: row.winner,
			created_at: row.created_at,
			updated_at: row.updated_at
		};
	}
}

export const gamesService = new GamesService();
