import { PermissionFieldMapping } from 'src/orm-utils/field-mapping/orm.permission.fm';

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
	PermissionFieldMapping.ID,
	PermissionFieldMapping.NAME,
	PermissionFieldMapping.RESOURCE,
	PermissionFieldMapping.DESCRIPTION,
	PermissionFieldMapping.ACTION,
	PermissionFieldMapping.CREATED_AT,
	PermissionFieldMapping.UPDATED_AT,
];
