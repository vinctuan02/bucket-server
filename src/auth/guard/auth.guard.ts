import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
	IS_PUBLIC_KEY,
	PERMISSIONS_KEY,
	RequiredPermission,
} from '../decorator/auth.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(private reflector: Reflector) {
		super();
	}

	canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride<boolean>(
			IS_PUBLIC_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (isPublic) {
			return true;
		}

		return super.canActivate(context);
	}

	handleRequest(err: any, user: any, info: any) {
		if (err || !user) {
			throw (
				err ||
				new UnauthorizedException({
					message: 'Unauthorized - Please login again',
					statusCode: 401,
				})
			);
		}
		return user;
	}
}

// OLD: Check permissions from token
// @Injectable()
// export class PermissionsGuard implements CanActivate {
// 	constructor(private reflector: Reflector) {}
//
// 	canActivate(context: ExecutionContext): boolean {
// 		// 1. Lấy danh sách Quyền yêu cầu từ Decorator
// 		const requiredPermissions = this.reflector.getAllAndOverride<
// 			RequiredPermission[]
// 		>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
//
// 		if (!requiredPermissions) {
// 			return true; // Không có yêu cầu quyền, cho phép truy cập
// 		}
//
// 		// 2. Lấy thông tin người dùng và Permissions sở hữu
// 		const request = context.switchToHttp().getRequest();
// 		// GIẢ ĐỊNH: Danh sách Permissions của user đã được gắn vào request.user
// 		// trong một AuthGuard trước đó (ví dụ: JWT Guard)
// 		const userPermissions: { action: string; resource: string }[] =
// 			request.user.permissions || [];
//
// 		// 3. Kiểm tra Quyền
// 		// Kiểm tra xem người dùng có TẤT CẢ các RequiredPermission hay không
// 		return requiredPermissions.every((requiredPerm) => {
// 			return userPermissions.some(
// 				(userPerm) =>
// 					userPerm.action === requiredPerm.action &&
// 					userPerm.resource === requiredPerm.resource,
// 			);
// 		});
// 	}
// }

// NEW: Check permissions from database
import { UsersService } from 'src/users/services/user.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private usersService: UsersService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// 1. Lấy danh sách Quyền yêu cầu từ Decorator
		const requiredPermissions = this.reflector.getAllAndOverride<
			RequiredPermission[]
		>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

		if (!requiredPermissions || requiredPermissions.length === 0) {
			return true; // Không có yêu cầu quyền, cho phép truy cập
		}

		// 2. Lấy thông tin người dùng từ request
		const request = context.switchToHttp().getRequest();
		const userId = request.user?.userId;

		if (!userId) {
			return false; // Không có user ID, từ chối truy cập
		}

		// 3. Lấy user với permissions từ database
		try {
			const user = await this.usersService.findOneWithPermissions(userId);

			// Extract permissions from user roles
			const userPermissions: { action: string; resource: string }[] = [];
			if (user.userRoles) {
				user.userRoles.forEach((ur) => {
					if (ur.role?.rolePermissions) {
						ur.role.rolePermissions.forEach((rp) => {
							userPermissions.push({
								action: rp.permission.action,
								resource: rp.permission.resource,
							});
						});
					}
				});
			}

			// 4. Kiểm tra Quyền
			// Kiểm tra xem người dùng có TẤT CẢ các RequiredPermission hay không
			return requiredPermissions.every((requiredPerm) => {
				return userPermissions.some(
					(userPerm) =>
						userPerm.action === requiredPerm.action &&
						userPerm.resource === requiredPerm.resource,
				);
			});
		} catch (error) {
			return false; // Lỗi khi lấy permissions, từ chối truy cập
		}
	}
}
