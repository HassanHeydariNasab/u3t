import { json, type RequestHandler } from '@sveltejs/kit';
import { authService } from '$lib/server/services/auth.js';
import { gamesService } from '$lib/server/services/games.js';
import { gameService } from '$lib/server/services/game.js';
import { usersService } from '$lib/server/services/users.js';

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

		// Check if user is a player in this game OR if the game is waiting for a second player
		if (!gameService.isPlayerInGame(game, user.id.toString()) && game.status !== 'waiting') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get player information
		const player1 = await usersService.findById(game.player1_id);
		const player2 = game.player2_id ? await usersService.findById(game.player2_id) : null;

		// Add player information to the game object
		const gameWithPlayers = {
			...game,
			player1_name: player1?.username || 'Unknown Player',
			player2_name: player2?.username || null
		};

		console.log('Game with players:', {
			id: gameWithPlayers.id,
			status: gameWithPlayers.status,
			player1_id: gameWithPlayers.player1_id,
			player2_id: gameWithPlayers.player2_id,
			player1_name: gameWithPlayers.player1_name,
			player2_name: gameWithPlayers.player2_name,
			requestingUser: user.id
		});

		return json({ game: gameWithPlayers });
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

			if (!savedGame) {
				return json({ error: 'Failed to update game' }, { status: 500 });
			}

			// Add player names to the game object (same as GET handler)
			const player1 = await usersService.findById(savedGame.player1_id);
			const player2 = savedGame.player2_id
				? await usersService.findById(savedGame.player2_id)
				: null;
			const gameWithPlayers = {
				...savedGame,
				player1_name: player1?.username || 'Unknown Player',
				player2_name: player2?.username || null
			};

			return json({
				game: gameWithPlayers,
				validMove: true
			});
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Game action error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
