import { PermissionFM } from '../enums/permission.enum';

// src/permissions/constant/permission.constant.ts
export const PermissionResponse = {
	NOT_FOUND: {
		message: 'Permission not found',
	},
	ALREADY_EXISTS: {
		message: 'Permission already exists',
	},
};

export const PermissionFieldsSimple = [
	PermissionFM.ID,
	PermissionFM.NAME,
	PermissionFM.RESOURCE,
	PermissionFM.DESCRIPTION,
	PermissionFM.ACTION,
	PermissionFM.CREATED_AT,
	PermissionFM.UPDATED_AT,
];
