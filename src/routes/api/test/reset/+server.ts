import { json, type RequestHandler } from '@sveltejs/kit';
import { resetDatabase } from '$lib/server/database.js';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Only allow reset in test environment
		const nodeEnv = env.NODE_ENV || 'development';
		if (nodeEnv !== 'test') {
			return json({ error: 'Not allowed in this environment' }, { status: 403 });
		}

		// Reset the database (closes and recreates)
		resetDatabase();

		console.log('Database reset successfully');
		return json({ success: true });
	} catch (error) {
		console.error('Database reset error:', error);
		return json({ error: 'Failed to reset database' }, { status: 500 });
	}
};
