import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/common.decorator';
import type { CurrentUser } from 'src/common/interface/common.interface';
import { CheckoutDto } from '../dto/payment.dto';
import { PaymentService } from '../services/payment.service';

@ApiTags('Subscription - Payment')
@ApiBearerAuth()
@Controller('subscription/payment')
export class PaymentController {
	constructor(private readonly paymentService: PaymentService) {}

	/**
	 * Initiate payment checkout
	 * Creates Transaction and Subscription, returns payment URL
	 */
	@Post('checkout')
	@ApiOperation({ summary: 'Initiate payment checkout' })
	async checkout(@User() user: CurrentUser, @Body() dto: CheckoutDto) {
		return this.paymentService.initiateCheckout(user.userId, dto.planId);
	}

	/**
	 * Check payment status (for frontend polling)
	 */
	@Get('status/:transactionId')
	@ApiOperation({ summary: 'Check payment status' })
	async checkStatus(@Param('transactionId') transactionId: string) {
		return this.paymentService.checkPaymentStatus(transactionId);
	}
}
