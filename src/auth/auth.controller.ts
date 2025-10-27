// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
import { Public } from './decorator/auth.decorator';
import {
	ForgotPasswordDto,
	LoginDto,
	RefreshTokenDto,
	RegisterDto,
	ResetPasswordDto,
	VerifyAccountDto,
	VerifyResetCodeDto,
} from './dto/auth.dto';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	// google
	@Public()
	@Get('google')
	@UseGuards(AuthGuard('google'))
	async googleAuth() {}

	@Public()
	@Get('google/redirect')
	@UseGuards(AuthGuard('google'))
	async googleRedirect(@Req() req) {
		const data = await this.authService.validateGoogleUser(req.user);
		return new ResponseSuccess({ data });
	}

	//
	@Public()
	@Post('register')
	async register(@Body() dto: RegisterDto) {
		const data = await this.authService.register(dto);
		return new ResponseSuccess({ data });
	}

	@Public()
	@Post('verify-email')
	async verify(@Body() body: VerifyAccountDto) {
		const data = await this.authService.verifyAccount(body);
		return new ResponseSuccess({
			data,
			message: 'Account verified successfully',
		});
	}

	@Public()
	@Post('login')
	async login(@Body() dto: LoginDto) {
		const data = await this.authService.login(dto);
		return new ResponseSuccess({ data });
	}

	@Public()
	@Post('refresh-token')
	refreshTokens(@Body() dto: RefreshTokenDto) {
		const data = this.authService.refreshTokens(dto);
		return new ResponseSuccess({ data });
	}

	@Public()
	@Post('forgot-password')
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		await this.authService.forgotPassword(dto.email);
		return new ResponseSuccess({ message: 'Reset code sent to email' });
	}

	@Public()
	@Post('verify-reset-code')
	verifyResetCode(@Body() dto: VerifyResetCodeDto) {
		const data = this.authService.verifyResetCode(dto);
		return new ResponseSuccess({
			message: 'Code verified successfully',
			data,
		});
	}

	@Public()
	@Post('reset-password')
	async resetPassword(@Body() dto: ResetPasswordDto) {
		await this.authService.resetPassword(dto);
		return new ResponseSuccess({ message: 'Password reset successfully' });
	}
}
