import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { Repository } from 'typeorm';
import {
	CreateTransactionDto,
	UpdateTransactionStatusDto,
} from '../dto/transaction.dto';
import { Transaction } from '../entities/transaction.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { TransactionStatus } from '../enum/subscription.enum';
import { PlanService } from './plan.service';

@Injectable()
export class TransactionService {
	constructor(
		@InjectRepository(Transaction)
		private transactionRepo: Repository<Transaction>,
		@InjectRepository(UserSubscription)
		private subscriptionRepo: Repository<UserSubscription>,
		private planService: PlanService,
	) {}

	/**
	 * Step 1: Create transaction + subscription when user initiates payment
	 * - Create UserSubscription with isActive = false
	 * - Create Transaction with status = PENDING
	 */
	async create(
		userId: string,
		dto: CreateTransactionDto,
	): Promise<Transaction> {
		// Validate plan exists
		const plan = await this.planService.findById(dto.planId);

		// Step 1a: Create UserSubscription (pending)
		const subscription = new UserSubscription();
		subscription.userId = userId;
		subscription.planId = dto.planId;
		subscription.startDate = null;
		subscription.endDate = null;
		subscription.isActive = false;
		const savedSubscription =
			await this.subscriptionRepo.save(subscription);

		// Step 1b: Create Transaction (pending)
		const transaction = new Transaction();
		transaction.userId = userId;
		transaction.subscriptionId = savedSubscription.id;
		transaction.amount = plan.price;
		transaction.currency = 'VND';
		transaction.paymentMethod = dto.paymentMethod;
		transaction.status = TransactionStatus.PENDING;
		transaction.transactionRef = null;
		transaction.paymentGatewayId = null;
		transaction.paidAt = null;

		return this.transactionRepo.save(transaction);
	}

	async findById(id: string): Promise<Transaction> {
		const transaction = await this.transactionRepo.findOne({
			where: { id },
			relations: ['subscription', 'subscription.plan'],
		});

		if (!transaction) {
			throw new ResponseError({ message: 'Transaction not found' });
		}

		return transaction;
	}

	async findByUserId(userId: string): Promise<Transaction[]> {
		return this.transactionRepo.find({
			where: { userId },
			relations: ['subscription', 'subscription.plan'],
			order: { createdAt: 'DESC' },
		});
	}

	async findByTransactionRef(
		transactionRef: string,
	): Promise<Transaction | null> {
		return this.transactionRepo.findOne({
			where: { transactionRef },
			relations: ['subscription', 'subscription.plan'],
		});
	}

	/**
	 * Step 2: Update transaction status (called by webhook)
	 */
	async updateStatus(
		id: string,
		dto: UpdateTransactionStatusDto,
	): Promise<Transaction> {
		const transaction = await this.findById(id);

		// Update transaction
		transaction.status = dto.status;
		transaction.transactionRef =
			dto.transactionRef || transaction.transactionRef;
		transaction.paymentGatewayId =
			dto.paymentGatewayId || transaction.paymentGatewayId;

		if (dto.status === TransactionStatus.SUCCESS) {
			transaction.paidAt = new Date();

			// Step 2a: Activate subscription
			const subscription = await this.subscriptionRepo.findOne({
				where: { id: transaction.subscriptionId },
				relations: ['plan'],
			});

			if (subscription) {
				const now = new Date();
				subscription.startDate = now;
				subscription.endDate = new Date(
					now.getTime() +
						subscription.plan.durationDays * 24 * 60 * 60 * 1000,
				);
				subscription.isActive = true;
				await this.subscriptionRepo.save(subscription);
			}
		}

		return this.transactionRepo.save(transaction);
	}

	/**
	 * Confirm payment (webhook callback)
	 */
	async confirm(id: string): Promise<Transaction> {
		const transaction = await this.findById(id);

		if (transaction.status !== TransactionStatus.PENDING) {
			throw new ResponseError({
				message: 'Only pending transactions can be confirmed',
			});
		}

		return this.updateStatus(id, {
			status: TransactionStatus.SUCCESS,
			transactionRef: transaction.transactionRef || undefined,
			paymentGatewayId: transaction.paymentGatewayId || undefined,
		});
	}

	/**
	 * Mark transaction as failed
	 */
	async fail(id: string): Promise<Transaction> {
		const transaction = await this.findById(id);

		if (transaction.status !== TransactionStatus.PENDING) {
			throw new ResponseError({
				message: 'Only pending transactions can be marked as failed',
			});
		}

		transaction.status = TransactionStatus.FAILED;
		return this.transactionRepo.save(transaction);
	}
}
