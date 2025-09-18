// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from 'src/users/services/user.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { TypeToken } from '../enum/auth.enum';
import { IAuthPayload, IAuthToken } from '../interface/auth.interface';
import { AuthValidateService } from './auth.validate.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly authValidateService: AuthValidateService,
	) {}

	private resetTokens = new Map<
		string,
		{ userId: string; expiredAt: number }
	>();

	async register(dto: RegisterDto) {
		const { email } = dto;
		await this.authValidateService.ensureEmailNotExists(email);

		const hashed = await bcrypt.hash(dto.password, 10);
		await this.usersService.create({
			...dto,
			password: hashed,
		});
	}

	async login(dto: LoginDto): Promise<IAuthToken> {
		const user = await this.authValidateService.validateLogin(dto);

		const payload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};
		return this.generateTokens(payload);
	}

	// refreshTokens(refreshToken: string) {
	// 	try {
	// 		const payload = this.jwtService.verify(refreshToken);

	// 		if (payload.type !== TypeToken.REFRESH) {
	// 			throw new UnauthorizedException('Invalid token type');
	// 		}

	// 		return this.generateTokens({
	// 			sub: payload.sub,
	// 			email: payload.email,
	// 			role: payload.role,
	// 		});
	// 	} catch {
	// 		throw new UnauthorizedException('Invalid or expired refresh token');
	// 	}
	// }

	async forgotPassword(email: string) {
		const user = await this.authValidateService.ensureEmailExists(email);

		const token = randomBytes(32).toString('hex');

		this.resetTokens.set(token, {
			userId: user.id,
			expiredAt: Date.now() + 15 * 60 * 1000,
		});

		// send to email
	}

	async resetPassword(token: string, newPassword: string) {
		const record = this.resetTokens.get(token);

		if (!record || Date.now() > record.expiredAt) {
			this.resetTokens.delete(token);
			throw new UnauthorizedException('Invalid or expired token');
		}

		const hashed = await bcrypt.hash(newPassword, 10);

		await this.usersService.update(record.userId, { password: hashed });

		this.resetTokens.delete(token);

		return { message: 'Password reset successful' };
	}

	private generateTokens(input: Omit<IAuthPayload, 'type'>) {
		const accessToken = this.generateAccessToken(input);
		const refreshToken = this.generateRefreshToken(input);

		return { accessToken, refreshToken };
	}

	private generateAccessToken(input: Omit<IAuthPayload, 'type'>) {
		return this.jwtService.sign(
			{
				...input,
				type: TypeToken.ACCESS,
			},
			{ expiresIn: '1d' },
		);
	}

	private generateRefreshToken(input: Omit<IAuthPayload, 'type'>) {
		return this.jwtService.sign(
			{ ...input, type: TypeToken.REFRESH },
			{ expiresIn: '7d' },
		);
	}
}
