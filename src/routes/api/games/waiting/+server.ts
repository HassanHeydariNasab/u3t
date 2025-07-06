import { json, type RequestHandler } from '@sveltejs/kit';
import { authService } from '$lib/server/services/auth.js';
import { gamesService } from '$lib/server/services/games.js';
import { usersService } from '$lib/server/services/users.js';

// GET /api/games/waiting - List games waiting for players
export const GET: RequestHandler = async ({ request }) => {
	try {
		const user = await authService.getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get all games waiting for players, excluding user's own games
		const waitingGames = gamesService
			.findWaitingGames()
			.filter((game) => game.player1_id !== user.id.toString());

		// Add player information to each game
		const gamesWithPlayers = await Promise.all(
			waitingGames.map(async (game) => {
				const player1 = await usersService.findById(game.player1_id);
				return {
					...game,
					player1_name: player1?.username || 'Unknown Player'
				};
			})
		);

		return json({ games: gamesWithPlayers });
	} catch (error) {
		console.error('Get waiting games error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
