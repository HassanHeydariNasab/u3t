<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore, auth } from '$lib/stores/auth';
	import { gameAPI, type Game, type GameMove } from '$lib/api';
	import GameBoard from '$lib/components/GameBoard.svelte';

	let game: Game | null = null;
	let loading = true;
	let error = '';
	let pollInterval: ReturnType<typeof setInterval>;

	$: gameId = $page.params.id;
	$: currentUser = $authStore.user;

	onMount(async () => {
		// Wait for auth store to be initialized
		await auth.checkAuth();

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
			console.log('loadGame response:', {
				gameId,
				gameStatus: response.game.status,
				player1Id: response.game.player1_id,
				player2Id: response.game.player2_id,
				currentUserId: currentUser?.id.toString()
			});
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

				// Force a reactive update by creating a new object reference
				game = { ...game };
			}
		} catch (err) {
			error = (err as Error).message;
		}
	}

	async function joinGame() {
		if (!game || !currentUser) return;

		console.log('joinGame called with:', {
			gameId,
			currentUserId: currentUser.id.toString(),
			currentGameStatus: game.status
		});

		try {
			const response = await gameAPI.joinGame(gameId);
			console.log('joinGame response:', {
				newGameStatus: response.game.status,
				player1Id: response.game.player1_id,
				player2Id: response.game.player2_id
			});
			game = response.game;
			error = '';

			// Force a re-render by triggering a reactive update
			game = { ...game };
		} catch (err) {
			error = (err as Error).message;
			console.log('joinGame error:', error);
		}
	}

	function canJoinGame(): boolean {
		const canJoin =
			game?.status === 'waiting' &&
			game?.player2_id === null &&
			game?.player1_id !== currentUser?.id.toString();

		console.log('canJoinGame check:', {
			gameStatus: game?.status,
			player2Id: game?.player2_id,
			player1Id: game?.player1_id,
			currentUserId: currentUser?.id.toString(),
			canJoin
		});

		return canJoin;
	}

	function getOpponentName(): string {
		if (!game || !currentUser) return 'Unknown';

		if (game.player1_id === currentUser.id.toString()) {
			return game.player2_name || 'Waiting...';
		} else {
			return game.player1_name || 'Unknown Player';
		}
	}
</script>

<svelte:head>
	<title>Ultimate Tic-Tac-Toe - Game</title>
</svelte:head>

{#if loading}
	<div class="loading">
		<h2>Loading game...</h2>
	</div>
{:else if error}
	<div class="error">
		<h2>Error</h2>
		<p>{error}</p>
		<button on:click={() => goto('/dashboard')} class="btn btn-primary"> Back to Dashboard </button>
	</div>
{:else if game && currentUser}
	{#if canJoinGame()}
		<div class="join-game">
			<button on:click={() => goto('/dashboard')} class="btn btn-secondary">
				← Back to Dashboard
			</button>
			<h2>Join this game?</h2>
			<p>Player 1 is waiting for an opponent.</p>
			<button
				on:click={async () => {
					console.log('Button clicked!');
					try {
						const response = await fetch(`/api/games/${gameId}`, {
							method: 'PUT',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${localStorage.getItem('access_token')}`
							},
							body: JSON.stringify({ action: 'join' })
						});
						if (response.ok) {
							console.log('Join successful, reloading page...');
							window.location.reload();
						} else {
							console.log('Join failed:', response.status);
						}
					} catch (err) {
						console.log('Join error:', err);
					}
				}}
				class="btn btn-primary"
			>
				Join Game
			</button>
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

<style>
	/* Prevent scrolling and ensure perfect fit */
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		height: 100vh;
		width: 100vw;
	}

	.loading,
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		width: 100vw;
		color: white;
		text-align: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.loading h2,
	.error h2 {
		font-size: clamp(1.5rem, 4vw, 2.5rem);
		margin-bottom: 2vh;
	}

	.error p {
		font-size: clamp(1rem, 3vw, 1.2rem);
		margin-bottom: 3vh;
		max-width: 80vw;
	}

	.join-game {
		background: rgba(255, 255, 255, 0.95);
		padding: clamp(2rem, 5vw, 3rem);
		border-radius: 16px;
		text-align: center;
		width: min(90vw, 500px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.join-game h2 {
		margin: 0 0 2vh 0;
		color: #2c3e50;
		font-size: clamp(1.5rem, 4vw, 2rem);
	}

	.join-game p {
		margin: 0 0 3vh 0;
		color: #666;
		font-size: clamp(1rem, 3vw, 1.1rem);
	}

	.error-message {
		background: #e74c3c;
		color: white;
		padding: clamp(1rem, 3vw, 1.5rem);
		border-radius: 12px;
		text-align: center;
		width: min(90vw, 600px);
		position: fixed;
		top: 2vh;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		font-size: clamp(0.9rem, 2.5vw, 1rem);
	}

	.btn {
		padding: clamp(0.75rem, 2vw, 1.5rem) clamp(1.5rem, 4vw, 2rem);
		border: none;
		border-radius: 8px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
		font-size: clamp(0.9rem, 2.5vw, 1rem);
		margin: 0 1vh;
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

	/* Portrait layout adjustments */
	@media (orientation: portrait) {
		.join-game {
			width: min(95vw, 400px);
			padding: clamp(1.5rem, 4vw, 2rem);
		}
	}

	/* Landscape layout adjustments */
	@media (orientation: landscape) {
		.join-game {
			width: min(80vw, 500px);
		}
	}
</style>
