import { json, type RequestHandler } from '@sveltejs/kit';
import { authService } from '$lib/server/services/auth.js';
import { gamesService } from '$lib/server/services/games.js';
import { gameService } from '$lib/server/services/game.js';

// GET /api/games - List games for the authenticated user
export const GET: RequestHandler = async ({ request }) => {
	try {
		const user = await authService.getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const games = gamesService.findByPlayerId(user.id.toString());
		return json({ games });
	} catch (error) {
		console.error('Get games error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/games - Create a new game
export const POST: RequestHandler = async ({ request }) => {
	try {
		const user = await authService.getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Create new game with the authenticated user as player 1
		const gameData = gameService.createGame(user.id.toString());
		const game = await gamesService.create(gameData);

		return json({ game }, { status: 201 });
	} catch (error) {
		console.error('Create game error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
