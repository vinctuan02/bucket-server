import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransactionStatus } from '../enum/subscription.enum';

export class CreateTransactionDto {
	@ApiProperty({ example: 'uuid', description: 'Subscription ID (UUID)' })
	@IsUUID()
	subscriptionId: string;

	@ApiProperty({ example: 'momo', description: 'Payment method' })
	@IsString()
	paymentMethod: string;

	@ApiPropertyOptional({ example: 'VND', description: 'Currency code' })
	@IsOptional()
	@IsString()
	currency?: string;
}

export class TransactionResponseDto {
	@ApiProperty({ example: 'uuid', description: 'Transaction ID' })
	id: string;

	@ApiProperty({ example: 'uuid', description: 'User ID' })
	userId: string;

	@ApiProperty({ example: 'uuid', description: 'Subscription ID' })
	subscriptionId: string;

	@ApiProperty({ example: 99000, description: 'Transaction amount' })
	amount: number;

	@ApiProperty({ example: 'VND', description: 'Currency code' })
	currency: string;

	@ApiProperty({ example: 'momo', description: 'Payment method' })
	paymentMethod: string;

	@ApiProperty({
		enum: TransactionStatus,
		example: TransactionStatus.PENDING,
		description: 'Transaction status',
	})
	status: TransactionStatus;

	@ApiProperty({
		example: 'MOMO_REF_123456',
		description: 'Transaction reference from provider',
		nullable: true,
	})
	transactionRef: string | null;

	@ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Created at' })
	createdAt: Date;

	@ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Updated at' })
	updatedAt: Date;
}

export class UpdateTransactionStatusDto {
	@ApiProperty({
		enum: TransactionStatus,
		example: TransactionStatus.SUCCESS,
		description: 'New transaction status',
	})
	@IsEnum(TransactionStatus)
	status: TransactionStatus;

	@ApiPropertyOptional({
		example: 'MOMO_REF_123456',
		description: 'Transaction reference from provider',
	})
	@IsOptional()
	@IsString()
	transactionRef?: string;
}
