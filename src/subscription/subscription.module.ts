import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmUtilsModule } from 'src/orm-utils/orm-utils.module';
import { UserStorageModule } from 'src/user-storage/user-storage.module';
import { PaymentDemoController } from './controllers/payment-demo.controller';
import { PaymentController } from './controllers/payment.controller';
import { PlanController } from './controllers/plan.controller';
import { SePayWebhookController } from './controllers/sepay-webhook.controller';
import { Plan } from './entities/plan.entity';
import { Transaction } from './entities/transaction.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { PaymentService } from './services/payment.service';
import { PlanService } from './services/plan.service';
import { SePayService } from './services/sepay.service';
import { SubscriptionService } from './services/subscription.service';
import { TransactionService } from './services/transaction.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Plan, UserSubscription, Transaction]),
		OrmUtilsModule,
		ScheduleModule.forRoot(),
		UserStorageModule,
	],
	providers: [
		PlanService,
		SubscriptionService,
		SePayService,
		TransactionService,
		PaymentService,
	],
	controllers: [
		PlanController,
		PaymentController,
		SePayWebhookController,
		PaymentDemoController,
	],
	exports: [PlanService, SubscriptionService, PaymentService],
})
export class SubscriptionModule {}
