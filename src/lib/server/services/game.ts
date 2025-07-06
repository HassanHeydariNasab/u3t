import type { Game, GameMove, Player, SmallBoard, GameBoard, CellState } from '../models/game.js';
import { createNewGame as createGameTemplate } from '../models/game.js';

export class GameService {
	/**
	 * Check if a move is valid according to Ultimate Tic-Tac-Toe rules
	 */
	isValidMove(game: Game, move: GameMove): { valid: boolean; error?: string } {
		// Check if game is in playing state
		if (game.status !== 'playing') {
			return { valid: false, error: 'Game is not in playing state' };
		}

		// Check if it's the player's turn
		if (game.current_player !== move.player) {
			return { valid: false, error: 'Not your turn' };
		}

		// Check if move coordinates are valid
		if (
			!this.isValidCoordinate(move.boardRow) ||
			!this.isValidCoordinate(move.boardCol) ||
			!this.isValidCoordinate(move.cellRow) ||
			!this.isValidCoordinate(move.cellCol)
		) {
			return { valid: false, error: 'Invalid move coordinates' };
		}

		const smallBoard = game.board.smallBoards[move.boardRow][move.boardCol];

		// Check if the small board is already won
		if (smallBoard.winner !== null) {
			return { valid: false, error: 'Cannot play in a completed board' };
		}

		// Check if the cell is already occupied
		if (smallBoard.cells[move.cellRow][move.cellCol] !== null) {
			return { valid: false, error: 'Cell is already occupied' };
		}

		// Check if the move is in the correct active board
		if (game.board.activeBoard !== null) {
			if (
				game.board.activeBoard.row !== move.boardRow ||
				game.board.activeBoard.col !== move.boardCol
			) {
				return { valid: false, error: 'Must play in the active board' };
			}
		}

		return { valid: true };
	}

	/**
	 * Apply a move to the game state
	 */
	applyMove(game: Game, move: GameMove): Game {
		// Create a deep copy of the game state
		const newGame = JSON.parse(JSON.stringify(game)) as Game;

		// Apply the move to the small board
		const smallBoard = newGame.board.smallBoards[move.boardRow][move.boardCol];
		smallBoard.cells[move.cellRow][move.cellCol] = move.player;

		// Track the last move
		newGame.board.lastMove = {
			boardRow: move.boardRow,
			boardCol: move.boardCol,
			cellRow: move.cellRow,
			cellCol: move.cellCol,
			player: move.player
		};

		// Check if the small board is now won
		smallBoard.winner = this.checkSmallBoardWinner(smallBoard);

		// Check if the entire game is won
		newGame.board.winner = this.checkGameWinner(newGame.board);

		// Update game status and winner
		if (newGame.board.winner !== null) {
			newGame.status = 'finished';
			newGame.winner = newGame.board.winner === 'draw' ? 'draw' : newGame.board.winner;
		}

		// Determine the next active board
		const nextActiveBoard = { row: move.cellRow, col: move.cellCol };
		const nextSmallBoard = newGame.board.smallBoards[nextActiveBoard.row][nextActiveBoard.col];

		// If the next board is already won, player can choose any available board
		if (nextSmallBoard.winner !== null) {
			newGame.board.activeBoard = null;
		} else {
			newGame.board.activeBoard = nextActiveBoard;
		}

		// Switch to the next player
		newGame.current_player = move.player === 'X' ? 'O' : 'X';
		newGame.updated_at = new Date().toISOString();

		return newGame;
	}

	/**
	 * Check if a small 3x3 board has a winner
	 */
	private checkSmallBoardWinner(board: SmallBoard): Player | 'draw' | null {
		const cells = board.cells;

		// Check rows
		for (let row = 0; row < 3; row++) {
			if (cells[row][0] && cells[row][0] === cells[row][1] && cells[row][1] === cells[row][2]) {
				return cells[row][0];
			}
		}

		// Check columns
		for (let col = 0; col < 3; col++) {
			if (cells[0][col] && cells[0][col] === cells[1][col] && cells[1][col] === cells[2][col]) {
				return cells[0][col];
			}
		}

		// Check diagonals
		if (cells[0][0] && cells[0][0] === cells[1][1] && cells[1][1] === cells[2][2]) {
			return cells[0][0];
		}
		if (cells[0][2] && cells[0][2] === cells[1][1] && cells[1][1] === cells[2][0]) {
			return cells[0][2];
		}

		// Check for draw (all cells filled)
		const allFilled = cells.every((row) => row.every((cell) => cell !== null));
		if (allFilled) {
			return 'draw';
		}

		return null;
	}

