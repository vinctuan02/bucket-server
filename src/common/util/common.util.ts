import dayjs from 'dayjs';
import { DateFormat } from '../enums/common.enum';

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
