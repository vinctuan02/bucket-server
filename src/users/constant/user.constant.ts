import { getValuesOfEnum } from 'src/common/util/common.util';
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

export const USER_FIELDS_ALL = getValuesOfEnum(UserFM);
export const USER_FIELDS_SIMPLE = [
	UserFM.ID,
	UserFM.NAME,
	UserFM.EMAIL,
	UserFM.IS_ACTIVE,
	UserFM.CREATED_AT,
	UserFM.UPDATED_AT,
];
