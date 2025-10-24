import { TypeToken } from '../enum/auth.enum';

export interface IAuthToken {
	accessToken: string;
	refreshToken: string;
}

export interface IAuthPayload {
	sub: string;
	email: string;
	type: TypeToken;
	// role: string;
}

export interface IVerificationCode {
	userId: string;
	code: string;
	expiredAt: number;
}
