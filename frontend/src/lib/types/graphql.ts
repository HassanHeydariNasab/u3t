export interface User {
	id: string;
	email: string;
	username: string;
	createdAt: string;
	updatedAt: string;
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

// GraphQL Mutation Response Types
export interface LoginMutationResponse {
	login: AuthResponse;
}

export interface RegisterMutationResponse {
	register: AuthResponse;
}

// GraphQL Query Response Types
export interface GetProfileQueryResponse {
	profile: User;
}

export interface GetUsersQueryResponse {
	users: User[];
}

export interface GetUserQueryResponse {
	user: User | null;
}
