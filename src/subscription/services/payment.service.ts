import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SePayPgClient } from 'sepay-pg-node';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { UserStorageService } from 'src/user-storage/user-storage.service';
import { Repository } from 'typeorm';
import { UserSubscription } from '../entities/user-subscription.entity';
import { TransactionStatus } from '../enum/subscription.enum';
import { PlanService } from './plan.service';
import { TransactionService } from './transaction.service';

@Injectable()
export class PaymentService {
	private readonly logger = new Logger(PaymentService.name);

	private readonly client: SePayPgClient;

	private initializeClient() {
		return new SePayPgClient({
			env:
				process.env.SEPAY_ENV === 'production'
					? 'production'
					: 'sandbox',
			merchant_id: process.env.SEPAY_MERCHANT_ID || '',
			secret_key: process.env.SEPAY_SECRET_KEY || '',
		});
	}

	constructor(
		@InjectRepository(UserSubscription)
		private subscriptionRepo: Repository<UserSubscription>,
		private readonly planService: PlanService,
		private readonly transactionService: TransactionService,
		private readonly userStorageService: UserStorageService,
	) {
		this.client = this.initializeClient();
	}

	/**
	 * Initiate checkout process
	 * Creates Transaction and Subscription, then generates signed payment fields
	 */
	async initiateCheckout(userId: string, planId: string) {
		this.logger.log(
			`Initiating checkout for user ${userId}, plan ${planId}`,
		);

		// Step 1: Retrieve Plan
		const plan = await this.planService.findById(planId);

		// Step 2: Create or find pending subscription
		let subscription = await this.subscriptionRepo.findOne({
			where: { userId, planId, isActive: false },
		});

		if (!subscription) {
			subscription = this.subscriptionRepo.create({
				userId,
				planId,
				isActive: false,
				startDate: null,
				endDate: null,
			});
			subscription = await this.subscriptionRepo.save(subscription);
		}

		// Step 3: Create Transaction (UUID will be used as order_invoice_number)
		const transaction = await this.transactionService.create({
			userId,
			subscriptionId: subscription.id,
			amount: Number(plan.price),
			paymentMethod: 'bank_transfer',
			currency: 'VND',
		});

		this.logger.log(
			`Transaction created: ${transaction.id} for subscription ${subscription.id}`,
		);

		// Step 4: Generate signed payment fields using SePayPgClient
		const checkoutUrl = this.client.checkout.initCheckoutUrl();
		const callbackUrls = this.generateCallbackUrls(transaction.id);
		const formData = this.client.checkout.initOneTimePaymentFields({
			operation: 'PURCHASE',
			payment_method: 'BANK_TRANSFER',
			order_invoice_number: transaction.id,
			order_amount: Number(plan.price),
			currency: 'VND',
			order_description: `Subscription: ${plan.name}`,
			customer_id: userId,
			success_url: callbackUrls.success,
			error_url: callbackUrls.error,
			cancel_url: callbackUrls.cancel,
		});

		this.logger.log(
			`Payment form prepared for transaction ${transaction.id}`,
		);

		// Step 5: Return checkout data to frontend
		return {
			status: TransactionStatus.PENDING,
			transactionId: transaction.id,
			checkoutUrl,
			formData,
			subscription: {
				id: subscription.id,
				planName: plan.name,
				amount: plan.price,
				durationDays: plan.durationDays,
			},
		};
	}

	/**
	 * Handle webhook success from Sepay
	 * Updates Transaction and activates Subscription
	 */
	async handleWebhookSuccess(data: {
		orderId: string;
		amount: number;
		status: string;
		transactionId: string;
	}) {
		this.logger.log(`Processing webhook for orderId: ${data.orderId}`);

		// Step 1: Update Transaction to SUCCESS
		const transaction = await this.transactionService.markAsSuccess(
			data.orderId,
			data.transactionId,
		);

		// Step 2: Check if already processed (idempotency)
		if (transaction.status === TransactionStatus.SUCCESS) {
			const subscription = await this.subscriptionRepo.findOne({
				where: { id: transaction.subscriptionId },
			});

			if (subscription?.isActive) {
				this.logger.log(
					`Transaction ${data.orderId} already processed`,
				);
				return {
					message: 'Transaction already processed',
					subscription,
				};
			}
		}

		// Step 3: Activate Subscription
		const subscription = await this.activateSubscription(
			transaction.subscriptionId,
		);

		this.logger.log(
			`Subscription ${subscription.id} activated successfully`,
		);

		return {
			message: 'Payment processed successfully',
			subscription,
		};
	}

	/**
	 * Activate subscription and grant storage quota
	 */
	private async activateSubscription(
		subscriptionId: string,
	): Promise<UserSubscription> {
		const subscription = await this.subscriptionRepo.findOne({
			where: { id: subscriptionId },
			relations: ['plan'],
		});

		if (!subscription) {
			throw new ResponseError({ message: 'Subscription not found' });
		}

		// Calculate start and end dates
		const startDate = new Date();
		const endDate = new Date();
		endDate.setDate(endDate.getDate() + subscription.plan.durationDays);

		// Update subscription
		subscription.isActive = true;
		subscription.startDate = startDate;
		subscription.endDate = endDate;

		await this.subscriptionRepo.save(subscription);

		// Grant storage quota to user
		await this.userStorageService.resetBonus({
			userId: subscription.userId,
		});
		await this.userStorageService.addBonus({
			userId: subscription.userId,
			size: subscription.plan.storageLimit,
		});

		this.logger.log(
			`Storage granted: ${subscription.plan.storageLimit} bytes for user ${subscription.userId}`,
		);

		return subscription;
	}

