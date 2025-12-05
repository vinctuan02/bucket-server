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

export const ROLE_CONSTANTS = {
	ADMIN: 'Admin',
	USER: 'User',
	VIEWER: 'Viewer',
	SALE: 'Sale',
};

export const ROLES_SEED = [
	{ name: ROLE_CONSTANTS.ADMIN },
	{ name: ROLE_CONSTANTS.USER },
	{ name: ROLE_CONSTANTS.VIEWER },
	{ name: ROLE_CONSTANTS.SALE },
];
