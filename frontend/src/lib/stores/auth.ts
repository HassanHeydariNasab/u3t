import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { authAPI, type User, type LoginData, type RegisterData } from '../api';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true
};

export const authStore = writable<AuthState>(initialState);

export const auth = {
	login: async (loginData: LoginData) => {
		authStore.update((state) => ({ ...state, isLoading: true }));
		try {
			const response = await authAPI.login(loginData);
			if (browser) {
				localStorage.setItem('access_token', response.access_token);
			}
			authStore.set({
				user: response.user,
				isAuthenticated: true,
				isLoading: false
			});
			return response;
		} catch (error: any) {
			authStore.update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	},

	register: async (registerData: RegisterData) => {
		authStore.update((state) => ({ ...state, isLoading: true }));
		try {
			const response = await authAPI.register(registerData);
			if (browser) {
				localStorage.setItem('access_token', response.access_token);
			}
			authStore.set({
				user: response.user,
				isAuthenticated: true,
				isLoading: false
			});
			return response;
		} catch (error: any) {
			authStore.update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	},

	logout: () => {
		if (browser) {
			localStorage.removeItem('access_token');
		}
		authStore.set({
			user: null,
			isAuthenticated: false,
			isLoading: false
		});
	},

	checkAuth: async () => {
		if (!browser) return;

		const token = localStorage.getItem('access_token');
		if (!token) {
			authStore.set({
				user: null,
				isAuthenticated: false,
				isLoading: false
			});
			return;
		}

		try {
			const user = await authAPI.getProfile();
			authStore.set({
				user,
				isAuthenticated: true,
				isLoading: false
			});
		} catch (error) {
			localStorage.removeItem('access_token');
			authStore.set({
				user: null,
				isAuthenticated: false,
				isLoading: false
			});
		}
	}
};
