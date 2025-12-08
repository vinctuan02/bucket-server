// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { ResponseError } from 'src/common/dto/common.response-dto';
// import { UserStorageService } from 'src/user-storage/user-storage.service';
// import { LessThan, Repository } from 'typeorm';
// import { CreateSubscriptionDto } from '../dto/subscription.dto';
// import { UserSubscription } from '../entities/user-subscription.entity';
// import { PlanService } from './plan.service';

// @Injectable()
// export class SubscriptionService {
// 	constructor(
// 		@InjectRepository(UserSubscription)
// 		private subscriptionRepo: Repository<UserSubscription>,

// 		private readonly planService: PlanService,
// 		private readonly userStorageService: UserStorageService,
// 	) {}

// 	async create(userId: string, dto: CreateSubscriptionDto) {
// 		const plan = await this.planService.findById(dto.planId);

// 		await this.userStorageService.resetBonus({ userId });
// 		await this.userStorageService.addBonus({
// 			userId,
// 			size: plan.storageLimit,
// 		});

// 		const data = this.subscriptionRepo.create({ ...dto, userId });
// 		return await this.subscriptionRepo.save(data);
// 	}

// 	async findById(id: string): Promise<UserSubscription> {
// 		const subscription = await this.subscriptionRepo.findOne({
// 			where: { id },
// 			relations: ['plan'],
// 		});

// 		if (!subscription) {
// 			throw new ResponseError({ message: 'Subscription not found' });
// 		}

// 		return subscription;
// 	}

// 	async findByUserId(userId: string): Promise<UserSubscription[]> {
// 		return this.subscriptionRepo.find({
// 			where: { userId },
// 			relations: ['plan'],
// 			order: { createdAt: 'DESC' },
// 		});
// 	}

// 	async findActiveByUserId(userId: string): Promise<UserSubscription> {
// 		const subscription = await this.subscriptionRepo.findOne({
// 			where: { userId, isActive: true },
// 			relations: ['plan'],
// 		});

// 		if (!subscription) {
// 			throw new ResponseError({
// 				message: 'No active subscription found',
// 			});
// 		}

// 		return subscription;
// 	}

// 	async getActiveSubscription(
// 		userId: string,
// 	): Promise<UserSubscription | null> {
// 		return this.subscriptionRepo.findOne({
// 			where: { userId, isActive: true },
// 			relations: ['plan'],
// 		});
// 	}

// 	/**
// 	 * Cron job: Deactivate expired subscriptions
// 	 * Run every 1 hour
// 	 */
// 	async deactivateExpiredSubscriptions(): Promise<number> {
// 		const now = new Date();

// 		const result = await this.subscriptionRepo.update(
// 			{
// 				isActive: true,
// 				endDate: LessThan(now),
// 			},
// 			{ isActive: false },
// 		);

// 		return result.affected || 0;
// 	}
// }
