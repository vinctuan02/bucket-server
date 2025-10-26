import { RoleFM } from './orm.role.fm';

// src/roles/constant/role.constant.ts
export const RoleResponse = {
	NOT_FOUND: {
		message: 'Role not found',
	},
	ALREADY_EXISTS: {
		message: 'Role already exists',
	},
};

export const RoleFieldSimple = [RoleFM.ID, RoleFM.NAME, RoleFM.DESCRIPTION];
