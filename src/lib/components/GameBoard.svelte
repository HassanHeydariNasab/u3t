<script lang="ts">
	import type { Game, GameMove } from '../api';

	const { game, currentUserId, onMove } = $props<{
		game: Game;
		currentUserId: string;
		onMove: (move: GameMove) => void;
	}>();

	const playerSymbol = $derived(game.player1_id === currentUserId ? 'X' : 'O');
	const isMyTurn = $derived(game.current_player === playerSymbol);
	const canPlay = $derived(game.status === 'playing' && isMyTurn);

	const currentPlayerName = $derived(
		game.current_player === 'X' ? game.player1_name : game.player2_name
	);

	function handleCellClick(boardRow: number, boardCol: number, cellRow: number, cellCol: number) {
		if (!canPlay) return;

		const smallBoard = game.board.smallBoards[boardRow][boardCol];

		// Check if this move is valid
		if (smallBoard.winner !== null) return; // Board already won
		if (smallBoard.cells[cellRow][cellCol] !== null) return; // Cell occupied

		// Check if this is the active board (or any board is allowed)
		if (game.board.activeBoard !== null) {
			if (game.board.activeBoard.row !== boardRow || game.board.activeBoard.col !== boardCol) {
				return; // Must play in active board
			}
		}

		onMove({ boardRow, boardCol, cellRow, cellCol });
	}

	function getCellClass(boardRow: number, boardCol: number, cellRow: number, cellCol: number) {
		const smallBoard = game.board.smallBoards[boardRow][boardCol];
		const cell = smallBoard.cells[cellRow][cellCol];

		let classes = 'cell';

		if (cell) {
			classes += ` cell-${cell.toLowerCase()}`;
		} else {
			// Check if this cell is playable
			const isPlayableBoard =
				(game.board.activeBoard &&
					game.board.activeBoard.row === boardRow &&
					game.board.activeBoard.col === boardCol) ||
				(game.board.activeBoard === null && canPlay);

			if (isPlayableBoard && canPlay) {
				classes += ' cell-playable';
			}
		}

		// Highlight the last move
		if (
			game.board.lastMove &&
			game.board.lastMove.boardRow === boardRow &&
			game.board.lastMove.boardCol === boardCol &&
			game.board.lastMove.cellRow === cellRow &&
			game.board.lastMove.cellCol === cellCol
		) {
			classes += ' cell-last-move';
		}

		return classes;
	}

	function getSmallBoardClass(boardRow: number, boardCol: number) {
		const smallBoard = game.board.smallBoards[boardRow][boardCol];
		let classes = 'small-board';

		// Handle won boards
		if (smallBoard.winner) {
			classes += ` small-board-won small-board-${smallBoard.winner === 'draw' ? 'draw' : smallBoard.winner.toLowerCase()}`;
			return classes;
		}

		// Highlight the active board (where the player must play)
		if (
			game.board.activeBoard &&
			game.board.activeBoard.row === boardRow &&
			game.board.activeBoard.col === boardCol
		) {
			classes += ' small-board-active';
		}
		// Highlight all playable boards when no specific active board
		else if (game.board.activeBoard === null && canPlay) {
			classes += ' small-board-playable';
		}

		return classes;
	}

	function getGameStatus() {
		if (game.status === 'waiting') {
			return 'Waiting for opponent to join...';
		}
		if (game.status === 'finished') {
			if (game.winner === 'draw') {
				return "It's a draw!";
			}
			const winnerName = game.winner === 'X' ? game.player1_name : game.player2_name;
			return `${winnerName} wins!`;
		}
		if (isMyTurn) {
			return 'Your turn';
		}
		return `${currentPlayerName}'s turn`;
	}
</script>

