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
	 * 🎯 GIAI ĐOẠN I: Khởi tạo Đơn hàng
	 * Endpoint để khởi tạo thanh toán
	 */
	@Post('checkout')
	@ApiOperation({ summary: 'Initiate payment checkout' })
	async checkout(@User() user: CurrentUser, @Body() dto: CheckoutDto) {
		const userId = user.userId;
		return this.paymentService.initiateCheckout(userId, dto.planId);
	}

	/**
	 * Kiểm tra trạng thái thanh toán (cho frontend polling)
	 */
	@Get('status/:transactionId')
	@ApiOperation({ summary: 'Check payment status' })
	async checkStatus(@Param('transactionId') transactionId: string) {
		return this.paymentService.checkPaymentStatus(transactionId);
	}
}
