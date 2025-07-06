import { browser } from '$app/environment';

export interface User {
	id: string;
	email: string;
	username: string;
	created_at: string;
	updated_at: string;
}

export interface AuthResponse {
	access_token: string;
	user: User;
}

export interface LoginInput {
	email: string;
	password: string;
}

export interface RegisterInput {
	email: string;
	username: string;
	password: string;
}

// Export aliases for backwards compatibility
export type LoginData = LoginInput;
export type RegisterData = RegisterInput;

class ApiClient {
	private baseUrl = '/api';

	private getAuthHeaders(): Record<string, string> {
		const token = browser ? localStorage.getItem('access_token') : null;
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		const headers = {
			'Content-Type': 'application/json',
			...this.getAuthHeaders(),
			...options.headers
		};

		const response = await fetch(url, {
			...options,
			headers
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Unknown error' }));

			// Handle authentication errors - but don't redirect for login endpoints
			if (response.status === 401 && !endpoint.includes('/auth/login')) {
				if (browser) {
					localStorage.removeItem('access_token');
					window.location.href = '/login';
				}
			}

			throw new Error(error.error || `HTTP ${response.status}`);
		}

		return response.json();
	}

	async login(input: LoginInput): Promise<AuthResponse> {
		const result = await this.request<AuthResponse>('/auth/login', {
			method: 'POST',
			body: JSON.stringify(input)
		});

		// Store token in localStorage
		if (browser) {
			localStorage.setItem('access_token', result.access_token);
		}

		return result;
	}

	async register(input: RegisterInput): Promise<AuthResponse> {
		const result = await this.request<AuthResponse>('/auth/register', {
			method: 'POST',
			body: JSON.stringify(input)
		});

		// Store token in localStorage
		if (browser) {
			localStorage.setItem('access_token', result.access_token);
		}

		return result;
	}

	async getProfile(): Promise<User> {
		return this.request<User>('/auth/profile');
	}

	async getUsers(): Promise<User[]> {
		return this.request<User[]>('/users');
	}

	async getUser(id: string): Promise<User> {
		return this.request<User>(`/users/${id}`);
	}

	async clearUsers(): Promise<{ success: boolean }> {
		return this.request<{ success: boolean }>('/users', {
			method: 'DELETE'
		});
	}
}

const apiClient = new ApiClient();

// Export the API client methods as before for backwards compatibility
export const authAPI = {
	login: apiClient.login.bind(apiClient),
	register: apiClient.register.bind(apiClient),
	getProfile: apiClient.getProfile.bind(apiClient)
};

export { apiClient };
