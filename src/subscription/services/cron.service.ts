import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class CronService {
	private readonly logger = new Logger(CronService.name);

	constructor(private subscriptionService: SubscriptionService) {}

	/**
	 * Run every 1 hour to deactivate expired subscriptions
	 */
	@Cron(CronExpression.EVERY_HOUR)
	async handleExpiredSubscriptions(): Promise<void> {
		try {
			const count =
				await this.subscriptionService.deactivateExpiredSubscriptions();
			this.logger.log(`Deactivated ${count} expired subscriptions`);
		} catch (error) {
			this.logger.error(
				'Error deactivating expired subscriptions',
				error,
			);
		}
	}
}