	/**
	 * Check if the entire game has a winner by checking the 3x3 grid of small board winners
	 */
	private checkGameWinner(board: GameBoard): Player | 'draw' | null {
		// Create a 3x3 grid representing the winners of each small board
		const winners: (Player | 'draw' | null)[][] = board.smallBoards.map((row) =>
			row.map((smallBoard) => smallBoard.winner)
		);

		// Check rows
		for (let row = 0; row < 3; row++) {
			if (
				winners[row][0] &&
				winners[row][0] !== 'draw' &&
				winners[row][0] === winners[row][1] &&
				winners[row][1] === winners[row][2]
			) {
				return winners[row][0] as Player;
			}
		}

		// Check columns
		for (let col = 0; col < 3; col++) {
			if (
				winners[0][col] &&
				winners[0][col] !== 'draw' &&
				winners[0][col] === winners[1][col] &&
				winners[1][col] === winners[2][col]
			) {
				return winners[0][col] as Player;
			}
		}

		// Check diagonals
		if (
			winners[0][0] &&
			winners[0][0] !== 'draw' &&
			winners[0][0] === winners[1][1] &&
			winners[1][1] === winners[2][2]
		) {
			return winners[0][0] as Player;
		}
		if (
			winners[0][2] &&
			winners[0][2] !== 'draw' &&
			winners[0][2] === winners[1][1] &&
			winners[1][1] === winners[2][0]
		) {
			return winners[0][2] as Player;
		}

		// Check for draw (all small boards completed)
		const allCompleted = winners.every((row) => row.every((winner) => winner !== null));
		if (allCompleted) {
			return 'draw';
		}

		return null;
	}

	/**
	 * Get all available moves for the current player
	 */
	getAvailableMoves(game: Game): GameMove[] {
		if (game.status !== 'playing') {
			return [];
		}

		const moves: GameMove[] = [];
		const currentPlayer = game.current_player;

		// Determine which boards can be played in
		const playableBoards: { row: number; col: number }[] = [];

		if (game.board.activeBoard !== null) {
			// Only one board is active
			const activeBoard = game.board.activeBoard;
			const smallBoard = game.board.smallBoards[activeBoard.row][activeBoard.col];
			if (smallBoard.winner === null) {
				playableBoards.push(activeBoard);
			}
		} else {
			// Any non-won board can be played
			for (let row = 0; row < 3; row++) {
				for (let col = 0; col < 3; col++) {
					if (game.board.smallBoards[row][col].winner === null) {
						playableBoards.push({ row, col });
					}
				}
			}
		}

		// Find all empty cells in playable boards
		for (const boardPos of playableBoards) {
			const smallBoard = game.board.smallBoards[boardPos.row][boardPos.col];
			for (let cellRow = 0; cellRow < 3; cellRow++) {
				for (let cellCol = 0; cellCol < 3; cellCol++) {
					if (smallBoard.cells[cellRow][cellCol] === null) {
						moves.push({
							boardRow: boardPos.row,
							boardCol: boardPos.col,
							cellRow,
							cellCol,
							player: currentPlayer
						});
					}
				}
			}
		}

		return moves;
	}

	/**
	 * Create a new game
	 */
	createGame(player1Id: string): Omit<Game, 'id' | 'created_at' | 'updated_at'> {
		return createGameTemplate(player1Id);
	}

	/**
	 * Join a game as the second player
	 */
	joinGame(game: Game, player2Id: string): Game {
		if (game.status !== 'waiting') {
			throw new Error('Game is not waiting for players');
		}

		if (game.player1_id === player2Id) {
			throw new Error('Cannot join your own game');
		}

		if (game.player2_id !== null) {
			throw new Error('Game is already full');
		}

		const updatedGame = { ...game };
		updatedGame.player2_id = player2Id;
		updatedGame.status = 'playing';
		updatedGame.updated_at = new Date().toISOString();

		return updatedGame;
	}

	/**
	 * Check if a coordinate is valid (0-2)
	 */
	private isValidCoordinate(coord: number): boolean {
		return Number.isInteger(coord) && coord >= 0 && coord <= 2;
	}

	/**
	 * Get the player symbol for a user in a game
	 */
	getPlayerSymbol(game: Game, userId: string): Player | null {
		if (game.player1_id === userId) return 'X';
		if (game.player2_id === userId) return 'O';
		return null;
	}

	/**
	 * Check if a user is a player in the game
	 */
	isPlayerInGame(game: Game, userId: string): boolean {
		return game.player1_id === userId || game.player2_id === userId;
	}
}

export const gameService = new GameService();
