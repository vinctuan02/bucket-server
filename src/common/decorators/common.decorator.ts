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

import { applyDecorators } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

/**
 * Custom decorator to transform a comma-separated string value into an array of trimmed strings,
 * and applies validation decorators: @IsArray(), @IsString({ each: true }), @IsOptional().
 *
 * Example input (Query parameter): ?tags=apple,banana , orange
 * Example output (Transformed value): ['apple', 'banana', 'orange']
 *
 * Note: It handles both string input and undefined/null input (returns [] for falsey values).
 */
export function StringToArrayString() {
	const transformationLogic = ({ value }: TransformFnParams): string[] => {
		if (!value) {
			return [];
		}

		// Ensure value is a string before splitting
		return String(value)
			.split(',')
			.map((v) => v.trim());
	};

	const decorators = [
		Transform(transformationLogic),
		IsArray(),
		IsString({ each: true }),
	];

	decorators.push(IsOptional());

	return applyDecorators(...decorators);
}
