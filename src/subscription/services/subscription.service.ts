import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubscriptionDto } from '../dto/subscription.dto';
import { UserSubscription } from '../entities/user-subscription.entity';
import { PlanService } from './plan.service';

@Injectable()
export class SubscriptionService {
	constructor(
		@InjectRepository(UserSubscription)
		private subscriptionRepo: Repository<UserSubscription>,
		private planService: PlanService,
	) {}

	async create(
		userId: string,
		dto: CreateSubscriptionDto,
	): Promise<UserSubscription> {
		const plan = await this.planService.findById(dto.planId);
		if (!plan) {
			throw new Error('Plan not found');
		}

		const startDate = new Date();
		const endDate = new Date();
		endDate.setDate(endDate.getDate() + plan.durationDays);

		const subscription = this.subscriptionRepo.create({
			userId,
			planId: dto.planId,
			startDate,
			endDate,
			isActive: true,
		});

		return this.subscriptionRepo.save(subscription);
	}

	async findByUserId(userId: string): Promise<UserSubscription[]> {
		return this.subscriptionRepo.find({
			where: { userId },
			relations: { plan: true },
		});
	}

	async findActiveByUserId(userId: string): Promise<UserSubscription | null> {
		return this.subscriptionRepo.findOne({
			where: {
				userId,
				isActive: true,
			},
			relations: { plan: true },
		});
	}

	async findById(id: string): Promise<UserSubscription | null> {
		return this.subscriptionRepo.findOne({
			where: { id },
			relations: { plan: true },
		});
	}

	async deactivateExpired(): Promise<void> {
		const now = new Date();
		await this.subscriptionRepo
			.createQueryBuilder()
			.update(UserSubscription)
			.set({ isActive: false })
			.where('endDate < :now', { now })
			.andWhere('isActive = true')
			.execute();
	}

	async getUserStorageLimit(userId: string): Promise<number> {
		const subscription = await this.findActiveByUserId(userId);
		if (!subscription) {
			return 0;
		}
		return subscription.plan.storageLimit;
	}
}
