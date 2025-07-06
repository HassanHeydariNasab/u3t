import { json, type RequestHandler } from '@sveltejs/kit';
import { authService } from '$lib/server/services/auth.js';
import { usersService } from '$lib/server/services/users.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');

		if (!authHeader) {
			return json({ error: 'Authorization header not found' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		if (!token) {
			return json({ error: 'Token not found' }, { status: 401 });
		}

		const user = await authService.verifyToken(token);
		if (!user) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const users = await usersService.findAll();
		return json(users);
	} catch (error) {
		console.error('Get users error:', error);
		return json({ error: 'Failed to get users' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		// Only allow clearing in test environment
		const nodeEnv = env.NODE_ENV || 'development';
		if (nodeEnv !== 'test') {
			return json({ error: 'Not allowed in this environment' }, { status: 403 });
		}

		const authHeader = request.headers.get('authorization');

		if (!authHeader) {
			return json({ error: 'Authorization header not found' }, { status: 401 });
		}

		const token = authHeader.replace('Bearer ', '');
		if (!token) {
			return json({ error: 'Token not found' }, { status: 401 });
		}

		const user = await authService.verifyToken(token);
		if (!user) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		// Clear all users for testing
		const success = await usersService.clearAll();
		return json({ success });
	} catch (error) {
		console.error('Clear users error:', error);
		return json({ error: 'Failed to clear users' }, { status: 500 });
	}
};
