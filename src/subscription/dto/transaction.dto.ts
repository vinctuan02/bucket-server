import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethod, TransactionStatus } from '../enum/subscription.enum';

export class CreateTransactionDto {
	@ApiProperty({ example: 'uuid', description: 'Plan ID (UUID)' })
	@IsUUID()
	planId: string;

	@ApiProperty({
		example: 'momo',
		description: 'Payment method',
		enum: PaymentMethod,
	})
	@IsEnum(PaymentMethod)
	paymentMethod: PaymentMethod;
}

export class UpdateTransactionStatusDto {
	@ApiProperty({
		example: 'success',
		description: 'Transaction status',
		enum: TransactionStatus,
	})
	@IsEnum(TransactionStatus)
	status: TransactionStatus;

	@ApiPropertyOptional({
		example: 'TXN123456',
		description: 'Transaction reference from gateway',
	})
	@IsOptional()
	@IsString()
	transactionRef?: string;

	@ApiPropertyOptional({
		example: 'GATEWAY_ID_123',
		description: 'Payment gateway transaction ID',
	})
	@IsOptional()
	@IsString()
	paymentGatewayId?: string;
}

export class TransactionResponseDto {
	@ApiProperty({ example: 'uuid', description: 'Transaction ID' })
	id: string;

	@ApiProperty({ example: 'uuid', description: 'User ID' })
	userId: string;

	@ApiProperty({ example: 'uuid', description: 'Subscription ID' })
	subscriptionId: string;

	@ApiProperty({ example: 100000, description: 'Transaction amount' })
	amount: number;

	@ApiProperty({ example: 'VND', description: 'Currency' })
	currency: string;

	@ApiProperty({
		example: 'momo',
		description: 'Payment method',
		enum: PaymentMethod,
	})
	paymentMethod: PaymentMethod;

	@ApiProperty({
		example: 'pending',
		description: 'Transaction status',
		enum: TransactionStatus,
	})
	status: TransactionStatus;

	@ApiPropertyOptional({
		example: 'TXN123456',
		description: 'Transaction reference',
	})
	transactionRef: string | null;

	@ApiPropertyOptional({
		example: 'GATEWAY_ID_123',
		description: 'Payment gateway ID',
	})
	paymentGatewayId: string | null;

	@ApiPropertyOptional({
		example: '2024-01-01T00:00:00Z',
		description: 'Payment timestamp',
	})
	paidAt: Date | null;

	@ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Created at' })
	createdAt: Date;

	@ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Updated at' })
	updatedAt: Date;
}
