<script lang="ts">
	import { auth } from '../stores/auth';
	import { goto } from '$app/navigation';

	let email = '';
	let username = '';
	let password = '';
	let confirmPassword = '';
	let isLoading = false;
	let error = '';

	async function handleSubmit() {
		if (!email || !username || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters long';
			return;
		}

		isLoading = true;
		error = '';

		try {
			await auth.register({ email, username, password });
			goto('/dashboard');
		} catch (err: any) {
			error = err.message || 'Registration failed';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="register-form">
	<h2>Register</h2>

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
			<label for="username">Username</label>
			<input
				id="username"
				name="username"
				type="text"
				bind:value={username}
				placeholder="Enter your username"
				autocomplete="username"
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
				autocomplete="new-password"
				required
			/>
		</div>

		<div class="form-group">
			<label for="confirmPassword">Confirm Password</label>
			<input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				placeholder="Confirm your password"
				autocomplete="new-password"
				required
			/>
		</div>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<button type="submit" disabled={isLoading}>
			{isLoading ? 'Creating account...' : 'Register'}
		</button>
	</form>
</div>

<style>
	.register-form {
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
		background: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover:not(:disabled) {
		background: #218838;
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
