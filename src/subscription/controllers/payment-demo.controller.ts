import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/auth.guard';
import { CheckoutDto } from '../dto/payment.dto';
import { PaymentService } from '../services/payment.service';

@ApiTags('Payment Demo')
@ApiBearerAuth()
@Controller('subscription/payment-demo')
export class PaymentDemoController {
	constructor(private readonly paymentService: PaymentService) {}

	/**
	 * Demo checkout - uses real Sepay integration
	 */
	@Post('checkout')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Demo payment checkout' })
	async checkout(@Req() req: any, @Body() dto: CheckoutDto) {
		const userId = req.user.id;
		return this.paymentService.initiateCheckout(userId, dto.planId);
	}

	/**
	 * Demo simulate payment success
	 */
	@Post('simulate-success/:transactionId')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Simulate payment success' })
	async simulateSuccess(@Param('transactionId') transactionId: string) {
		return this.paymentService.handleWebhookSuccess({
			orderId: transactionId,
			amount: 0,
			status: 'SUCCESS',
			transactionId: `demo-${transactionId}`,
		});
	}

	/**
	 * Check status
	 */
	@Get('status/:transactionId')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Check payment status' })
	async checkStatus(@Param('transactionId') transactionId: string) {
		return this.paymentService.checkPaymentStatus(transactionId);
	}
}
