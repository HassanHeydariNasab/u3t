<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '../stores/auth';

	let email = '';
	let password = '';
	let isLoading = false;
	let error = '';

	async function handleSubmit() {
		console.log('handleSubmit called');
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		isLoading = true;
		error = '';

		try {
			await auth.login({ email, password });
			goto('/dashboard');
		} catch (err: any) {
			error = err.message || 'Login failed';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="login-form">
	<h2>Login</h2>

	<form on:submit|preventDefault={handleSubmit} autocomplete="on" novalidate>
		<div class="form-group">
			<label for="email">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				bind:value={email}
				placeholder="Enter your email"
				autocomplete="email"
				required
			/>
		</div>

		<div class="form-group">
			<label for="password">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				bind:value={password}
				placeholder="Enter your password"
				autocomplete="current-password"
				required
			/>
		</div>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<button type="submit" disabled={isLoading}>
			{isLoading ? 'Logging in...' : 'Login'}
		</button>
	</form>
</div>

<style>
	.login-form {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		background: white;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	h2 {
		text-align: center;
		margin-bottom: 2rem;
		color: #333;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #555;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	button {
		width: 100%;
		padding: 0.75rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover:not(:disabled) {
		background: #0056b3;
	}

	button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.error {
		color: #dc3545;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		text-align: center;
	}
</style>