<div class="game-container">
	<div class="info-panel">
		<button class="back-btn" onclick={() => (window.location.href = '/dashboard')}>
			← Back to Dashboard
		</button>

		<div class="players-info">
			<div class="player-card" class:current-player={game.current_player === 'X'}>
				<span class="player-symbol player-x">X</span>
				<span class="player-name">{game.player1_name}</span>
				{#if game.player1_id === currentUserId}
					<span class="you-indicator">(You)</span>
				{/if}
			</div>
			<div class="vs">vs</div>
			<div class="player-card" class:current-player={game.current_player === 'O'}>
				<span class="player-symbol player-o">O</span>
				<span class="player-name">{game.player2_name}</span>
				{#if game.player2_id === currentUserId}
					<span class="you-indicator">(You)</span>
				{/if}
			</div>
		</div>

		<div class="game-status" class:my-turn={isMyTurn} class:finished={game.status === 'finished'}>
			{getGameStatus()}
		</div>
	</div>

	<div class="game-board">
		{#each Array(3) as _, boardRow}
			{#each Array(3) as _, boardCol}
				<div class={getSmallBoardClass(boardRow, boardCol)}>
					{#if game.board.smallBoards[boardRow][boardCol].winner}
						<div class="board-winner">
							{game.board.smallBoards[boardRow][boardCol].winner === 'draw'
								? '='
								: game.board.smallBoards[boardRow][boardCol].winner}
						</div>
					{:else}
						<div class="small-board-grid">
							{#each Array(3) as _, cellRow}
								{#each Array(3) as _, cellCol}
									<button
										class={getCellClass(boardRow, boardCol, cellRow, cellCol)}
										onclick={() => handleCellClick(boardRow, boardCol, cellRow, cellCol)}
										disabled={!canPlay}
									>
										{game.board.smallBoards[boardRow][boardCol].cells[cellRow][cellCol] || ''}
									</button>
								{/each}
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
</div>

<style>
	/* Prevent scrolling and ensure perfect fit */
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		height: 100vh;
		width: 100vw;
	}

	.game-container {
		height: 100vh;
		width: 100vw;
		display: flex;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1vh;
		box-sizing: border-box;
	}

	.info-panel {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 12px;
		padding: clamp(1rem, 3vw, 2rem);
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 2vw, 1.5rem);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	.back-btn {
		background: rgba(103, 126, 234, 0.1);
		color: #667eea;
		border: 1px solid rgba(103, 126, 234, 0.3);
		padding: clamp(0.5rem, 1.5vw, 1rem) clamp(1rem, 2.5vw, 1.5rem);
		border-radius: 8px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		font-size: clamp(0.8rem, 2.5vw, 1rem);
	}

	.back-btn:hover {
		background: rgba(103, 126, 234, 0.2);
		transform: scale(1.05);
	}

	.players-info {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: clamp(1rem, 3vw, 2rem);
	}

	.player-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5vh;
		padding: clamp(0.5rem, 2vw, 1rem);
		border-radius: 8px;
		background: #f8f9fa;
		transition: all 0.3s ease;
		min-width: clamp(80px, 15vw, 120px);
		border: 2px solid transparent;
	}

	.player-card.current-player {
		background: #e3f2fd;
		border-color: #2196f3;
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
	}

	.vs {
		font-weight: bold;
		color: #2c3e50;
		font-size: clamp(1rem, 3vw, 1.2rem);
	}

	.player-symbol {
		font-size: clamp(1.2rem, 4vw, 1.5rem);
		font-weight: bold;
		padding: clamp(0.3rem, 1.5vw, 0.5rem);
		border-radius: 50%;
		width: clamp(2.5rem, 8vw, 3rem);
		height: clamp(2.5rem, 8vw, 3rem);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.player-x {
		color: #e74c3c;
		background: #fdf2f2;
	}

	.player-o {
		color: #3498db;
		background: #f2f8fd;
	}

	.player-name {
		font-weight: bold;
		color: #2c3e50;
		font-size: clamp(0.8rem, 2.5vw, 1rem);
		text-align: center;
	}

	.game-status {
		font-weight: bold;
		font-size: clamp(1rem, 3vw, 1.1rem);
		padding: clamp(0.5rem, 1.5vw, 1rem);
		border-radius: 8px;
		background: #ecf0f1;
		text-align: center;
		transition: all 0.3s ease;
	}

	.game-status.my-turn {
		background: #d5f4e6;
		color: #27ae60;
		box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
	}

	.game-status.finished {
		background: #fef9e7;
		color: #f39c12;
		box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
	}

	.last-move-info {
		font-size: clamp(0.7rem, 2vw, 0.8rem);
		color: #95a5a6;
		font-style: italic;
		text-align: center;
		line-height: 1.4;
		padding: clamp(0.5rem, 1.5vw, 1rem);
		background: #f8f9fa;
		border-radius: 8px;
	}

	.you-indicator {
		font-size: clamp(0.6rem, 2vw, 0.8rem);
		color: #27ae60;
		font-weight: bold;
		background: #d4edda;
		padding: 0.2rem 0.5rem;
		border-radius: 12px;
		margin-top: 0.2rem;
	}

	.game-board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(4px, 1vw, 8px);
		background: #2c3e50;
		padding: clamp(4px, 1vw, 8px);
		border-radius: 12px;
		aspect-ratio: 1;
		flex-shrink: 0;
		height: fit-content;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.small-board {
		background: white;
		border-radius: 8px;
		padding: clamp(2px, 0.5vw, 4px);
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		aspect-ratio: 1;
		min-width: 0;
		min-height: 0;
	}

	/* Active board - where player must play */
	.small-board-active {
		background: #fff3cd;
		box-shadow: 0 0 0 3px #ffc107;
		transform: scale(1.02);
	}

	/* Playable boards - when player can choose any board */
	.small-board-playable {
		background: #e8f5e8;
		box-shadow: 0 0 0 2px #27ae60;
		transform: scale(1.01);
	}

	.small-board-won {
		background: #f8f9fa;
	}

	.small-board-x {
		background: #fdf2f2;
	}

	.small-board-o {
		background: #f2f8fd;
	}

	.small-board-draw {
		background: #f8f9fa;
	}

	.small-board-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(1px, 0.3vw, 2px);
		width: 100%;
		height: 100%;
	}

	.cell {
		background: #ecf0f1;
		border: none;
		border-radius: 4px;
		font-size: clamp(0.8rem, 3vw, 1.2rem);
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		min-height: 0;
	}

	.cell:disabled {
		cursor: not-allowed;
	}

	/* Highlight the last move made */
	.cell-last-move {
		background: #f3e5f5;
		box-shadow: 0 0 0 2px #9c27b0;
	}

	.cell-x {
		background: #fdf2f2;
		color: #e74c3c;
	}

	.cell-o {
		background: #f2f8fd;
		color: #3498db;
	}

	/* Highlight playable cells */
	.cell-playable {
		background: #e8f5e8;
		box-shadow: 0 0 0 2px #27ae60;
		transform: scale(1.05);
	}

	.cell-playable:hover {
		background: #d4edda;
		transform: scale(1.1);
	}

	.board-winner {
		font-size: clamp(2rem, 8vw, 4rem);
		font-weight: bold;
		color: #2c3e50;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	/* Portrait layout (mobile/tablet portrait) */
	@media (orientation: portrait) {
		.game-container {
			flex-direction: column;
			align-items: center;
			justify-content: flex-start;
			gap: 2vh;
		}

		.info-panel {
			width: min(95vw, 500px);
			order: 1;
		}

		.game-board {
			width: min(90vw, 90vh);
			height: min(90vw, 90vh);
			order: 2;
		}
	}

	/* Landscape layout (desktop/tablet landscape) */
	@media (orientation: landscape) {
		.game-container {
			flex-direction: row;
			align-items: center;
			justify-content: center;
			gap: 3vw;
		}

		.info-panel {
			width: clamp(280px, 25vw, 350px);
			height: fit-content;
			max-height: 90vh;
			overflow-y: auto;
		}

		.game-board {
			width: min(60vh, 60vw);
			height: min(60vh, 60vw);
		}
	}

	/* Extra small screens */
	@media (max-height: 500px) and (orientation: landscape) {
		.info-panel {
			padding: clamp(0.5rem, 2vw, 1rem);
			gap: clamp(0.5rem, 1.5vw, 1rem);
		}

		.players-info {
			gap: clamp(0.5rem, 2vw, 1rem);
		}

		.player-card {
			padding: clamp(0.3rem, 1.5vw, 0.5rem);
			min-width: clamp(60px, 12vw, 80px);
		}

		.player-symbol {
			width: clamp(2rem, 6vw, 2.5rem);
			height: clamp(2rem, 6vw, 2.5rem);
			font-size: clamp(1rem, 3vw, 1.2rem);
		}

		.player-name {
			font-size: clamp(0.7rem, 2vw, 0.8rem);
		}
	}

	/* Very small screens - adjust info panel */
	@media (max-width: 400px) and (orientation: portrait) {
		.info-panel {
			padding: clamp(0.5rem, 2vw, 1rem);
			gap: clamp(0.5rem, 1.5vw, 1rem);
		}

		.players-info {
			gap: clamp(0.5rem, 2vw, 1rem);
		}

		.player-card {
			padding: clamp(0.3rem, 1.5vw, 0.5rem);
			min-width: clamp(60px, 12vw, 80px);
		}
	}
</style>
