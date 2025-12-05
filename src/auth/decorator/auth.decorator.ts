import { SetMetadata } from '@nestjs/common';

import {
	PermissionAction,
	Resource,
} from 'src/permission/enums/permission.enum';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
	SetMetadata(PERMISSIONS_KEY, permissions);

// Định nghĩa cấu trúc Permission cần thiết
export interface RequiredPermission {
	action: PermissionAction;
	resource: Resource;
}

// Decorator nhận vào một mảng các RequiredPermission
export const RequiredPermissions = (...permissions: RequiredPermission[]) =>
	SetMetadata(PERMISSIONS_KEY, permissions);
