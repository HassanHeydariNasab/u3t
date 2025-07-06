export type Player = 'X' | 'O';
export type CellState = Player | null;
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type GameResult = 'X' | 'O' | 'draw' | null;

// A small 3x3 board (one of the 9 sub-boards)
export interface SmallBoard {
	cells: CellState[][]; // 3x3 grid
	winner: Player | 'draw' | null; // Winner of this small board
}

// The main Ultimate Tic-Tac-Toe board (3x3 grid of small boards)
export interface GameBoard {
	smallBoards: SmallBoard[][]; // 3x3 grid of small boards
	winner: Player | 'draw' | null; // Winner of the entire game
	activeBoard: { row: number; col: number } | null; // Which small board is active (null = any board)
	lastMove: {
		boardRow: number;
		boardCol: number;
		cellRow: number;
		cellCol: number;
		player: Player;
	} | null; // Track the last move made
}

// Game state and metadata
export interface Game {
	id: string;
	player1_id: string;
	player2_id: string | null;
	current_player: Player;
	status: GameStatus;
	board: GameBoard;
	winner: GameResult;
	created_at: string;
	updated_at: string;
}

// Move representation
export interface GameMove {
	boardRow: number; // Which small board (0-2)
	boardCol: number; // Which small board (0-2)
	cellRow: number; // Which cell in the small board (0-2)
	cellCol: number; // Which cell in the small board (0-2)
	player: Player;
}

// API request/response types
export interface CreateGameRequest {
	// Empty for now - could add game settings later
}

export interface CreateGameResponse {
	game: Game;
}

export interface JoinGameRequest {
	gameId: string;
}

export interface JoinGameResponse {
	game: Game;
}

export interface MakeMoveRequest {
	gameId: string;
	move: Omit<GameMove, 'player'>; // Player is determined by auth
}

export interface MakeMoveResponse {
	game: Game;
	validMove: boolean;
	error?: string;
}

export interface GetGameResponse {
	game: Game;
}

export interface ListGamesResponse {
	games: Game[];
}

// Utility functions for creating initial game state
export function createEmptySmallBoard(): SmallBoard {
	return {
		cells: Array(3)
			.fill(null)
			.map(() => Array(3).fill(null)),
		winner: null
	};
}

export function createEmptyGameBoard(): GameBoard {
	return {
		smallBoards: Array(3)
			.fill(null)
			.map(() =>
				Array(3)
					.fill(null)
					.map(() => createEmptySmallBoard())
			),
		winner: null,
		activeBoard: null, // First move can be anywhere
		lastMove: null
	};
}

export function createNewGame(player1Id: string): Omit<Game, 'id' | 'created_at' | 'updated_at'> {
	return {
		player1_id: player1Id,
		player2_id: null,
		current_player: 'X', // X always goes first
		status: 'waiting',
		board: createEmptyGameBoard(),
		winner: null
	};
}
