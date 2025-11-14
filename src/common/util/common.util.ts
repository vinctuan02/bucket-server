import { randomBytes } from 'crypto';
import dayjs from 'dayjs';
import { DateFormat } from '../enums/common.enum';
import { CurrentUser } from '../interface/common.interface';

export function generateFileNameWithTimestamp(
	originalFileName: string,
	format: DateFormat = DateFormat.YYYYMMDDHHmmss,
): string {
	const timestamp = dayjs().format(format);
	return `${timestamp}_${originalFileName}`;
}

export function generateSixDigitOtp(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getValuesOfEnum<T extends Record<string, string>>(
	e: T,
): string[] {
	return Object.values(e).filter((v): v is string => typeof v === 'string');
}

export function parseReq(req: any) {
	return {
		userId: req.user.userId as string,
		roles: req.user.roles as string[],
	};
}

// version 2: return undefine
export function parseReq2(req?: any) {
	if (req) {
		return {
			userId: req.user.userId as string,
			roles: req.user.roles as string[],
		};
	}

	return {
		userId: undefined,
		roles: undefined,
	};
}

export function generateShareLinkToken(): string {
	const bytes = randomBytes(24);
	return bytes.toString('base64url');
}

export function IS_ADMIN(currentUser: CurrentUser): boolean {
	return currentUser.roles.includes('Admin');
}
