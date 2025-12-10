import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseError } from 'src/common/dto/common.response-dto';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { TransactionStatus } from '../enum/subscription.enum';

@Injectable()
export class TransactionService {
	constructor(
		@InjectRepository(Transaction)
		private transactionRepo: Repository<Transaction>,
	) {}

	/**
	 * Tạo transaction mới với trạng thái PENDING
	 */
	async create(data: {
		userId: string;
		subscriptionId: string;
		amount: number;
		paymentMethod: string;
		currency?: string;
	}): Promise<Transaction> {
		const transaction = this.transactionRepo.create({
			...data,
			currency: data.currency || 'VND',
			status: TransactionStatus.PENDING,
		});

		return await this.transactionRepo.save(transaction);
	}

	/**
	 * Tìm transaction theo ID (orderId)
	 */
	async findById(id: string): Promise<Transaction> {
		const transaction = await this.transactionRepo.findOne({
			where: { id },
			relations: ['subscription', 'subscription.plan', 'user'],
		});

		if (!transaction) {
			throw new ResponseError({ message: 'Transaction not found' });
		}

		return transaction;
	}

	/**
	 * Tìm transaction theo ID với đầy đủ thông tin chi tiết
	 */
	async findByIdWithDetails(id: string): Promise<Transaction> {
		const transaction = await this.transactionRepo.findOne({
			where: { id },
			relations: ['subscription', 'subscription.plan', 'user'],
		});

		if (!transaction) {
			throw new ResponseError({ message: 'Transaction not found' });
		}

		return transaction;
	}

	/**
	 * Cập nhật trạng thái transaction thành SUCCESS
	 */
	async markAsSuccess(
		transactionId: string,
		paymentGatewayId: string,
	): Promise<Transaction> {
		const transaction = await this.findById(transactionId);

		if (transaction.status === TransactionStatus.SUCCESS) {
			// Đã được xử lý rồi, tránh duplicate webhook
			return transaction;
		}

		transaction.status = TransactionStatus.SUCCESS;
		transaction.paymentGatewayId = paymentGatewayId;
		transaction.paidAt = new Date();

		return await this.transactionRepo.save(transaction);
	}

	/**
	 * Cập nhật trạng thái transaction thành FAILED
	 */
	async markAsFailed(transactionId: string): Promise<Transaction> {
		const transaction = await this.findById(transactionId);

		transaction.status = TransactionStatus.FAILED;

		return await this.transactionRepo.save(transaction);
	}

	/**
	 * Lấy danh sách transaction của user
	 */
	async findByUserId(userId: string): Promise<Transaction[]> {
		return this.transactionRepo.find({
			where: { userId },
			relations: ['subscription', 'subscription.plan'],
			order: { createdAt: 'DESC' },
		});
	}
}
