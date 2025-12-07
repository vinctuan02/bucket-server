import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CheckoutDto {
	@IsNotEmpty()
	@IsUUID()
	planId: string;
}

export class CheckPaymentStatusDto {
	@IsNotEmpty()
	@IsString()
	transactionId: string;
}
