import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PlanResponseDto } from './plan.dto';

export class CreateSubscriptionDto {
	@ApiProperty({ example: 'uuid', description: 'Plan ID (UUID)' })
	@IsUUID()
	planId: string;

	@ApiPropertyOptional({ example: 'momo', description: 'Payment method' })
	@IsOptional()
	@IsString()
	paymentMethod?: string;
}

export class SubscriptionResponseDto {
	@ApiProperty({ example: 'uuid', description: 'Subscription ID' })
	id: string;

	@ApiProperty({ example: 'uuid', description: 'User ID' })
	userId: string;

	@ApiProperty({ example: 'uuid', description: 'Plan ID' })
	planId: string;

	@ApiProperty({ type: PlanResponseDto, description: 'Plan details' })
	plan: PlanResponseDto;

	@ApiProperty({
		example: '2024-01-01T00:00:00Z',
		description: 'Subscription start date',
	})
	startDate: Date;

	@ApiProperty({
		example: '2024-02-01T00:00:00Z',
		description: 'Subscription end date',
	})
	endDate: Date;

	@ApiProperty({ example: true, description: 'Is subscription active' })
	isActive: boolean;

	@ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Created at' })
	createdAt: Date;

	@ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Updated at' })
	updatedAt: Date;
}
