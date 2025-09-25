// src/auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import {
	ForgotPasswordDto,
	LoginDto,
	RegisterDto,
	ResetPasswordDto,
} from './dto/auth.dto';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(@Body() dto: RegisterDto) {
		await this.authService.register(dto);

		return new ResponseSuccess();
	}

	@Post('login')
	async login(@Body() dto: LoginDto) {
		const data = await this.authService.login(dto);
		return new ResponseSuccess({ data });
	}

	// @Post('refresh')
	// async refresh(@Body('refreshToken') refreshToken: string) {
	// 	return this.authService.refreshTokens(refreshToken);
	// }

	@Post('forgot-password')
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		await this.authService.forgotPassword(dto.email);
		return new ResponseSuccess();
	}

	@Post('reset-password')
	resetPassword(@Body() dto: ResetPasswordDto) {
		return this.authService.resetPassword(dto.token, dto.newPassword);
	}
}
