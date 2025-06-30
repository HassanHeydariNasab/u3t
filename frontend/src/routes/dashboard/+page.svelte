<script lang="ts">
  import { authStore, auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let user: any = null;

  onMount(() => {
    auth.checkAuth();
    
    const unsubscribe = authStore.subscribe(state => {
      if (!state.isLoading && !state.isAuthenticated) {
        goto('/login');
      } else if (state.isAuthenticated) {
        user = state.user;
      }
    });

    return unsubscribe;
  });

  function handleLogout() {
    auth.logout();
    goto('/login');
  }
</script>

<svelte:head>
  <title>Dashboard - Ultimate Tic Tac Toe</title>
</svelte:head>

{#if user}
  <div class="dashboard">
    <header>
      <h1>Welcome, {user.username}!</h1>
      <button class="logout-btn" on:click={handleLogout}>Logout</button>
    </header>

    <main>
      <div class="welcome-card">
        <h2>Ultimate Tic Tac Toe</h2>
        <p>Ready to play the ultimate version of tic-tac-toe?</p>
        <div class="user-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {user.username}</p>
        </div>
      </div>

      <div class="game-section">
        <h3>Game Options</h3>
        <div class="game-buttons">
          <button class="game-btn">Start New Game</button>
          <button class="game-btn">Join Game</button>
          <button class="game-btn">View Game History</button>
        </div>
      </div>
    </main>
  </div>
{:else}
  <div class="loading">
    <p>Loading...</p>
  </div>
{/if}

<style>
  .dashboard {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem 2rem;
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }

  h1 {
    color: white;
    margin: 0;
    font-size: 2rem;
  }

  .logout-btn {
    padding: 0.5rem 1rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .logout-btn:hover {
    background: #c82333;
  }

  main {
    max-width: 800px;
    margin: 0 auto;
  }

  .welcome-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .welcome-card h2 {
    color: #333;
    margin-bottom: 1rem;
    text-align: center;
  }

  .welcome-card p {
    color: #666;
    text-align: center;
    margin-bottom: 1rem;
  }

  .user-info {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    margin-top: 1rem;
  }

  .user-info p {
    margin: 0.5rem 0;
    color: #333;
    text-align: left;
  }

  .game-section {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .game-section h3 {
    color: #333;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .game-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .game-btn {
    padding: 1rem 2rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .game-btn:hover {
    background: #0056b3;
  }

  .loading {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading p {
    color: white;
    font-size: 1.5rem;
  }
</style> 