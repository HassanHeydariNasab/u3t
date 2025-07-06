import { json, type RequestHandler } from '@sveltejs/kit';
import { authService } from '$lib/server/services/auth.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, username, password } = await request.json();

		// Basic validation
		if (!email || !username || !password) {
			return json({ error: 'Email, username, and password are required' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
		}

		if (username.length < 2) {
			return json({ error: 'Username must be at least 2 characters' }, { status: 400 });
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Please enter a valid email address' }, { status: 400 });
		}

		const result = await authService.register({ email, username, password });

		return json(result);
	} catch (error) {
		console.error('Register error:', error);

		if (error instanceof Error) {
			if (error.message === 'User with this email already exists') {
				return json({ error: 'User with this email already exists' }, { status: 409 });
			}
		}

		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
