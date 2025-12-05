import { TypeToken } from '../enum/auth.enum';

export interface IAuthToken {
	accessToken: string;
	refreshToken: string;
}

export interface IAuthPayload {
	sub: string;
	email: string;
	roles?: string[];
	permissions?: { action: string; resource: string }[];
	type: TypeToken;
}

export interface IVerificationCode {
	userId: string;
	code: string;
	expiredAt: number;
}
