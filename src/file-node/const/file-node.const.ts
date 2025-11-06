import { ResponseError } from 'src/common/dto/common.response-dto';

export const FileNodeResponseError = {
	FILE_NODE_NOT_FOUND: (data?: any) =>
		new ResponseError({
			message: 'File node not found',
			data,
		}),

	FILE_NOT_FOUND: (data?: any) =>
		new ResponseError({
			message: 'File not found',
			data,
		}),

	INVALID_PARENT_ID: (data?: any) =>
		new ResponseError({
			message: 'Invalid parentId — must be a folder',
			data,
		}),

	FILE_NODE_ALREADY_EXISTS: (data?: any) =>
		new ResponseError({
			message: 'File or folder already exists',
			data,
		}),

	UNKNOWN_ERROR: (data?: any) =>
		new ResponseError({
			message: 'Unknown file manager error',
			data,
		}),
};
