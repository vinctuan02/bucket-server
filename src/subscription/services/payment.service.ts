import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { UserStorageService } from 'src/user-storage/user-storage.service';
import { Repository } from 'typeorm';
import { UserSubscription } from '../entities/user-subscription.entity';
import { TransactionStatus } from '../enum/subscription.enum';
import { PlanService } from './plan.service';
import { SePayService } from './sepay.service';
import { TransactionService } from './transaction.service';

@Injectable()
export class PaymentService {
	private readonly logger = new Logger(PaymentService.name);

	constructor(
		@InjectRepository(UserSubscription)
		private subscriptionRepo: Repository<UserSubscription>,
		private readonly planService: PlanService,
		private readonly transactionService: TransactionService,
		private readonly sepayService: SePayService,
		private readonly userStorageService: UserStorageService,
	) {}

	/**
	 * 🎯 GIAI ĐOẠN I: Khởi tạo Đơn hàng (Demo mode - không cần SePay)
	 */
	async initiateCheckoutDemo(userId: string, planId: string) {
		this.logger.log(
			`Initiating DEMO checkout for user ${userId}, plan ${planId}`,
		);

		const subscription = await this.createOrFindPendingSubscription(
			userId,
			planId,
		);

		const plan = await this.planService.findById(planId);

		const transaction = await this.transactionService.create({
			userId,
			subscriptionId: subscription.id,
			amount: Number(plan.price),
			paymentMethod: 'demo',
		});

		// Demo mode - trả về URL demo
		const demoUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3001')}/payment/demo?transactionId=${transaction.id}`;

		return {
			status: TransactionStatus.PENDING,
			transactionId: transaction.id,
			paymentInfo: {
				checkoutUrl: demoUrl,
				checkoutFields: { transactionId: transaction.id },
				qrCodeData: '',
				description: `Demo thanh toan ${transaction.id}`,
				bankInfo: {
					bankName: 'Demo Bank',
					accountNumber: '1234567890',
					accountName: 'Demo Account',
				},
			},
			subscription: {
				id: subscription.id,
				planName: plan.name,
				amount: plan.price,
				durationDays: plan.durationDays,
			},
		};
	}

	/**
	 * 🎯 GIAI ĐOẠN I: Khởi tạo Đơn hàng (SePay thật)
	 */
	async initiateCheckout(userId: string, planId: string) {
		this.logger.log(
			`Initiating checkout for user ${userId}, plan ${planId}`,
		);

		const subscription = await this.createOrFindPendingSubscription(
			userId,
			planId,
		);

		const plan = await this.planService.findById(planId);

		const transaction = await this.transactionService.create({
			userId,
			subscriptionId: subscription.id,
			amount: Number(plan.price),
			paymentMethod: 'bank_transfer',
		});

		const paymentInfo = await this.sepayService.createPayment(
			transaction.id,
			Number(plan.price),
		);

		return {
			status: TransactionStatus.PENDING,
			transactionId: transaction.id,
			paymentInfo: {
				checkoutUrl: paymentInfo.checkoutUrl,
				checkoutFields: paymentInfo.checkoutFields,
				qrCodeData: '',
				description: `Thanh toan ${transaction.id}`,
				bankInfo: {
					bankName: 'Theo hướng dẫn của SePay',
					accountNumber: 'Sẽ hiển thị sau khi checkout',
					accountName: 'SePay',
				},
			},
			subscription: {
				id: subscription.id,
				planName: plan.name,
				amount: plan.price,
				durationDays: plan.durationDays,
			},
		};
	}

	/**
	 * Tạo hoặc tìm subscription pending cho user
	 */
	private async createOrFindPendingSubscription(
		userId: string,
		planId: string,
	): Promise<UserSubscription> {
		// Tìm subscription pending hiện tại
		let subscription = await this.subscriptionRepo.findOne({
			where: {
				userId,
				planId,
				isActive: false,
			},
		});

		// Nếu chưa có, tạo mới
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

		return subscription;
	}

	/**
	 * 🔒 GIAI ĐOẠN III: Xác nhận Tự động (Webhook Handler)
	 * Xử lý webhook từ SePay khi thanh toán thành công
	 */
	async handleWebhookSuccess(data: {
		orderId: string;
		amount: number;
		status: string;
		transactionId: string;
	}) {
		this.logger.log(`Processing webhook for orderId: ${data.orderId}`);

		// Bước 13: Cập nhật Transaction
		const transaction = await this.transactionService.markAsSuccess(
			data.orderId,
			data.transactionId,
		);

		// Kiểm tra nếu đã được xử lý rồi
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

		// Bước 14: Kích hoạt Subscription
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
	 * Kích hoạt subscription và cấp storage cho user
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

		// Tính toán startDate và endDate
		const startDate = new Date();
		const endDate = new Date();
		endDate.setDate(endDate.getDate() + subscription.plan.durationDays);

		// Cập nhật subscription
		subscription.isActive = true;
		subscription.startDate = startDate;
		subscription.endDate = endDate;

		await this.subscriptionRepo.save(subscription);

		// Cấp storage cho user
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
	 * Kiểm tra trạng thái thanh toán (cho frontend polling)
	 */
	async checkPaymentStatus(transactionId: string) {
		const transaction =
			await this.transactionService.findById(transactionId);

		return {
			transactionId: transaction.id,
			status: transaction.status,
			amount: transaction.amount,
			paidAt: transaction.paidAt,
			subscription: transaction.subscription,
		};
	}
}
