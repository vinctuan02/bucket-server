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
import { SubscriptionService } from './subscription.service';

@Injectable()
export class TransactionService {
	constructor(
		@InjectRepository(Transaction)
		private transactionRepo: Repository<Transaction>,
		@InjectRepository(UserSubscription)
		private subscriptionRepo: Repository<UserSubscription>,
		private subscriptionService: SubscriptionService,
	) {}

	async create(
		userId: string,
		dto: CreateTransactionDto,
	): Promise<Transaction> {
		const subscription = await this.subscriptionService.findById(
			dto.subscriptionId,
		);
		if (!subscription) {
			throw new Error('Subscription not found');
		}

		const transaction = this.transactionRepo.create({
			userId,
			subscriptionId: dto.subscriptionId,
			amount: subscription.plan.price,
			currency: dto.currency || 'VND',
			paymentMethod: dto.paymentMethod,
			status: TransactionStatus.PENDING,
		});

		return this.transactionRepo.save(transaction);
	}

	async findById(id: string): Promise<Transaction> {
		const e = await this.transactionRepo.findOne({ where: { id } });
		if (!e) {
			throw new ResponseError({ message: 'Transaction not found' });
		}

		return e;
	}

	async findByUserId(userId: string): Promise<Transaction[]> {
		return this.transactionRepo.find({
			where: { userId },
			order: { createdAt: 'DESC' },
		});
	}

	async updateStatus(
		id: string,
		dto: UpdateTransactionStatusDto,
	): Promise<Transaction | null> {
		await this.transactionRepo.update(id, {
			status: dto.status,
			transactionRef: dto.transactionRef,
		});
		return this.findById(id);
	}

	async confirm(transactionId: string): Promise<Transaction | null> {
		const transaction = await this.findById(transactionId);
		if (!transaction) {
			throw new Error('Transaction not found');
		}

		await this.transactionRepo.update(transactionId, {
			status: TransactionStatus.SUCCESS,
		});
		await this.subscriptionRepo.update(transaction.subscriptionId, {
			isActive: true,
		});

		return this.findById(transactionId);
	}

	async fail(transactionId: string): Promise<Transaction | null> {
		return this.updateStatus(transactionId, {
			status: TransactionStatus.FAILED,
		});
	}
}
