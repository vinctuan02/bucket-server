import { Body, Controller, Headers, Logger, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
	ResponseError,
	ResponseSuccess,
} from 'src/common/dto/common.response-dto';
import { PaymentMethod, TransactionStatus } from '../enum/subscription.enum';
import { PaymentService } from '../services/payment.service';
import { TransactionService } from '../services/transaction.service';

@ApiTags('Subscription - Webhooks')
@Controller('subscription/webhooks')
export class WebhookController {
	private readonly logger = new Logger(WebhookController.name);

	constructor(
		private transactionService: TransactionService,
		private paymentService: PaymentService,
	) {}

	/**
	 * Generic webhook handler for all payment gateways
	 * Each gateway sends data to: POST /subscription/webhooks/:method
	 */
	@Post(':method')
	@ApiOperation({ summary: 'Handle payment gateway webhook' })
	@ApiBody({ schema: { type: 'object' } })
	@ApiResponse({ status: 200, description: 'Webhook processed successfully' })
	@ApiResponse({ status: 400, description: 'Invalid webhook signature' })
	async handleWebhook(
		@Body() payload: Record<string, any>,
		@Headers('x-signature') signature: string,
		@Headers('x-method') method: string,
	) {
		try {
			// Validate payment method
			if (
				!Object.values(PaymentMethod).includes(method as PaymentMethod)
			) {
				throw new ResponseError({ message: 'Invalid payment method' });
			}

			const paymentMethod = method as PaymentMethod;

			// Verify webhook signature
			const isValid = this.paymentService.verifyWebhookSignature(
				paymentMethod,
				payload,
				signature,
			);

			if (!isValid) {
				this.logger.warn(
					`Invalid webhook signature for ${paymentMethod}`,
				);
				throw new ResponseError({
					message: 'Invalid webhook signature',
				});
			}

			// Parse webhook payload
			const webhookData = this.paymentService.parseWebhookPayload(
				paymentMethod,
				payload,
			);

			// Find transaction by reference
			const transaction =
				await this.transactionService.findByTransactionRef(
					webhookData.transactionRef,
				);

			if (!transaction) {
				this.logger.warn(
					`Transaction not found: ${webhookData.transactionRef}`,
				);
				throw new ResponseError({ message: 'Transaction not found' });
			}

			// Update transaction status based on webhook
			const status =
				webhookData.status === 'success'
					? TransactionStatus.SUCCESS
					: webhookData.status === 'failed'
						? TransactionStatus.FAILED
						: TransactionStatus.PENDING;

			await this.transactionService.updateStatus(transaction.id, {
				status,
				transactionRef: webhookData.transactionRef,
				paymentGatewayId: webhookData.paymentGatewayId,
			});

			this.logger.log(
				`Webhook processed: ${webhookData.transactionRef} - ${status}`,
			);

			return new ResponseSuccess({
				data: { transactionRef: webhookData.transactionRef, status },
			});
		} catch (error) {
			this.logger.error('Webhook processing error', error);
			throw error;
		}
	}
}
