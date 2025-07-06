<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// For 404 errors, redirect to login after a short delay
		if ($page.status === 404) {
			setTimeout(() => {
				goto('/login');
			}, 1000);
		}
	});
</script>

<div class="error-page">
	<h1>Oops! Something went wrong</h1>

	{#if $page.status === 404}
		<p>Page not found. Redirecting to login...</p>
	{:else}
		<p>Error {$page.status}: {$page.error?.message || 'Unknown error'}</p>
	{/if}

	<a href="/login">Go to Login</a>
</div>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		text-align: center;
		color: #333;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.1rem;
		margin-bottom: 2rem;
	}

	a {
		color: #007bff;
		text-decoration: none;
		font-size: 1.1rem;
		padding: 0.5rem 1rem;
		border: 1px solid #007bff;
		border-radius: 4px;
		transition: all 0.2s;
	}

	a:hover {
		background: #007bff;
		color: white;
	}
</style>
