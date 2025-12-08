import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { UserStorageService } from 'src/user-storage/user-storage.service';
import { Repository } from 'typeorm';
import { UserSubscription } from '../entities/user-subscription.entity';
import { TransactionStatus } from '../enum/subscription.enum';
import { PlanService } from './plan.service';
import { SepayService } from './sepay.service';
import { TransactionService } from './transaction.service';

@Injectable()
export class PaymentService {
	private readonly logger = new Logger(PaymentService.name);

	constructor(
		@InjectRepository(UserSubscription)
		private subscriptionRepo: Repository<UserSubscription>,
		private readonly planService: PlanService,
		private readonly transactionService: TransactionService,
		private readonly sepayService: SepayService,
		private readonly userStorageService: UserStorageService,
	) {}

	/**
	 * Initiate checkout process
	 * Creates Transaction and Subscription, then calls Sepay API
	 */
	async initiateCheckout(userId: string, planId: string) {
		this.logger.log(
			`Initiating checkout for user ${userId}, plan ${planId}`,
		);

		// Step 1: Retrieve Plan
		const plan = await this.planService.findById(planId);

		// Step 2: Create or find pending subscription
		let subscription = await this.subscriptionRepo.findOne({
			where: {
				userId,
				planId,
				isActive: false,
			},
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

		// Step 3: Create Transaction (UUID will be used as order_id)
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

		// Step 4: Call Sepay API to initiate payment
		try {
			const orderInfo = `Thanh toan goi ${plan.name}`;
			const paymentInfo = await this.sepayService.initiatePayment(
				transaction.id,
				Number(plan.price),
				orderInfo,
			);

			this.logger.log(
				`Payment initiated successfully for transaction ${transaction.id}`,
			);

			// Step 5: Return payment info to client
			return {
				status: TransactionStatus.PENDING,
				transactionId: transaction.id,
				paymentInfo: {
					paymentUrl: paymentInfo.paymentUrl,
					description: orderInfo,
				},
				subscription: {
					id: subscription.id,
					planName: plan.name,
					amount: plan.price,
					durationDays: plan.durationDays,
				},
			};
		} catch (error) {
			// Update transaction status to ERROR if Sepay API fails
			this.logger.error(
				`Failed to initiate payment for transaction ${transaction.id}`,
				error,
			);

			await this.transactionService.findById(transaction.id).then((t) => {
				t.status = TransactionStatus.ERROR;
				return this.transactionService['transactionRepo'].save(t);
			});

			throw new ResponseError({
				message: 'Failed to initiate payment with Sepay',
			});
		}
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
}
