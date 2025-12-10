import { ResponseError } from 'src/common/dto/common.response-dto';
import { getValuesOfEnum } from 'src/common/util/common.util';
import { UserFM } from '../enum/user.enum';

export class UserExceptions {
	public static NOT_FOUND(): ResponseError {
		return new ResponseError({
			message: 'User not found',
		});
	}

	public static EMAIL_EXISTS(): ResponseError {
		return new ResponseError({
			message: 'Email already exists',
		});
	}

	public static EMAIL_NOT_FOUND(): ResponseError {
		return new ResponseError({
			message: 'User by email not found',
		});
	}
}

export const USER_FIELDS_ALL = getValuesOfEnum(UserFM);
export const USER_FIELDS_SIMPLE = [
	UserFM.ID,
	UserFM.NAME,
	UserFM.EMAIL,
	UserFM.IS_ACTIVE,
	UserFM.CREATED_AT,
	UserFM.UPDATED_AT,
];
