export interface User {
	id: string;
	email: string;
	username: string;
	password: string;
	created_at: string;
	updated_at: string;
}

export interface UserWithoutPassword {
	id: string;
	email: string;
	username: string;
	created_at: string;
	updated_at: string;
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

export interface AuthResponse {
	access_token: string;
	user: UserWithoutPassword;
}
