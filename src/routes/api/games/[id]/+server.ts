import { json, type RequestHandler } from '@sveltejs/kit';
import { authService } from '$lib/server/services/auth.js';
import { gamesService } from '$lib/server/services/games.js';
import { gameService } from '$lib/server/services/game.js';

// GET /api/games/[id] - Get game state
export const GET: RequestHandler = async ({ params, request }) => {
	try {
		const user = await authService.getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const game = gamesService.findById(params.id!);
		if (!game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		// Check if user is a player in this game
		if (!gameService.isPlayerInGame(game, user.id.toString())) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		return json({ game });
	} catch (error) {
		console.error('Get game error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT /api/games/[id] - Join game or make move
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const user = await authService.getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const game = gamesService.findById(params.id!);
		if (!game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		const body = await request.json();

		// Handle joining a game
		if (body.action === 'join') {
			try {
				const updatedGame = gameService.joinGame(game, user.id.toString());
				const savedGame = await gamesService.update(game.id, updatedGame);
				return json({ game: savedGame });
			} catch (error) {
				return json({ error: (error as Error).message }, { status: 400 });
			}
		}

		// Handle making a move
		if (body.action === 'move' && body.move) {
			// Check if user is a player in this game
			if (!gameService.isPlayerInGame(game, user.id.toString())) {
				return json({ error: 'Forbidden' }, { status: 403 });
			}

			const playerSymbol = gameService.getPlayerSymbol(game, user.id.toString());
			if (!playerSymbol) {
				return json({ error: 'You are not a player in this game' }, { status: 403 });
			}

			const move = { ...body.move, player: playerSymbol };
			const validation = gameService.isValidMove(game, move);

			if (!validation.valid) {
				return json(
					{
						error: validation.error,
						validMove: false
					},
					{ status: 400 }
				);
			}

			const updatedGame = gameService.applyMove(game, move);
			const savedGame = await gamesService.update(game.id, updatedGame);

			return json({
				game: savedGame,
				validMove: true
			});
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Game action error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
