import { json, type RequestHandler } from '@sveltejs/kit';
import { authService } from '$lib/server/services/auth.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password } = await request.json();

		// Basic validation
		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
		}

		const result = await authService.login({ email, password });

		return json(result);
	} catch (error) {
		console.error('Login error:', error);

		if (error instanceof Error) {
			if (error.message === 'Invalid credentials') {
				return json({ error: 'Invalid credentials' }, { status: 401 });
			}
		}

		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
