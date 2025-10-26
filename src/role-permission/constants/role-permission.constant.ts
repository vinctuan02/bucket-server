export enum RolePermissionFM {
	ID = 'rolePermission.id',
	ROLE_ID = 'rolePermission.roleId',
	PERMISSION_ID = 'rolePermission.permissionId',

	PERMISSION = 'rolePermission.permission',
	ROLE = 'rolePermission.role',
}

export const RolePermissionFieldsSimple = [
	RolePermissionFM.ID,
	RolePermissionFM.ROLE_ID,
	RolePermissionFM.PERMISSION_ID,
];
