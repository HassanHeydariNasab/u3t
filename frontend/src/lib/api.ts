import { graphqlClient, updateAuthHeaders } from './graphql/client';
import { LOGIN_MUTATION, REGISTER_MUTATION, GET_PROFILE_QUERY } from './graphql/queries';
import { browser } from '$app/environment';
import type {
	User,
	AuthResponse,
	LoginInput,
	RegisterInput,
	LoginMutationResponse,
	RegisterMutationResponse,
	GetProfileQueryResponse
} from './types/graphql';

export {
	type User,
	type AuthResponse,
	type LoginInput as LoginData,
	type RegisterInput as RegisterData
};

// Error handler for GraphQL requests
function handleGraphQLError(error: any) {
	console.error('GraphQL Error:', error);

	// Handle GraphQL errors from our backend
	if (error.response?.errors) {
		const graphqlError = error.response.errors[0];

		// Handle authentication errors
		if (
			graphqlError.message.includes('Unauthorized') ||
			graphqlError.message.includes('Authorization header not found') ||
			graphqlError.message.includes('Invalid token') ||
			graphqlError.message.includes('User not found')
		) {
			if (browser) {
				localStorage.removeItem('access_token');
				window.location.href = '/login';
			}
		}

		throw new Error(graphqlError.message);
	}

	// Handle network errors
	if (error.message) {
		throw new Error(error.message);
	}

	throw new Error('An unexpected error occurred');
}

export const authAPI = {
	login: async (loginInput: LoginInput): Promise<AuthResponse> => {
		try {
			const data = await graphqlClient.request<LoginMutationResponse>(LOGIN_MUTATION, {
				loginInput
			});

			if (!data?.login) {
				throw new Error('Login failed');
			}

			// Update headers with the new token
			if (browser) {
				localStorage.setItem('access_token', data.login.access_token);
				updateAuthHeaders();
			}

			return data.login;
		} catch (error) {
			handleGraphQLError(error);
			throw error;
		}
	},

	register: async (registerInput: RegisterInput): Promise<AuthResponse> => {
		try {
			const data = await graphqlClient.request<RegisterMutationResponse>(REGISTER_MUTATION, {
				registerInput
			});

			if (!data?.register) {
				throw new Error('Registration failed');
			}

			// Update headers with the new token
			if (browser) {
				localStorage.setItem('access_token', data.register.access_token);
				updateAuthHeaders();
			}

			return data.register;
		} catch (error) {
			handleGraphQLError(error);
			throw error;
		}
	},

	getProfile: async (): Promise<User> => {
		try {
			// Ensure we have the latest auth headers
			updateAuthHeaders();

			const data = await graphqlClient.request<GetProfileQueryResponse>(GET_PROFILE_QUERY);

			if (!data?.profile) {
				throw new Error('Failed to get profile');
			}

			return data.profile;
		} catch (error) {
			handleGraphQLError(error);
			throw error;
		}
	}
};
