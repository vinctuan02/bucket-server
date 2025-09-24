import { Transform, Type } from 'class-transformer';
import {
	IsDate,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { FILED_ORDER_DEFAULT } from '../const/common.const';
import { OrderDirection } from '../enums/common.enum';

export abstract class BaseQueryDto {
	/** Full‑text search keyword */

	@IsOptional()
	@IsString()
	@Transform(({ value }: { value: string | undefined }) => value?.trim())
	keyword?: string;

	/** 1‑based page number */

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page: number = 1;

	/** Items per page */

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	pageSize: number = 20;

	/** Number of records to skip */
	get skip(): number {
		return (this.page - 1) * this.pageSize;
	}

	/** Number of records to take */
	get limit(): number {
		return this.pageSize;
	}

	@IsOptional()
	@IsString()
	fieldOrder: string = FILED_ORDER_DEFAULT;

	@IsOptional()
	@IsString()
	@IsEnum(OrderDirection)
	orderBy: OrderDirection = OrderDirection.ASC;

	@IsOptional()
	@IsDate()
	@Transform(({ value }: { value: string | undefined }) =>
		value ? new Date(value) : undefined,
	)
	startCreatedAt?: Date;

	@IsOptional()
	@IsDate()
	@Transform(({ value }: { value: string | undefined }) =>
		value ? new Date(value) : undefined,
	)
	endCreatedAt?: Date;

	@IsOptional()
	@IsDate()
	@Transform(({ value }: { value: string | undefined }) =>
		value ? new Date(value) : undefined,
	)
	startUpdatedAt?: Date;

	@IsOptional()
	@IsDate()
	@Transform(({ value }: { value: string | undefined }) =>
		value ? new Date(value) : undefined,
	)
	endUpdatedAt?: Date;
}
