import {
	ResponseError,
	ResponseSuccess,
} from 'src/common/dto/common.response-dto';

export const AuthResponseSuccess = {
	COMMON: ({ data }: { data?: any }) => {
		return new ResponseSuccess({ data });
	},
	VERIFY_EMAIL: ({ data }: { data?: any }) => {
		return new ResponseSuccess({
			data,
			message: 'Account verified successfully',
		});
	},
	FORGOT_PASSWORD: ({ data }: { data?: any }) => {
		return new ResponseSuccess({
			data,
			message: 'Reset code sent to email',
		});
	},
	RERET_PASSWORD: ({ data }: { data?: any }) => {
		return new ResponseSuccess({
			data,
			message: 'Password reset successfully',
		});
	},
};

export const AuthResponseError = {
	COMMON: ({ data }: { data?: any }) => {
		return new ResponseError({ data });
	},
	INVALID_VERIFY_CODE: () => {
		return new ResponseError({
			message: 'Invalid verification code',
		});
	},
	ACCOUNT_ALREADY_VERIFIED: () => {
		return new ResponseError({
			message: 'Account already verified',
		});
	},
	INVALID_TOKEN_TYPE: () => {
		return new ResponseError({
			message: 'Invalid token type',
		});
	},
	ACCOUNT_IS_NOT_ACTIVE: () => {
		return new ResponseError({
			message: 'Account is not active',
		});
	},
	EMAIL_ALREADY_EXISTS: (email: string) => {
		return new ResponseError({
			message: `Email ${email} already exists`,
		});
	},
	EMAIL_NOT_FOUND: (email: string) => {
		return new ResponseError({
			message: `Email ${email} not found`,
		});
	},
	INVALID_CREDENTIALS: () => {
		return new ResponseError({
			message: 'Invalid credentials',
		});
	},
};
