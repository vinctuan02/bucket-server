import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmUtilsModule } from 'src/orm-utils/orm-utils.module';
import { UserStorageModule } from 'src/user-storage/user-storage.module';
import { PlanController } from './controllers/plan.controller';
import { SeaPayController } from './controllers/sea-pay.controller';
import { Plan } from './entities/plan.entity';
import { Transaction } from './entities/transaction.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { PlanService } from './services/plan.service';
import { SeaPayService } from './services/sea-pay.service';
import { SubscriptionService } from './services/subscription.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Plan, UserSubscription, Transaction]),
		OrmUtilsModule,
		ScheduleModule.forRoot(),
		UserStorageModule,
	],
	providers: [PlanService, SubscriptionService, SeaPayService],
	controllers: [PlanController, SeaPayController],
	exports: [PlanService, SubscriptionService],
})
export class SubscriptionModule {}
