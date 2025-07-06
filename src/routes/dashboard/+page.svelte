<script lang="ts">
	import { authStore, auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { gameAPI, type Game } from '$lib/api';

	let myGames: Game[] = [];
	let waitingGames: Game[] = [];
	let loading = false;
	let error = '';

	onMount(async () => {
		if (!$authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		await loadGames();
	});

	async function loadGames() {
		loading = true;
		try {
			const [myGamesResponse, waitingGamesResponse] = await Promise.all([
				gameAPI.getGames(),
				gameAPI.getWaitingGames()
			]);

			myGames = myGamesResponse.games;
			waitingGames = waitingGamesResponse.games;
			error = '';
		} catch (err) {
			error = (err as Error).message;
		} finally {
			loading = false;
		}
	}

	async function createGame() {
		loading = true;
		try {
			const response = await gameAPI.createGame();
			await loadGames(); // Refresh the lists
			goto(`/game/${response.game.id}`);
		} catch (err) {
			error = (err as Error).message;
			loading = false;
		}
	}

	async function joinGame(gameId: string) {
		loading = true;
		try {
			await gameAPI.joinGame(gameId);
			goto(`/game/${gameId}`);
		} catch (err) {
			error = (err as Error).message;
			loading = false;
		}
	}

	function getGameStatus(game: Game): string {
		switch (game.status) {
			case 'waiting':
				return 'Waiting for opponent';
			case 'playing':
				return 'In progress';
			case 'finished':
				if (game.winner === 'draw') return 'Draw';
				return `${game.winner} wins`;
			default:
				return 'Unknown';
		}
	}

	function getGameStatusClass(game: Game): string {
		switch (game.status) {
			case 'waiting':
				return 'status-waiting';
			case 'playing':
				return 'status-playing';
			case 'finished':
				return 'status-finished';
			default:
				return '';
		}
	}

	function isMyTurn(game: Game): boolean {
		if (game.status !== 'playing' || !$authStore.user) return false;

		const playerSymbol = game.player1_id === $authStore.user.id.toString() ? 'X' : 'O';
		return game.current_player === playerSymbol;
	}

	async function logout() {
		await auth.logout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Dashboard - Ultimate Tic-Tac-Toe</title>
</svelte:head>

<div class="dashboard">
	<div class="header">
		<h1>Welcome, {$authStore.user?.username}!</h1>
		<div class="user-info">
			<span>{$authStore.user?.email}</span>
			<button class="logout-btn" on:click={logout}>Logout</button>
		</div>
	</div>

	<div class="game-section">
		<div class="section-header">
			<h2>Ultimate Tic-Tac-Toe</h2>
			<button class="game-btn create-game" on:click={createGame} disabled={loading}>
				{loading ? 'Creating...' : 'Create New Game'}
			</button>
		</div>

		{#if error}
			<div class="error">
				{error}
			</div>
		{/if}

		<div class="games-container">
			<!-- My Games -->
			<div class="games-section">
				<h3>My Games</h3>
				{#if myGames.length === 0}
					<p class="no-games">No games yet. Create a new game to get started!</p>
				{:else}
					<div class="games-list">
						{#each myGames as game}
							<div class="game-card" class:my-turn={isMyTurn(game)}>
								<div class="game-header">
									<h4>Game #{game.id.slice(0, 8)}</h4>
									<span class="game-status {getGameStatusClass(game)}">
										{getGameStatus(game)}
									</span>
								</div>
								<div class="game-info">
									<p>Created: {new Date(game.created_at).toLocaleDateString()}</p>
									{#if isMyTurn(game)}
										<p class="turn-indicator">Your turn!</p>
									{/if}
								</div>
								<button class="game-btn play-game" on:click={() => goto(`/game/${game.id}`)}>
									{game.status === 'waiting' ? 'Share Game' : 'Play Game'}
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Available Games -->
			<div class="games-section">
				<h3>Available Games</h3>
				{#if waitingGames.length === 0}
					<p class="no-games">No games waiting for players.</p>
				{:else}
					<div class="games-list">
						{#each waitingGames as game}
							<div class="game-card">
								<div class="game-header">
									<h4>Game #{game.id.slice(0, 8)}</h4>
									<span class="game-status status-waiting"> Waiting for opponent </span>
								</div>
								<div class="game-info">
									<p>Created: {new Date(game.created_at).toLocaleDateString()}</p>
									<p>By: {game.player1_name || 'Unknown Player'}</p>
								</div>
								<button
									class="game-btn join-game"
									on:click={() => joinGame(game.id)}
									disabled={loading}
								>
									{loading ? 'Joining...' : 'Join Game'}
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="refresh-section">
			<button class="refresh-btn" on:click={loadGames} disabled={loading}>
				{loading ? 'Loading...' : 'Refresh Games'}
			</button>
		</div>
	</div>
</div>

<style>
	.dashboard {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem;
		color: white;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		backdrop-filter: blur(10px);
	}

	.header h1 {
		margin: 0;
		font-size: 2rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.logout-btn {
		background: rgba(231, 76, 60, 0.8);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.logout-btn:hover {
		background: rgba(231, 76, 60, 1);
	}

	.game-section {
		background: rgba(255, 255, 255, 0.95);
		color: #2c3e50;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #ecf0f1;
	}

	.section-header h2 {
		margin: 0;
		color: #2c3e50;
	}

	.game-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
	}

	.create-game {
		background: #27ae60;
		color: white;
	}

	.create-game:hover:not(:disabled) {
		background: #219a52;
		transform: translateY(-2px);
	}

	.play-game {
		background: #3498db;
		color: white;
	}

	.play-game:hover {
		background: #2980b9;
	}

	.join-game {
		background: #e67e22;
		color: white;
	}

	.join-game:hover:not(:disabled) {
		background: #d35400;
	}

	.refresh-btn {
		background: #95a5a6;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.refresh-btn:hover:not(:disabled) {
		background: #7f8c8d;
	}

	.game-btn:disabled,
	.refresh-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.error {
		background: #e74c3c;
		color: white;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.games-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.games-section h3 {
		margin-top: 0;
		color: #2c3e50;
		border-bottom: 1px solid #bdc3c7;
		padding-bottom: 0.5rem;
	}

	.no-games {
		color: #7f8c8d;
		font-style: italic;
		text-align: center;
		padding: 2rem;
	}

	.games-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.game-card {
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1rem;
		transition: all 0.2s;
	}

	.game-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.game-card.my-turn {
		border-color: #27ae60;
		background: #f8fff8;
	}

	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.game-header h4 {
		margin: 0;
		color: #2c3e50;
	}

	.game-status {
		font-size: 0.8rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: bold;
	}

	.status-waiting {
		background: #fff3cd;
		color: #856404;
	}

	.status-playing {
		background: #d1ecf1;
		color: #0c5460;
	}

	.status-finished {
		background: #f8d7da;
		color: #721c24;
	}

	.game-info {
		margin-bottom: 1rem;
		font-size: 0.9rem;
		color: #6c757d;
	}

	.game-info p {
		margin: 0.25rem 0;
	}

	.turn-indicator {
		color: #27ae60 !important;
		font-weight: bold;
	}

	.refresh-section {
		text-align: center;
		padding-top: 1rem;
		border-top: 1px solid #dee2e6;
	}

	@media (max-width: 768px) {
		.dashboard {
			padding: 1rem;
		}

		.header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.header h1 {
			font-size: 1.5rem;
		}

		.section-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.games-container {
			grid-template-columns: 1fr;
		}

		.game-card {
			padding: 0.75rem;
		}

		.game-header {
			flex-direction: column;
			gap: 0.5rem;
			text-align: center;
		}
	}
</style>
