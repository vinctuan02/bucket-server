import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';

export class CreatePlanDto {
	@ApiProperty({ example: 'Premium 200GB', description: 'Plan name' })
	@IsString()
	name: string;

	@ApiPropertyOptional({
		example: 'Premium plan with 200GB storage',
		description: 'Plan description',
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({
		example: 214748364800,
		description: 'Storage limit in bytes',
	})
	@IsNumber()
	storageLimit: number;

	@ApiProperty({ example: 99000, description: 'Price in VND' })
	@IsNumber()
	price: number;

	@ApiProperty({ example: 30, description: 'Duration in days' })
	@IsNumber()
	durationDays: number;

	@ApiPropertyOptional({ example: true, description: 'Is plan active' })
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}

export class UpdatePlanDto {
	@ApiPropertyOptional({ example: 'Premium 200GB', description: 'Plan name' })
	@IsOptional()
	@IsString()
	name?: string;

	@ApiPropertyOptional({
		example: 'Premium plan with 200GB storage',
		description: 'Plan description',
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({
		example: 214748364800,
		description: 'Storage limit in bytes',
	})
	@IsOptional()
	@IsNumber()
	storageLimit?: number;

	@ApiPropertyOptional({ example: 99000, description: 'Price in VND' })
	@IsOptional()
	@IsNumber()
	price?: number;

	@ApiPropertyOptional({ example: 30, description: 'Duration in days' })
	@IsOptional()
	@IsNumber()
	durationDays?: number;

	@ApiPropertyOptional({ example: true, description: 'Is plan active' })
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}

export class GetListPlanDto extends BaseQueryDto {
	@ApiPropertyOptional({
		example: true,
		description: 'Filter by active status',
	})
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	isActive?: boolean;

	constructor(init?: Partial<GetListPlanDto>) {
		super();
		Object.assign(this, init);
	}
}

export class PlanResponseDto {
	@ApiProperty({ example: 'uuid', description: 'Plan ID' })
	id: string;

	@ApiProperty({ example: 'Premium 200GB', description: 'Plan name' })
	name: string;

	@ApiProperty({
		example: 'Premium plan with 200GB storage',
		description: 'Plan description',
		nullable: true,
	})
	description: string | null;

	@ApiProperty({
		example: 214748364800,
		description: 'Storage limit in bytes',
	})
	storageLimit: number;

	@ApiProperty({ example: 99000, description: 'Price in VND' })
	price: number;

	@ApiProperty({ example: 30, description: 'Duration in days' })
	durationDays: number;

	@ApiProperty({ example: true, description: 'Is plan active' })
	isActive: boolean;

	@ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Created at' })
	createdAt: Date;

	@ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Updated at' })
	updatedAt: Date;
}
