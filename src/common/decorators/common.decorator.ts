import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express-serve-static-core';

export const GetUserId = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		return request.user.userId;
	},
);

export const User = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const request: Request = ctx.switchToHttp().getRequest();
		return request.user;
	},
);
