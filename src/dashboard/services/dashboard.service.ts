import { Injectable } from '@nestjs/common';
import { DashboardDataDto } from '../dto/dashboard-response.dto';
import { DashboardAnalyticsRealService } from './dashboard-analytics-real.service';
import { DashboardMetricsRealService } from './dashboard-metrics-real.service';

@Injectable()
export class DashboardService {
	constructor(
		private readonly metricsService: DashboardMetricsRealService,
		private readonly analyticsService: DashboardAnalyticsRealService,
	) {}

	async getDashboardData(): Promise<DashboardDataDto> {
		const [statistics, chartData, activity, targets, systemHealth] =
			await Promise.all([
				this.metricsService.getStatistics(),
				this.analyticsService.getChartData(),
				this.metricsService.getActivity(),
				this.metricsService.getTargets(),
				this.analyticsService.getSystemHealth(),
			]);

		return {
			statistics,
			chartData,
			activity,
			targets,
			systemHealth,
		};
	}

	async getStatistics() {
		return this.metricsService.getStatistics();
	}

	async getChartData() {
		return this.analyticsService.getChartData();
	}

	async getActivity() {
		return this.metricsService.getActivity();
	}

	async getTargets() {
		return this.metricsService.getTargets();
	}

	async getSystemHealth() {
		return this.analyticsService.getSystemHealth();
	}

	async getDebugCounts() {
		return this.metricsService.getDebugCounts();
	}

	async testRawQueries() {
		return this.metricsService.testRawQueries();
	}
}
