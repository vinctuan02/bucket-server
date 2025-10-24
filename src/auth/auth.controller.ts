// src/auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ResponseSuccess } from 'src/common/dto/common.response-dto';
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

	@Post('register')
	async register(@Body() dto: RegisterDto) {
		const data = await this.authService.register(dto);
		return new ResponseSuccess({ data });
	}

	@Post('verify-email')
	async verify(@Body() body: VerifyAccountDto) {
		const data = await this.authService.verifyAccount(body);
		return new ResponseSuccess({
			data,
			message: 'Account verified successfully',
		});
	}

	@Post('login')
	async login(@Body() dto: LoginDto) {
		const data = await this.authService.login(dto);
		return new ResponseSuccess({ data });
	}

	@Post('refresh-token')
	async refreshTokens(@Body() dto: RefreshTokenDto) {
		const data = this.authService.refreshTokens(dto);
		return new ResponseSuccess({ data });
	}

	@Post('forgot-password')
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		await this.authService.forgotPassword(dto.email);
		return new ResponseSuccess({ message: 'Reset code sent to email' });
	}

	@Post('verify-reset-code')
	async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
		const data = await this.authService.verifyResetCode(dto);
		return new ResponseSuccess({
			message: 'Code verified successfully',
			data,
		});
	}

	@Post('reset-password')
	async resetPassword(@Body() dto: ResetPasswordDto) {
		await this.authService.resetPassword(dto);
		return new ResponseSuccess({ message: 'Password reset successfully' });
	}
}
