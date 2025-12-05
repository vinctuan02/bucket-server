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

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		// 1. Lấy danh sách Quyền yêu cầu từ Decorator
		const requiredPermissions = this.reflector.getAllAndOverride<
			RequiredPermission[]
		>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

		if (!requiredPermissions) {
			return true; // Không có yêu cầu quyền, cho phép truy cập
		}

		// 2. Lấy thông tin người dùng và Permissions sở hữu
		const request = context.switchToHttp().getRequest();
		// GIẢ ĐỊNH: Danh sách Permissions của user đã được gắn vào request.user
		// trong một AuthGuard trước đó (ví dụ: JWT Guard)
		const userPermissions: { action: string; resource: string }[] =
			request.user.permissions || [];

		// 3. Kiểm tra Quyền
		// Kiểm tra xem người dùng có TẤT CẢ các RequiredPermission hay không
		return requiredPermissions.every((requiredPerm) => {
			return userPermissions.some(
				(userPerm) =>
					userPerm.action === requiredPerm.action &&
					userPerm.resource === requiredPerm.resource,
			);
		});
	}
}
