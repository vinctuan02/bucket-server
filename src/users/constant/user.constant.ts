import { enumToArray } from 'src/common/util/common.util';
import { UserFM } from '../enum/user.enum';

export const UserResponse = {
	NOT_FOUND: {
		message: 'User not found',
	},

	EMAIL_EXISTS: {
		message: 'Email already exists',
	},

	EMAIL_NOT_FOUND: {
		message: 'User by email not found',
	},
};

export const UserFilesAll = enumToArray(UserFM);
export const UserFieldsSimple = [UserFM.ID, UserFM.NAME, UserFM.EMAIL];
