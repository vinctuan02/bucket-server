import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import services and controller
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { ShareLink } from 'src/share-link/entities/share-link.entity';
import { UserSubscription } from 'src/subscription/entities/user-subscription.entity';
import { UserStorage } from 'src/user-storage/entities/user-storage.entity';
import { User } from 'src/users/entities/user.entity';
import { Transaction } from '../subscription/entities/transaction.entity';
import { DashboardController } from './dashboard.controller';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { DailyMetrics } from './entities/daily-metrics.entity';
import { DashboardAnalyticsRealService } from './services/dashboard-analytics-real.service';
import { DashboardMetricsRealService } from './services/dashboard-metrics-real.service';
import { DashboardService } from './services/dashboard.service';
import { DashboardTestController } from './test.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			FileNode,
			User,
			ShareLink,
			UserStorage,
			Transaction,
			UserSubscription,
			AnalyticsEvent,
			DailyMetrics,
		]),
	],
	controllers: [DashboardController, DashboardTestController],
	providers: [
		DashboardService,
		DashboardMetricsRealService,
		DashboardAnalyticsRealService,
	],
	exports: [DashboardService],
})
export class DashboardModule {}
