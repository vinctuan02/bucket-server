import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanController } from './controllers/plan.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { TransactionController } from './controllers/transaction.controller';
import { Plan } from './entities/plan.entity';
import { Transaction } from './entities/transaction.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { PlanService } from './services/plan.service';
import { SubscriptionService } from './services/subscription.service';
import { TransactionService } from './services/transaction.service';

@Module({
	imports: [TypeOrmModule.forFeature([Plan, UserSubscription, Transaction])],
	providers: [PlanService, SubscriptionService, TransactionService],
	controllers: [
		PlanController,
		SubscriptionController,
		TransactionController,
	],
	exports: [PlanService, SubscriptionService, TransactionService],
})
export class SubscriptionModule {}
