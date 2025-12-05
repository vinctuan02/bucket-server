export enum PermissionAction {
	/** Quyền truy cập và lấy dữ liệu chi tiết qua API (Backend). */
	READ = 'READ',

	/** Quyền tạo mới một bản ghi tài nguyên. */
	CREATE = 'CREATE',

	/** Quyền chỉnh sửa dữ liệu của một bản ghi hiện có. */
	UPDATE = 'UPDATE',

	/** Quyền xóa một bản ghi tài nguyên. */
	DELETE = 'DELETE',

	/** Quyền truy cập vào một trang/dashboard (Frontend). */
	VIEW = 'VIEW',

	/** Quyền quản lý toàn diện (bao gồm CRUD + Config) trên tài nguyên. */
	MANAGE = 'MANAGE',

	/** Quyền thực hiện chức năng chia sẻ tài nguyên. */
	SHARE = 'SHARE',
}

export enum Resource {
	// Tài nguyên Quản trị
	USER = 'USER',
	ROLE = 'ROLE',
	PERMISSION = 'PERMISSION',
	SUBSCRIPTION = 'SUBSCRIPTION',
	APP_CONFIG = 'APP_CONFIG',

	// Tài nguyên Người dùng
	PLAN = 'PLAN',
	PROFILE = 'PROFILE',
	FILE_NODE = 'FILE_NODE', // Dùng cho File/Folder (cấp hệ thống)
	STORAGE = 'STORAGE',
	TRASH = 'TRASH',
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
