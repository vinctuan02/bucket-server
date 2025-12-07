import {
	BadRequestException,
	Body,
	Controller,
	Logger,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorator/auth.decorator';
import { PaymentService } from '../services/payment.service';
import { SePayService } from '../services/sepay.service';

@ApiTags('SePay Webhook')
@Controller('sepay')
export class SePayWebhookController {
	private readonly logger = new Logger(SePayWebhookController.name);

	constructor(
		private readonly sepayService: SePayService,
		private readonly paymentService: PaymentService,
	) {}

	/**
	 * 🔒 GIAI ĐOẠN III: Xác nhận Tự động
	 * Webhook endpoint để nhận thông báo từ SePay
	 */
	@Post('webhook')
	@Public()
	@ApiOperation({ summary: 'SePay webhook endpoint' })
	async handleWebhook(@Body() body: any) {
		this.logger.log('Received webhook from SePay');

		// Bước 11: Xác thực Signature
		const signature = body.signature;
		if (!signature) {
			this.logger.error('Missing signature in body');
			throw new BadRequestException('Missing signature');
		}

		// Remove signature from body for verification
		const { signature: _, ...fieldsToVerify } = body;

		const isValid = this.sepayService.verifyWebhookSignature(
			fieldsToVerify,
			signature,
		);

		if (!isValid) {
			this.logger.error('Invalid webhook signature');
			throw new BadRequestException('Invalid signature');
		}

		// Bước 12: Kiểm tra Trạng thái
		const status = body.order_status || body.status;
		if (status !== 'SUCCESS' && status !== 'COMPLETED') {
			this.logger.warn(
				`Webhook received with status: ${status}, ignoring`,
			);
			return { message: 'received' };
		}

		// Bước 13-14: Cập nhật Transaction và Kích hoạt Subscription
		try {
			const result = await this.paymentService.handleWebhookSuccess({
				orderId: body.order_invoice_number,
				amount: body.order_amount,
				status: 'SUCCESS',
				transactionId: body.transaction_id || body.order_invoice_number,
			});

			// Bước 15: Phản hồi
			return { message: 'received', data: result };
		} catch (error) {
			this.logger.error('Failed to process webhook:', error);
			throw new BadRequestException('Failed to process webhook');
		}
	}
}
