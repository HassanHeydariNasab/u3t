import { GraphQLClient } from 'graphql-request';
import { browser } from '$app/environment';

const endpoint = 'http://localhost:3000/graphql';

export const graphqlClient = new GraphQLClient(endpoint, {
	headers: {}
});

// Function to update headers with auth token
export function updateAuthHeaders() {
	const token = browser ? localStorage.getItem('access_token') : null;

	if (token) {
		graphqlClient.setHeader('authorization', `Bearer ${token}`);
	} else {
		graphqlClient.setHeader('authorization', '');
	}
}

// Initialize headers on client creation
if (browser) {
	updateAuthHeaders();
}
