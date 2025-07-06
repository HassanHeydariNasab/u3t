import { browser } from '$app/environment';

export interface User {
	id: string;
	email: string;
	username: string;
	created_at: string;
	updated_at: string;
}

export interface AuthResponse {
	access_token: string;
	user: User;
}

export interface LoginInput {
	email: string;
	password: string;
}

export interface RegisterInput {
	email: string;
	username: string;
	password: string;
}

// Export aliases for backwards compatibility
export type LoginData = LoginInput;
export type RegisterData = RegisterInput;

// Game-related types
export interface Game {
	id: string;
	player1_id: string;
	player2_id: string | null;
	current_player: 'X' | 'O';
	status: 'waiting' | 'playing' | 'finished';
	board: GameBoard;
	winner: 'X' | 'O' | 'draw' | null;
	created_at: string;
	updated_at: string;
}

export interface GameBoard {
	smallBoards: SmallBoard[][];
	winner: 'X' | 'O' | 'draw' | null;
	activeBoard: { row: number; col: number } | null;
}

export interface SmallBoard {
	cells: ('X' | 'O' | null)[][];
	winner: 'X' | 'O' | 'draw' | null;
}

export interface GameMove {
	boardRow: number;
	boardCol: number;
	cellRow: number;
	cellCol: number;
}

class ApiClient {
	private baseUrl = browser ? window.location.origin : 'http://localhost:4173';

	private getAuthHeaders(): Record<string, string> {
		if (!browser) return {};
		const token = localStorage.getItem('access_token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...this.getAuthHeaders(),
			...((options.headers as Record<string, string>) || {})
		};

		const response = await fetch(url, {
			...options,
			headers
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Unknown error' }));

			// Handle authentication errors - but don't redirect for login endpoints
			if (response.status === 401 && !endpoint.includes('/auth/login')) {
				if (browser) {
					localStorage.removeItem('access_token');
					window.location.href = '/login';
				}
			}

			throw new Error(error.error || `HTTP ${response.status}`);
		}

		return response.json();
	}

	// Auth methods
	async login(data: LoginData): Promise<AuthResponse> {
		return this.request<AuthResponse>('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async register(data: RegisterData): Promise<AuthResponse> {
		return this.request<AuthResponse>('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async getProfile(): Promise<{ user: User }> {
		return this.request<{ user: User }>('/api/auth/profile');
	}

	// Game methods
	async getGames(): Promise<{ games: Game[] }> {
		return this.request<{ games: Game[] }>('/api/games');
	}

	async getWaitingGames(): Promise<{ games: Game[] }> {
		return this.request<{ games: Game[] }>('/api/games/waiting');
	}

	async createGame(): Promise<{ game: Game }> {
		return this.request<{ game: Game }>('/api/games', {
			method: 'POST'
		});
	}

	async getGame(gameId: string): Promise<{ game: Game }> {
		return this.request<{ game: Game }>(`/api/games/${gameId}`);
	}

	async joinGame(gameId: string): Promise<{ game: Game }> {
		return this.request<{ game: Game }>(`/api/games/${gameId}`, {
			method: 'PUT',
			body: JSON.stringify({ action: 'join' })
		});
	}

	async makeMove(gameId: string, move: GameMove): Promise<{ game: Game; validMove: boolean }> {
		return this.request<{ game: Game; validMove: boolean }>(`/api/games/${gameId}`, {
			method: 'PUT',
			body: JSON.stringify({ action: 'move', move })
		});
	}
}

export const api = new ApiClient();

// Auth-specific exports
export const authAPI = {
	login: (data: LoginData) => api.login(data),
	register: (data: RegisterData) => api.register(data),
	getProfile: () => api.getProfile()
};

// Game-specific exports
export const gameAPI = {
	getGames: () => api.getGames(),
	getWaitingGames: () => api.getWaitingGames(),
	createGame: () => api.createGame(),
	getGame: (gameId: string) => api.getGame(gameId),
	joinGame: (gameId: string) => api.joinGame(gameId),
	makeMove: (gameId: string, move: GameMove) => api.makeMove(gameId, move)
};
