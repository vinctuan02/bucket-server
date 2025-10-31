export enum PermissionAction {
	READ = 'read',
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
	APPROVE = 'approve',
	EXPORT = 'export',
	MANAGE = 'manage',
}

export enum PermissionFM {
	ID = 'permission.id',
	NAME = 'permission.name',
	ACTION = 'permission.action',
	RESOURCE = 'permission.resource',
	DESCRIPTION = 'permission.description',
	CREATED_AT = 'permission.createdAt',
	UPDATED_AT = 'permission.updatedAt',
}

export enum PermissionFieldOrder {
	NAME = PermissionFM.NAME,
	ACTION = PermissionFM.ACTION,
	RESOURCE = PermissionFM.RESOURCE,
	DESCRIPTION = PermissionFM.DESCRIPTION,
	CREATED_AT = PermissionFM.CREATED_AT,
	UPDATED_AT = PermissionFM.UPDATED_AT,
}
