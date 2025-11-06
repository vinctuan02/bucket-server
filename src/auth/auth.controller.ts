// src/auth/auth.controller.ts
import {
	Body,
	Controller,
	Get,
	Post,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthResponseSuccess } from './constant/auth.const';
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
	async googleRedirect(@Req() req, @Res() res) {
		const data = await this.authService.validateGoogleUser(req.user);
		return res.redirect(
			`http://localhost:3000/login?accessToken=${data.accessToken}`,
		);
	}

	//
	@Public()
	@Post('register')
	async register(@Body() dto: RegisterDto) {
		const data = await this.authService.register(dto);
		return AuthResponseSuccess.COMMON({ data });
	}

	@Public()
	@Post('verify-email')
	async verify(@Body() body: VerifyAccountDto) {
		const data = await this.authService.verifyAccount(body);
		return AuthResponseSuccess.VERIFY_EMAIL({ data });
	}

	@Public()
	@Post('login')
	async login(@Body() dto: LoginDto) {
		const data = await this.authService.login(dto);
		return AuthResponseSuccess.COMMON({ data });
	}

	@Public()
	@Post('refresh-token')
	refreshTokens(@Body() dto: RefreshTokenDto) {
		const data = this.authService.refreshTokens(dto);
		return AuthResponseSuccess.COMMON({ data });
	}

	@Public()
	@Post('forgot-password')
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		await this.authService.forgotPassword(dto.email);
		return AuthResponseSuccess.FORGOT_PASSWORD({});
	}

	@Public()
	@Post('verify-reset-code')
	verifyResetCode(@Body() dto: VerifyResetCodeDto) {
		const data = this.authService.verifyResetCode(dto);
		return AuthResponseSuccess.COMMON({ data });
	}

	@Public()
	@Post('reset-password')
	async resetPassword(@Body() dto: ResetPasswordDto) {
		await this.authService.resetPassword(dto);
		return AuthResponseSuccess.RERET_PASSWORD({});
	}

	@Get('me')
	async getProfile(@Req() req) {
		const data = await this.authService.getProfile(req.user.userId);
		return AuthResponseSuccess.COMMON({ data });
	}

	@Get('me/detail')
	async getProfileWithPermissions(@Req() req) {
		const data = await this.authService.getProfileWithPermissions(
			req.user.userId,
		);
		return AuthResponseSuccess.COMMON({ data });
	}
}
