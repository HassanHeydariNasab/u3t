import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { usersService } from './users.js';
import type { LoginInput, RegisterInput, AuthResponse, User } from '../models/user.js';

export class AuthService {
	private jwtSecret = env.JWT_SECRET || 'fallback-secret-key';

	async validateUser(email: string, password: string): Promise<User | null> {
		const user = await usersService.findByEmail(email);
		if (user && (await usersService.validatePassword(user, password))) {
			return user;
		}
		return null;
	}

	async login(loginInput: LoginInput): Promise<AuthResponse> {
		const user = await this.validateUser(loginInput.email, loginInput.password);
		if (!user) {
			throw new Error('Invalid credentials');
		}

		const payload = { email: user.email, sub: user.id };
		const access_token = jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });

		return {
			access_token,
			user: usersService.removePassword(user)
		};
	}

	async register(registerInput: RegisterInput): Promise<AuthResponse> {
		const existingUser = await usersService.findByEmail(registerInput.email);
		if (existingUser) {
			throw new Error('User with this email already exists');
		}

		const user = await usersService.create(
			registerInput.email,
			registerInput.username,
			registerInput.password
		);

		const payload = { email: user.email, sub: user.id };
		const access_token = jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });

		return {
			access_token,
			user: usersService.removePassword(user)
		};
	}

	async verifyToken(token: string): Promise<User | null> {
		try {
			const payload = jwt.verify(token, this.jwtSecret) as { sub: string; email: string };
			const user = await usersService.findById(payload.sub);
			return user;
		} catch (error) {
			return null;
		}
	}

	async clearUsers(): Promise<boolean> {
		try {
			await usersService.clearAll();
			return true;
		} catch (error) {
			return false;
		}
	}
}

export const authService = new AuthService();
