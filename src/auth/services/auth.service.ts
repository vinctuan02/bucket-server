// src/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { generateSixDigitOtp } from 'src/common/util/common.util';
import { NotificationService } from 'src/notification/services/notification.service';
import { UsersService } from 'src/users/services/user.service';
import {
	LoginDto,
	RefreshTokenDto,
	RegisterDto,
	ResetPasswordDto,
	VerifyAccountDto,
} from '../dto/auth.dto';
import { TypeToken } from '../enum/auth.enum';
import {
	IAuthPayload,
	IAuthToken,
	IVerificationCode,
} from '../interface/auth.interface';
import { AuthValidateService } from './auth.validate.service';

@Injectable()
export class AuthService {
	private logger = new Logger(AuthService.name);
	private verificationCodes = new Map<string, IVerificationCode>();

	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly authValidateService: AuthValidateService,
		private readonly notificationService: NotificationService,
	) {}

	// google
	async validateGoogleUser(googleUser: any) {
		const { email, name, providerId, avatar } = googleUser;

		let user = await this.usersService.findByEmail(email);

		if (!user) {
			user = await this.usersService.create({
				name,
				email,
				password: null,
				isActive: true,
				provider: 'google',
				providerId,
				avatar,
			});
		}

		return this.generateTokens({ sub: user.id, email: user.email });
	}

	async register(dto: RegisterDto) {
		const newUser = await this.usersService.create(dto);
		const { code } = this.createVerificationCode(newUser.id);

		this.notificationService
			.sendEmailAccountVerification({
				recipientId: newUser.id,
				code,
			})
			.catch((err) => {
				this.logger.error('Error sending verification email:', err);
			});

		return newUser;
	}

	async verifyAccount(dto: VerifyAccountDto) {
		const { userId, code } = dto;

		const verification = this.getVerificationCode(userId);

		if (!verification || verification.code !== code) {
			throw new ResponseError({ message: 'Invalid verification code' });
		}

		const user = await this.usersService.findOne(userId);

		if (user.isActive) {
			this.verificationCodes.delete(userId);
			throw new ResponseError({ message: 'Account already verified' });
		}

		const result = await this.usersService.activeAccount(userId);

		this.verificationCodes.delete(userId);
		return result;
	}

	async login(dto: LoginDto): Promise<IAuthToken> {
		const user = await this.authValidateService.validateLogin(dto);

		const roles = user.userRoles.map((ul) => ul.role.name);
		const permissions = Array.from(
			new Set(
				user.userRoles.flatMap((ul) =>
					ul.role.rolePermissions.map(
						(rp) =>
							rp.permission.action + ':' + rp.permission.resource,
					),
				),
			),
		);

		const accessToken = this.generateAccessToken({
			sub: user.id,
			email: user.email,
			roles,
			permissions,
		});
		const refreshToken = this.generateRefreshToken({
			sub: user.id,
			email: user.email,
		});

		return { accessToken, refreshToken };
	}

	refreshTokens(dto: RefreshTokenDto) {
		const payload = this.jwtService.verify(dto.refreshToken);

		if (payload.type !== TypeToken.REFRESH) {
			throw new ResponseError({ message: 'Invalid token type' });
		}

		return this.generateTokens({
			sub: payload.sub,
			email: payload.email,
		});
	}

	async forgotPassword(email: string) {
		const user = await this.authValidateService.ensureEmailExists(email);

		if (!user.isActive) {
			throw new ResponseError({ message: 'Account is not active' });
		}

		const { code } = this.createVerificationCode(user.id);

		this.notificationService
			.sendEmailResetPassword({
				recipientId: user.id,
				code,
			})
			.catch((err) => {
				this.logger.error('Error sending reset password email:', err);
			});
	}

	verifyResetCode({ userId, code }: { userId: string; code: string }) {
		const verification = this.getVerificationCode(userId);

		if (!verification || verification.code !== code) {
			throw new ResponseError({ message: 'Invalid verification code' });
		}

		this.verificationCodes.delete(userId);

		return this.genarateResetToken(userId);
	}

	async resetPassword(dto: ResetPasswordDto) {
		const { token, newPassword } = dto;

		const { userId } = this.jwtService.verify(token);
		const hashed = await bcrypt.hash(newPassword, 10);

		const user = await this.usersService.update(userId, {
			password: hashed,
		});

		return user;
	}

	async getProfile(userId: string) {
		const user = await this.usersService.findOne(userId);
		return user;
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

	private genarateResetToken(userId: string) {
		return this.jwtService.sign(
			{ userId, type: TypeToken.RESET_PASSWORD },
			{ expiresIn: '15m' },
		);
	}

	// code verification
	private createVerificationCode(userId: string) {
		const verification: IVerificationCode = {
			userId,
			code: generateSixDigitOtp(),
			expiredAt: Date.now() + 15 * 60 * 1000,
		};

		this.verificationCodes.set(userId, verification);

		return verification;
	}

	private getVerificationCode(userId: string) {
		return this.verificationCodes.get(userId);
	}
}
