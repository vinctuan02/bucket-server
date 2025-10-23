import dayjs from 'dayjs';
import { ResponseError } from '../dto/common.response-dto';
import { DateFormat } from '../enums/common.enum';

export function generateFileNameWithTimestamp(
	originalFileName: string,
	format: DateFormat = DateFormat.YYYYMMDDHHmmss,
): string {
	const timestamp = dayjs().format(format);
	return `${timestamp}_${originalFileName}`;
}

export function throwErrorIfNotExists(data: any) {
	throw new ResponseError({});
}
