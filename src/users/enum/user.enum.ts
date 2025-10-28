export enum UserFM {
	ID = 'user.id',
	NAME = 'user.name',
	EMAIL = 'user.email',
	PASSWORD = 'user.password',
	IS_ACTIVE = 'user.isActive',

	CREATED_AT = 'user.createdAt',
	UPDATED_AT = 'user.updatedAt',
}

export enum UserFMR {
	USER_ROLES = 'user.userRoles',
}

export enum UserFieldOrder {
	ID = UserFM.ID,
	NAME = UserFM.NAME,
	EMAIL = UserFM.EMAIL,
	IS_ACTIVE = UserFM.IS_ACTIVE,
	CREATED_AT = UserFM.CREATED_AT,
	UPDATED_AT = UserFM.UPDATED_AT,
}
