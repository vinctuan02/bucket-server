import {
	PermissionAction,
	PermissionFM,
	Resource,
} from '../enums/permission.enum';

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

export const APP_PERMISSIONS = {
	// --- USER (Quản trị Người dùng) ---
	CREATE_USER: {
		name: 'Create User',
		action: PermissionAction.CREATE,
		resource: Resource.USER,
		description: 'Allow creating new users',
	},
	READ_USER: {
		name: 'Read User',
		action: PermissionAction.READ,
		resource: Resource.USER,
		description: 'Allow viewing user information',
	},
	UPDATE_USER: {
		name: 'Update User',
		action: PermissionAction.UPDATE,
		resource: Resource.USER,
		description: 'Allow editing user information',
	},
	DELETE_USER: {
		name: 'Delete User',
		action: PermissionAction.DELETE,
		resource: Resource.USER,
		description: 'Allow deleting users',
	},

	// --- FILE_NODE (Quản lý File/Folder) ---
	CREATE_FILE_NODE: {
		name: 'Create File/Folder',
		action: PermissionAction.CREATE,
		resource: Resource.FILE_NODE,
		description: 'Allow creating new files/folders',
	},
	READ_FILE_NODE: {
		name: 'Read File/Folder',
		action: PermissionAction.READ,
		resource: Resource.FILE_NODE,
		description: 'Allow viewing files/folders',
	},
	UPDATE_FILE_NODE: {
		name: 'Update File/Folder',
		action: PermissionAction.UPDATE,
		resource: Resource.FILE_NODE,
		description: 'Allow renaming or updating files/folders',
	},
	DELETE_FILE_NODE: {
		name: 'Delete File/Folder',
		action: PermissionAction.DELETE,
		resource: Resource.FILE_NODE,
		description: 'Allow deleting files/folders',
	},

	// --- ROLE (Quản lý Vai trò) ---
	READ_ROLE: {
		name: 'Read Role',
		action: PermissionAction.READ,
		resource: Resource.ROLE,
		description: 'Allow viewing roles',
	},
	CREATE_ROLE: {
		name: 'Create Role',
		action: PermissionAction.CREATE,
		resource: Resource.ROLE,
		description: 'Allow creating new roles',
	},
	UPDATE_ROLE: {
		name: 'Update Role',
		action: PermissionAction.UPDATE,
		resource: Resource.ROLE,
		description: 'Allow editing roles',
	},
	DELETE_ROLE: {
		name: 'Delete Role',
		action: PermissionAction.DELETE,
		resource: Resource.ROLE,
		description: 'Allow deleting roles',
	},

	// --- PERMISSION (Quản lý Quyền) ---
	READ_PERMISSION: {
		name: 'Read Permission',
		action: PermissionAction.READ,
		resource: Resource.PERMISSION,
		description: 'Allow viewing permissions',
	},
	CREATE_PERMISSION: {
		name: 'Create Permission',
		action: PermissionAction.CREATE,
		resource: Resource.PERMISSION,
		description: 'Allow creating new permissions',
	},
	UPDATE_PERMISSION: {
		name: 'Update Permission',
		action: PermissionAction.UPDATE,
		resource: Resource.PERMISSION,
		description: 'Allow editing permissions',
	},
	DELETE_PERMISSION: {
		name: 'Delete Permission',
		action: PermissionAction.DELETE,
		resource: Resource.PERMISSION,
		description: 'Allow deleting permissions',
	},

	// --- PROFILE (Quản lý Hồ sơ cá nhân) ---
	READ_PROFILE: {
		name: 'Read Profile',
		action: PermissionAction.READ,
		resource: Resource.PROFILE,
		description: 'Allow viewing user profile',
	},
	UPDATE_PROFILE: {
		name: 'Update Profile',
		action: PermissionAction.UPDATE,
		resource: Resource.PROFILE,
		description: 'Allow editing user profile',
	},

	// --- STORAGE (Quản lý Dung lượng) ---
	READ_STORAGE: {
		name: 'Read Storage',
		action: PermissionAction.READ,
		resource: Resource.STORAGE,
		description: 'Allow viewing storage information',
	},

	// --- TRASH (Quản lý Thùng rác) ---
	READ_TRASH: {
		name: 'Read Trash',
		action: PermissionAction.READ,
		resource: Resource.TRASH,
		description: 'Allow viewing trash',
	},
	DELETE_TRASH: {
		name: 'Delete Trash',
		action: PermissionAction.DELETE,
		resource: Resource.TRASH,
		description: 'Allow permanently deleting items from trash',
	},

	// --- PLAN (Quản lý Gói) ---
	READ_PLAN: {
		name: 'Read Plan',
		action: PermissionAction.READ,
		resource: Resource.PLAN,
		description: 'Allow viewing storage plans',
	},
	CREATE_PLAN: {
		name: 'Create Plan',
		action: PermissionAction.CREATE,
		resource: Resource.PLAN,
		description: 'Allow creating new storage plans',
	},
	UPDATE_PLAN: {
		name: 'Update Plan',
		action: PermissionAction.UPDATE,
		resource: Resource.PLAN,
		description: 'Allow editing storage plans',
	},
	DELETE_PLAN: {
		name: 'Delete Plan',
		action: PermissionAction.DELETE,
		resource: Resource.PLAN,
		description: 'Allow deleting storage plans',
	},
	MANAGE_PLAN: {
		name: 'Manage Plan',
		action: PermissionAction.MANAGE,
		resource: Resource.PLAN,
		description: 'Allow managing storage plans',
	},

	// --- SUBSCRIPTION (Quản lý Đăng ký) ---
	READ_SUBSCRIPTION: {
		name: 'Read Subscription',
		action: PermissionAction.READ,
		resource: Resource.SUBSCRIPTION,
		description: 'Allow viewing subscriptions',
	},
	CREATE_SUBSCRIPTION: {
		name: 'Create Subscription',
		action: PermissionAction.CREATE,
		resource: Resource.SUBSCRIPTION,
		description: 'Allow creating new subscriptions',
	},
	UPDATE_SUBSCRIPTION: {
		name: 'Update Subscription',
		action: PermissionAction.UPDATE,
		resource: Resource.SUBSCRIPTION,
		description: 'Allow updating subscriptions',
	},

	// --- APP_CONFIG (Quản lý Cấu hình Ứng dụng) ---
	READ_CONFIG: {
		name: 'Read Config',
		action: PermissionAction.READ,
		resource: Resource.APP_CONFIG,
		description: 'Allow viewing app configuration',
	},
	UPDATE_CONFIG: {
		name: 'Update Config',
		action: PermissionAction.UPDATE,
		resource: Resource.APP_CONFIG,
		description: 'Allow updating app configuration',
	},
};

export const PERMISSIONS_SEED = Object.values(APP_PERMISSIONS);
