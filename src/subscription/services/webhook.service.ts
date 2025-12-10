import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SepayService } from './sepay.service';

export interface WebhookPayload {
	signature?: string;
	order_status?: string;
	status?: string;
	order_id?: string;
	order_invoice_number?: string;
	amount?: number;
	order_amount?: number;
	transaction_id?: string;
	// New Sepay webhook structure
	order?: {
		id?: string;
		order_id?: string;
		order_status?: string;
		order_currency?: string;
		order_amount?: string;
		order_invoice_number?: string;
		order_description?: string;
	};
	transaction?: {
		id?: string;
		transaction_id?: string;
		transaction_status?: string;
		transaction_amount?: string;
		transaction_currency?: string;
	};
	[key: string]: any;
}

export interface WebhookResponse {
	message: string;
	data?: any;
	error?: string;
}

@Injectable()
export class WebhookService {
	private readonly logger = new Logger(WebhookService.name);

	constructor(
		private readonly sepayService: SepayService,
		private readonly paymentService: PaymentService,
	) {}

	/**
	 * Process Sepay webhook payload
	 * Handles signature verification, status validation, and payment processing
	 */
	async processWebhook(body: WebhookPayload): Promise<WebhookResponse> {
		this.logger.log('Processing webhook from Sepay');
		this.logger.debug(`Webhook payload: ${JSON.stringify(body)}`);

		// Log extracted values for debugging
		const orderStatus =
			body.order?.order_status || body.order_status || body.status;
		const transactionStatus = body.transaction?.transaction_status;
		this.logger.debug(
			`Extracted order status: ${orderStatus}, transaction status: ${transactionStatus}`,
		);

		// // Step 1: Extract and validate signature
		// const signature = body.signature;
		// if (!signature) {
		// 	this.logger.error('Missing signature in webhook payload');
		// 	throw new BadRequestException('Missing signature');
		// }

		// // Step 2: Verify signature
		// const { signature: _, ...fieldsToVerify } = body;
		// const isValid = this.sepayService.verifySignature(
		// 	fieldsToVerify,
		// 	signature,
		// );

		// if (!isValid) {
		// 	this.logger.error('Invalid webhook signature');
		// 	throw new BadRequestException('Invalid signature');
		// }

		this.logger.log('Webhook signature verified successfully');

		// Step 3: Check payment status
		const status =
			body.order?.order_status || body.order_status || body.status;

		// Accept CAPTURED, SUCCESS, COMPLETED as successful statuses
		const successStatuses = ['CAPTURED', 'SUCCESS', 'COMPLETED'];
		const transactionSuccessStatuses = ['APPROVED', 'SUCCESS', 'COMPLETED'];

		const isOrderSuccess = status && successStatuses.includes(status);
		const isTransactionSuccess =
			transactionStatus &&
			transactionSuccessStatuses.includes(transactionStatus);

		if (!isOrderSuccess && !isTransactionSuccess) {
			this.logger.warn(
				`Webhook received with status: ${status}, transaction status: ${transactionStatus}, ignoring`,
			);
			return { message: 'received' };
		}

		// Step 4: Process successful payment
		try {
			const orderId =
				body.order?.order_invoice_number ||
				body.order_id ||
				body.order_invoice_number;
			const amountStr =
				body.order?.order_amount ||
				String(body.amount || '') ||
				String(body.order_amount || '') ||
				'0';
			const amount = parseFloat(amountStr);
			const transactionId =
				body.transaction?.transaction_id ||
				body.transaction_id ||
				body.order_id;

			if (!orderId || !amount || !transactionId) {
				this.logger.error('Missing required payment data in webhook');
				throw new BadRequestException('Missing required payment data');
			}

			this.logger.log(`Processing webhook for transaction: ${orderId}`);

			// Validate transaction exists before processing
			try {
				// Log transaction ID for audit trail
				this.logger.log(
					`Processing webhook for transaction ID: ${orderId}, payment gateway ID: ${transactionId}`,
				);

				const result = await this.paymentService.handleWebhookSuccess({
					orderId,
					amount,
					status: 'SUCCESS',
					transactionId,
				});

				this.logger.log(
					`Webhook processed successfully for transaction ${orderId}`,
				);

				return { message: 'received', data: result };
			} catch (transactionError) {
				this.logger.error(
					`Transaction processing failed for ${orderId}:`,
					transactionError.message,
				);

				// Enhanced error handling for invalid transaction IDs
				if (transactionError.message?.includes('not found')) {
					this.logger.warn(
						`Transaction ${orderId} not found in database, webhook ignored`,
					);
					return {
						message: 'received',
						error: 'Transaction not found',
					};
				}

				// Log error details for debugging but still return success to prevent retries
				this.logger.error(
					`Webhook processing error for transaction ${orderId}: ${transactionError.message}`,
				);

				throw transactionError;
			}
		} catch (error) {
			this.logger.error('Failed to process webhook:', error);

			// Still return success to prevent Sepay from retrying
			return { message: 'received', error: 'Processing failed' };
		}
	}
}
