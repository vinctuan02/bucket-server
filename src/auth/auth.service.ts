// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from 'src/users/services/user.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	private resetTokens = new Map<string, string>();

	async register(dto: RegisterDto) {
		const hashed = await bcrypt.hash(dto.password, 10);
		const user = await this.usersService.create({
			...dto,
			password: hashed,
		});
		return { id: user.id, email: user.email, fullName: user.fullName };
	}

	async login(dto: LoginDto) {
		const user = await this.usersService.findByEmail(dto.email);
		if (!user) throw new UnauthorizedException('Invalid credentials');

		const isMatch = await bcrypt.compare(dto.password, user.password);
		if (!isMatch) throw new UnauthorizedException('Invalid credentials');

		const payload = { sub: user.id, email: user.email };
		return {
			accessToken: this.jwtService.sign(payload),
			user: { id: user.id, email: user.email, fullName: user.fullName },
		};
	}

	async validateUser(userId: string) {
		return this.usersService.findOne(userId);
	}

	async forgotPassword(email: string) {
		const user = await this.usersService.findByEmail(email);
		if (!user) return { message: 'If email exists, reset link sent' };

		const token = randomBytes(32).toString('hex');
		this.resetTokens.set(token, user.id);

		const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
		console.log('RESET LINK:', resetLink);

		return { message: 'If email exists, reset link sent' };
	}

	async resetPassword(token: string, newPassword: string) {
		const userId = this.resetTokens.get(token);
		if (!userId)
			throw new UnauthorizedException('Invalid or expired token');

		const hashed = await bcrypt.hash(newPassword, 10);
		await this.usersService.update(userId, { password: hashed });

		this.resetTokens.delete(token);
		return { message: 'Password reset successful' };
	}
}
