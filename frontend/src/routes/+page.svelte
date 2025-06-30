<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, auth } from '$lib/stores/auth';

	onMount(async () => {
		await auth.checkAuth();

		const unsubscribe = authStore.subscribe((state) => {
			if (!state.isLoading) {
				if (state.isAuthenticated) {
					goto('/dashboard');
				} else {
					goto('/login');
				}
			}
		});

		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Ultimate Tic Tac Toe</title>
</svelte:head>

<div class="loading">
	<h1>Ultimate Tic Tac Toe</h1>
	<p>Loading...</p>
</div>

<style>
	.loading {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	p {
		font-size: 1.2rem;
	}
</style>
