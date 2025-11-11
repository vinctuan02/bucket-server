export enum ShareFm {
	id = 'share.id',
	sharePermissions = 'share.sharePermissions',
	fileNodeId = 'share.fileNodeId',
	sharedById = 'share.sharedById',
	type = 'share.type',
	linkToken = 'share.linkToken',
	expiresAt = 'share.expiresAt',
	createdAt = 'share.createdAt',
}

export enum SharePermissionFm {
	id = 'sharePermission.id',
	shareId = 'sharePermission.shareId',
	targetUserId = 'sharePermission.targetUserId',
	canView = 'sharePermission.canView',
	canEdit = 'sharePermission.canEdit',
	canDelete = 'sharePermission.canDelete',
	canUpload = 'sharePermission.canUpload',
	canShare = 'sharePermission.canShare',
	createdAt = 'sharePermission.createdAt',
	updatedAt = 'sharePermission.updatedAt',
}

export const ShareFieldsSimple = [
	ShareFm.id,
	ShareFm.fileNodeId,
	ShareFm.sharedById,
	ShareFm.type,
	ShareFm.linkToken,
	// ShareFm.expiresAt,
	ShareFm.createdAt,
];

export const SharePermissionsSimple = [
	SharePermissionFm.id,
	SharePermissionFm.shareId,
	SharePermissionFm.targetUserId,
	SharePermissionFm.canView,
	SharePermissionFm.canEdit,
	SharePermissionFm.canDelete,
	SharePermissionFm.canUpload,
	SharePermissionFm.canShare,
	// SharePermissionFm.createdAt,
	// SharePermissionFm.updatedAt,
];
