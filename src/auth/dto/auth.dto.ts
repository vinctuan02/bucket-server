import {
	IsEmail,
	IsNotEmpty,
	IsString,
	Length,
	MinLength,
} from 'class-validator';

export class RegisterDto {
	@IsEmail()
	email: string;

	@IsNotEmpty()
	@MinLength(6)
	password: string;

	@IsNotEmpty()
	name: string;
}

export class VerifyAccountDto {
	@IsNotEmpty()
	userId: string;

	@IsNotEmpty()
	code: string;
}

export class LoginDto {
	@IsEmail()
	email: string;

	@IsNotEmpty()
	password: string;
}

export class RefreshTokenDto {
	@IsNotEmpty()
	refreshToken: string;
}

export class ForgotPasswordDto {
	@IsEmail()
	email: string;
}

export class ResetPasswordDto {
	@IsNotEmpty()
	token: string;

	@IsNotEmpty()
	@MinLength(6)
	newPassword: string;
}

export class VerifyResetCodeDto {
	@IsNotEmpty()
	userId: string;

	@IsString()
	@Length(6, 6)
	code: string;
}
