<script lang="ts">
	import type { Game, GameMove } from '../api';

	export let game: Game;
	export let currentUserId: string;
	export let onMove: (move: GameMove) => void;

	$: playerSymbol = game.player1_id === currentUserId ? 'X' : 'O';
	$: isMyTurn = game.current_player === playerSymbol;
	$: canPlay = game.status === 'playing' && isMyTurn;

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
		}

		if (canPlay && smallBoard.winner === null && cell === null) {
			// Check if this board is playable
			if (
				game.board.activeBoard === null ||
				(game.board.activeBoard.row === boardRow && game.board.activeBoard.col === boardCol)
			) {
				classes += ' cell-playable';
			}
		}

		return classes;
	}

	function getSmallBoardClass(boardRow: number, boardCol: number) {
		const smallBoard = game.board.smallBoards[boardRow][boardCol];
		let classes = 'small-board';

		if (smallBoard.winner) {
			classes += ` small-board-won small-board-${smallBoard.winner === 'draw' ? 'draw' : smallBoard.winner.toLowerCase()}`;
		}

		if (
			game.board.activeBoard &&
			game.board.activeBoard.row === boardRow &&
			game.board.activeBoard.col === boardCol
		) {
			classes += ' small-board-active';
		}

		return classes;
	}

	function getGameStatus() {
		if (game.status === 'waiting') {
			return 'Waiting for opponent...';
		}
		if (game.status === 'finished') {
			if (game.winner === 'draw') {
				return "It's a draw!";
			}
			const winnerName = game.winner === 'X' ? 'Player 1' : 'Player 2';
			return `${winnerName} wins!`;
		}
		if (isMyTurn) {
			return 'Your turn';
		}
		return "Opponent's turn";
	}
</script>

<div class="game-container">
	<div class="game-header">
		<h2>Ultimate Tic-Tac-Toe</h2>
		<div class="game-info">
			<div class="player-info">
				You are: <span class="player-symbol player-{playerSymbol.toLowerCase()}"
					>{playerSymbol}</span
				>
			</div>
			<div class="game-status" class:my-turn={isMyTurn} class:finished={game.status === 'finished'}>
				{getGameStatus()}
			</div>
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
										on:click={() => handleCellClick(boardRow, boardCol, cellRow, cellCol)}
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
	.game-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
	}

	.game-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.game-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
	}

	.player-info {
		font-weight: bold;
	}

	.player-symbol {
		font-size: 1.2em;
		font-weight: bold;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	.player-x {
		color: #e74c3c;
		background: #fdf2f2;
	}

	.player-o {
		color: #3498db;
		background: #f2f8fd;
	}

	.game-status {
		font-weight: bold;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		background: #ecf0f1;
	}

	.game-status.my-turn {
		background: #d5f4e6;
		color: #27ae60;
	}

	.game-status.finished {
		background: #fef9e7;
		color: #f39c12;
	}

	.game-board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		background: #2c3e50;
		padding: 8px;
		border-radius: 12px;
		aspect-ratio: 1;
	}

	.small-board {
		background: white;
		border-radius: 8px;
		padding: 4px;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.small-board-active {
		background: #fff3cd;
		box-shadow: 0 0 0 3px #ffc107;
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
		gap: 2px;
		width: 100%;
		height: 100%;
	}

	.cell {
		background: #ecf0f1;
		border: none;
		border-radius: 4px;
		font-size: 1.2rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cell:disabled {
		cursor: not-allowed;
	}

	.cell-playable {
		background: #e8f5e8;
		cursor: pointer;
	}

	.cell-playable:hover {
		background: #d4edda;
		transform: scale(1.05);
	}

	.cell-x {
		background: #fdf2f2;
		color: #e74c3c;
	}

	.cell-o {
		background: #f2f8fd;
		color: #3498db;
	}

	.board-winner {
		font-size: 4rem;
		font-weight: bold;
		color: #2c3e50;
		text-align: center;
	}

	@media (max-width: 768px) {
		.game-container {
			padding: 0.5rem;
		}

		.game-info {
			flex-direction: column;
			gap: 1rem;
		}

		.cell {
			font-size: 1rem;
		}

		.board-winner {
			font-size: 2.5rem;
		}
	}
</style>
