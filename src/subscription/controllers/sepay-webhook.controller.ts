import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Logger,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorator/auth.decorator';
import { PaymentService } from '../services/payment.service';
import { SepayService } from '../services/sepay.service';

@ApiTags('Sepay Webhook')
@Controller('sepay')
export class SepayWebhookController {
	private readonly logger = new Logger(SepayWebhookController.name);

	constructor(
		private readonly sepayService: SepayService,
		private readonly paymentService: PaymentService,
	) {}

	/**
	 * Webhook endpoint to receive payment notifications from Sepay
	 * This is a PUBLIC endpoint (no JWT required)
	 * Authentication is done via signature verification
	 */
	@Post('webhook')
	@Public()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Sepay webhook endpoint (IPN)' })
	async handleWebhook(@Body() body: any) {
		this.logger.log('Received webhook from Sepay');
		this.logger.debug(`Webhook payload: ${JSON.stringify(body)}`);

		// Step 1: Extract signature
		const signature = body.signature;
		if (!signature) {
			this.logger.error('Missing signature in webhook payload');
			throw new BadRequestException('Missing signature');
		}

		// Step 2: Verify signature
		const { signature: _, ...fieldsToVerify } = body;
		const isValid = this.sepayService.verifySignature(
			fieldsToVerify,
			signature,
		);

		if (!isValid) {
			this.logger.error('Invalid webhook signature');
			throw new BadRequestException('Invalid signature');
		}

		this.logger.log('Webhook signature verified successfully');

		// Step 3: Check status
		const status = body.order_status || body.status;
		if (status !== 'SUCCESS' && status !== 'COMPLETED') {
			this.logger.warn(
				`Webhook received with status: ${status}, ignoring`,
			);
			return { message: 'received' };
		}

		// Step 4: Process payment
		try {
			const result = await this.paymentService.handleWebhookSuccess({
				orderId: body.order_id || body.order_invoice_number,
				amount: body.amount || body.order_amount,
				status: 'SUCCESS',
				transactionId: body.transaction_id || body.order_id,
			});

			this.logger.log(
				`Webhook processed successfully for order ${body.order_id}`,
			);

			// Step 5: Return HTTP 200
			return { message: 'received', data: result };
		} catch (error) {
			this.logger.error('Failed to process webhook:', error);

			// Still return HTTP 200 to prevent Sepay from retrying
			return { message: 'received', error: 'Processing failed' };
		}
	}
}
