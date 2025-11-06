import { ResponseError } from 'src/common/dto/common.response-dto';

export const UserStorageResponseError = {
	NOT_FOUND: (data?: any) => ({
		data,
		message: 'User storage not found',
	}),

	STORAGE_LIMIT_EXCEEDED: (data?: any) => {
		return new ResponseError({
			data,
			message: 'Storage limit exceeded',
		});
	},
};
