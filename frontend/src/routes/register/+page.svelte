<script lang="ts">
  import RegisterForm from '$lib/components/RegisterForm.svelte';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    const unsubscribe = authStore.subscribe(state => {
      if (state.isAuthenticated) {
        goto('/dashboard');
      }
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  <title>Register - Ultimate Tic Tac Toe</title>
</svelte:head>

<div class="page">
  <h1>Ultimate Tic Tac Toe</h1>
  <RegisterForm />
  <p class="auth-link">
    Already have an account? <a href="/login">Login here</a>
  </p>
</div>

<style>
  .page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  h1 {
    color: white;
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2.5rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  .auth-link {
    text-align: center;
    margin-top: 1rem;
    color: white;
  }

  .auth-link a {
    color: #ffd700;
    text-decoration: none;
    font-weight: 500;
  }

  .auth-link a:hover {
    text-decoration: underline;
  }
</style> 