	/**
	 * Check payment status (for frontend polling)
	 */
	async checkPaymentStatus(transactionId: string) {
		const transaction =
			await this.transactionService.findById(transactionId);

		return {
			transactionId: transaction.id,
			status: transaction.status,
			amount: transaction.amount,
			paidAt: transaction.paidAt,
			subscription: transaction.subscription
				? {
						id: transaction.subscription.id,
						isActive: transaction.subscription.isActive,
						startDate: transaction.subscription.startDate,
						endDate: transaction.subscription.endDate,
						plan: transaction.subscription.plan,
					}
				: null,
		};
	}

	initCheckoutUrl() {
		const checkoutURL = this.client.checkout.initCheckoutUrl();
		return checkoutURL;
	}

	initOneTimePaymentFields() {
		const checkoutFormfields =
			this.client.checkout.initOneTimePaymentFields({
				operation: 'PURCHASE',
				payment_method: 'BANK_TRANSFER',
				// hoặc
				// payment_method: 'NAPAS_BANK_TRANSFER',
				order_invoice_number: 'INV_001',
				order_amount: 29000,
				currency: 'VND',
				order_description: 'Thanh toán gói Basic 100GB',
				customer_id: 'user-123',
				success_url: 'https://example.com/success',
				error_url: 'https://example.com/error',
				cancel_url: 'https://example.com/cancel',
				custom_data: 'optional',
			});

		return checkoutFormfields;
	}

	/**
	 * Generate callback URLs with transaction ID appended as query parameter
	 *
	 * @param transactionId - UUID of the transaction to include in callback URLs
	 * @returns Object containing success, error, and cancel URLs with transaction ID parameter
	 */
	private generateCallbackUrls(transactionId: string) {
		const baseUrls = {
			success: process.env.SEPAY_SUCCESS_URL || '',
			error: process.env.SEPAY_ERROR_URL || '',
			cancel: process.env.SEPAY_CANCEL_URL || '',
		};

		return {
			success: this.appendTransactionId(baseUrls.success, transactionId),
			error: this.appendTransactionId(baseUrls.error, transactionId),
			cancel: this.appendTransactionId(baseUrls.cancel, transactionId),
		};
	}

	/**
	 * Append transaction ID to URL as query parameter
	 *
	 * @param url - Base URL to append transaction ID to
	 * @param transactionId - Transaction ID to append as query parameter
	 * @returns URL with transaction ID appended as 'transactionId' query parameter
	 */
	private appendTransactionId(url: string, transactionId: string): string {
		if (!url) return '';

		const separator = url.includes('?') ? '&' : '?';
		return `${url}${separator}transactionId=${transactionId}`;
	}

	/**
	 * Get transaction detail with access control
	 *
	 * @param transactionId - UUID of the transaction to retrieve
	 * @param userId - ID of the user requesting the transaction
	 * @returns Complete transaction details with subscription and plan information
	 * @throws ResponseError with status 400 for invalid transaction ID format
	 * @throws ResponseError with status 403 for access denied
	 * @throws ResponseError with status 404 for transaction not found
	 * @throws ResponseError with status 500 for server errors
	 */
	async getTransactionDetail(transactionId: string, userId: string) {
		const transaction =
			await this.transactionService.findByIdWithDetails(transactionId);

		// Access control: ensure user can only access their own transactions
		if (transaction.userId !== userId) {
			throw new ResponseError({
				message:
					'Access denied: You can only view your own transactions',
				statusCode: 403,
			});
		}

		return {
			id: transaction.id,
			userId: transaction.userId,
			amount: transaction.amount,
			currency: transaction.currency,
			paymentMethod: transaction.paymentMethod,
			status: transaction.status,
			transactionRef: transaction.transactionRef,
			paymentGatewayId: transaction.paymentGatewayId,
			paidAt: transaction.paidAt,
			createdAt: transaction.createdAt,
			updatedAt: transaction.updatedAt,
			subscription: transaction.subscription
				? {
						id: transaction.subscription.id,
						isActive: transaction.subscription.isActive,
						startDate: transaction.subscription.startDate,
						endDate: transaction.subscription.endDate,
						plan: transaction.subscription.plan
							? {
									id: transaction.subscription.plan.id,
									name: transaction.subscription.plan.name,
									price: transaction.subscription.plan.price,
									durationDays:
										transaction.subscription.plan
											.durationDays,
									storageLimit:
										transaction.subscription.plan
											.storageLimit,
								}
							: null,
					}
				: null,
		};
	}

	/**
	 * Get user's transaction history
	 */
	async getTransactionHistory(userId: string) {
		const transactions = await this.transactionService.findByUserId(userId);

		return transactions.map((transaction) => ({
			id: transaction.id,
			amount: transaction.amount,
			currency: transaction.currency,
			status: transaction.status,
			paymentMethod: transaction.paymentMethod,
			paymentGatewayId: transaction.paymentGatewayId,
			createdAt: transaction.createdAt,
			paidAt: transaction.paidAt,
			subscription: transaction.subscription
				? {
						id: transaction.subscription.id,
						isActive: transaction.subscription.isActive,
						startDate: transaction.subscription.startDate,
						endDate: transaction.subscription.endDate,
						plan: transaction.subscription.plan
							? {
									id: transaction.subscription.plan.id,
									name: transaction.subscription.plan.name,
									price: transaction.subscription.plan.price,
									durationDays:
										transaction.subscription.plan
											.durationDays,
									storageLimit:
										transaction.subscription.plan
											.storageLimit,
								}
							: null,
					}
				: null,
		}));
	}
}
