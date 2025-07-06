import { json, type RequestHandler } from '@sveltejs/kit';
import { authService } from '$lib/server/services/auth.js';
import { usersService } from '$lib/server/services/users.js';

export const GET: RequestHandler = async ({ request, params }) => {
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

		const { id } = params;
		if (!id) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		const targetUser = await usersService.findById(id);
		if (!targetUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json(usersService.removePassword(targetUser));
	} catch (error) {
		console.error('User error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
