import { ApiProperty } from '@nestjs/swagger';

export class PlanDetailDto {
	@ApiProperty({ description: 'Plan ID' })
	id: string;

	@ApiProperty({ description: 'Plan name' })
	name: string;

	@ApiProperty({ description: 'Plan price in VND' })
	price: number;

	@ApiProperty({ description: 'Plan duration in days' })
	durationDays: number;

	@ApiProperty({ description: 'Storage limit in bytes' })
	storageLimit: number;
}

export class SubscriptionDetailDto {
	@ApiProperty({ description: 'Subscription ID' })
	id: string;

	@ApiProperty({ description: 'Whether subscription is active' })
	isActive: boolean;

	@ApiProperty({ description: 'Subscription start date', nullable: true })
	startDate: Date | null;

	@ApiProperty({ description: 'Subscription end date', nullable: true })
	endDate: Date | null;

	@ApiProperty({
		description: 'Plan details',
		type: PlanDetailDto,
		nullable: true,
	})
	plan: PlanDetailDto | null;
}

export class TransactionDetailDto {
	@ApiProperty({ description: 'Transaction ID (UUID)' })
	id: string;

	@ApiProperty({ description: 'User ID who owns this transaction' })
	userId: string;

	@ApiProperty({ description: 'Transaction amount' })
	amount: number;

	@ApiProperty({ description: 'Currency code (e.g., VND)' })
	currency: string;

	@ApiProperty({ description: 'Payment method used' })
	paymentMethod: string;

	@ApiProperty({
		description: 'Transaction status',
		enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELED'],
	})
	status: string;

	@ApiProperty({
		description: 'Transaction reference from payment gateway',
		nullable: true,
	})
	transactionRef: string | null;

	@ApiProperty({
		description: 'Payment gateway transaction ID',
		nullable: true,
	})
	paymentGatewayId: string | null;

	@ApiProperty({
		description: 'Date when payment was completed',
		nullable: true,
	})
	paidAt: Date | null;

	@ApiProperty({ description: 'Transaction creation date' })
	createdAt: Date;

	@ApiProperty({ description: 'Transaction last update date' })
	updatedAt: Date;

	@ApiProperty({
		description: 'Associated subscription details',
		type: SubscriptionDetailDto,
		nullable: true,
	})
	subscription: SubscriptionDetailDto | null;
}
