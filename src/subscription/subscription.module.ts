import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmUtilsModule } from 'src/orm-utils/orm-utils.module';
import { PlanController } from './controllers/plan.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { TransactionController } from './controllers/transaction.controller';
import { WebhookController } from './controllers/webhook.controller';
import { Plan } from './entities/plan.entity';
import { Transaction } from './entities/transaction.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { CronService } from './services/cron.service';
import { MomoGateway } from './services/gateways/momo.gateway';
import { StripeGateway } from './services/gateways/stripe.gateway';
import { PaymentService } from './services/payment.service';
import { PlanService } from './services/plan.service';
import { SubscriptionService } from './services/subscription.service';
import { TransactionService } from './services/transaction.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Plan, UserSubscription, Transaction]),
		OrmUtilsModule,
		ScheduleModule.forRoot(),
	],
	providers: [
		PlanService,
		SubscriptionService,
		TransactionService,
		PaymentService,
		CronService,
		MomoGateway,
		StripeGateway,
	],
	controllers: [
		PlanController,
		SubscriptionController,
		TransactionController,
		WebhookController,
	],
	exports: [
		PlanService,
		SubscriptionService,
		TransactionService,
		PaymentService,
	],
})
export class SubscriptionModule {}
