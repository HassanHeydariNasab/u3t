import { gql } from 'graphql-request';

export const LOGIN_MUTATION = gql`
	mutation Login($loginInput: LoginInput!) {
		login(loginInput: $loginInput) {
			access_token
			user {
				id
				email
				username
				createdAt
				updatedAt
			}
		}
	}
`;

export const REGISTER_MUTATION = gql`
	mutation Register($registerInput: RegisterInput!) {
		register(registerInput: $registerInput) {
			access_token
			user {
				id
				email
				username
				createdAt
				updatedAt
			}
		}
	}
`;

export const GET_PROFILE_QUERY = gql`
	query GetProfile {
		profile {
			id
			email
			username
			createdAt
			updatedAt
		}
	}
`;

export const GET_USERS_QUERY = gql`
	query GetUsers {
		users {
			id
			email
			username
			createdAt
			updatedAt
		}
	}
`;

export const GET_USER_QUERY = gql`
	query GetUser($id: String!) {
		user(id: $id) {
			id
			email
			username
			createdAt
			updatedAt
		}
	}
`;
