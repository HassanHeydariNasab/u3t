<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { gameAPI, type Game, type GameMove } from '$lib/api';
	import GameBoard from '$lib/components/GameBoard.svelte';

	let game: Game | null = null;
	let loading = true;
	let error = '';
	let pollInterval: ReturnType<typeof setInterval>;

	$: gameId = $page.params.id;
	$: currentUser = $authStore.user;

	onMount(async () => {
		if (!$authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		await loadGame();

		// Poll for game updates every 2 seconds
		pollInterval = setInterval(loadGame, 2000);
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	async function loadGame() {
		try {
			const response = await gameAPI.getGame(gameId);
			game = response.game;
			error = '';
		} catch (err) {
			error = (err as Error).message;
			if (error.includes('not found') || error.includes('Forbidden')) {
				goto('/dashboard');
			}
		} finally {
			loading = false;
		}
	}

	async function handleMove(move: GameMove) {
		if (!game || !currentUser) return;

		try {
			const response = await gameAPI.makeMove(gameId, move);
			if (response.validMove) {
				game = response.game;
				error = '';
			}
		} catch (err) {
			error = (err as Error).message;
		}
	}

	async function joinGame() {
		if (!game || !currentUser) return;

		try {
			const response = await gameAPI.joinGame(gameId);
			game = response.game;
			error = '';
		} catch (err) {
			error = (err as Error).message;
		}
	}

	function canJoinGame(): boolean {
		return (
			game?.status === 'waiting' &&
			game?.player2_id === null &&
			game?.player1_id !== currentUser?.id.toString()
		);
	}

	function getOpponentName(): string {
		if (!game || !currentUser) return 'Unknown';

		if (game.player1_id === currentUser.id.toString()) {
			return game.player2_id ? 'Player 2' : 'Waiting...';
		} else {
			return 'Player 1';
		}
	}
</script>

<svelte:head>
	<title>Ultimate Tic-Tac-Toe - Game</title>
</svelte:head>

<div class="game-page">
	{#if loading}
		<div class="loading">
			<h2>Loading game...</h2>
		</div>
	{:else if error}
		<div class="error">
			<h2>Error</h2>
			<p>{error}</p>
			<button on:click={() => goto('/dashboard')} class="btn btn-primary">
				Back to Dashboard
			</button>
		</div>
	{:else if game && currentUser}
		<div class="game-header">
			<button on:click={() => goto('/dashboard')} class="btn btn-secondary">
				← Back to Dashboard
			</button>
			<div class="game-meta">
				<h1>Game #{game.id.slice(0, 8)}</h1>
				<p>Opponent: {getOpponentName()}</p>
			</div>
		</div>

		{#if canJoinGame()}
			<div class="join-game">
				<h2>Join this game?</h2>
				<p>Player 1 is waiting for an opponent.</p>
				<button on:click={joinGame} class="btn btn-primary"> Join Game </button>
			</div>
		{:else}
			<GameBoard {game} currentUserId={currentUser.id.toString()} onMove={handleMove} />
		{/if}

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}
	{/if}
</div>

<style>
	.game-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem;
	}

	.loading,
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		color: white;
		text-align: center;
	}

	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.game-meta {
		text-align: right;
		color: white;
	}

	.game-meta h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.game-meta p {
		margin: 0.5rem 0 0 0;
		opacity: 0.8;
	}

	.join-game {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		text-align: center;
		max-width: 400px;
		margin: 0 auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.join-game h2 {
		margin-top: 0;
		color: #2c3e50;
	}

	.error-message {
		background: #e74c3c;
		color: white;
		padding: 1rem;
		border-radius: 8px;
		margin-top: 1rem;
		text-align: center;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
	}

	.btn-primary {
		background: #3498db;
		color: white;
	}

	.btn-primary:hover {
		background: #2980b9;
		transform: translateY(-2px);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	@media (max-width: 768px) {
		.game-page {
			padding: 1rem;
		}

		.game-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.game-meta {
			text-align: center;
		}
	}
</style>
