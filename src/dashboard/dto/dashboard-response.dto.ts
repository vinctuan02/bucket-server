import { ApiProperty } from '@nestjs/swagger';

export class StorageMetricDto {
	@ApiProperty({ description: 'Storage used in bytes' })
	used: number;

	@ApiProperty({ description: 'Total storage capacity in bytes' })
	total: number;

	@ApiProperty({ description: 'Storage unit', enum: ['GB', 'TB', 'PB'] })
	unit: 'GB' | 'TB' | 'PB';

	@ApiProperty({ description: 'Usage percentage' })
	percentage: number;
}

export class BandwidthMetricDto {
	@ApiProperty({ description: 'Current bandwidth usage' })
	current: number;

	@ApiProperty({ description: 'Bandwidth unit', enum: ['MB/s', 'GB/s'] })
	unit: 'MB/s' | 'GB/s';

	@ApiProperty({ description: '24-hour peak bandwidth' })
	peak24h: number;
}

export class TargetMetricDto {
	@ApiProperty({ description: 'Current value' })
	current: number;

	@ApiProperty({ description: 'Target value' })
	target: number;

	@ApiProperty({ description: 'Unit of measurement' })
	unit: string;

	@ApiProperty({ description: 'Percentage of target achieved' })
	percentage: number;
}

export class HealthComponentDto {
	@ApiProperty({ description: 'Component name' })
	name: string;

	@ApiProperty({
		description: 'Health status',
		enum: ['healthy', 'warning', 'critical'],
	})
	status: 'healthy' | 'warning' | 'critical';

	@ApiProperty({ description: 'Health score (0-100)' })
	value: number;
}

export class ChartDataPointDto {
	@ApiProperty({ description: 'Date in YYYY-MM-DD format' })
	date: string;

	@ApiProperty({ description: 'Number of uploads' })
	uploads: number;

	@ApiProperty({ description: 'Storage used in GB' })
	storageUsed: number;
}

export class DonutDataPointDto {
	@ApiProperty({ description: 'Category name' })
	name: string;

	@ApiProperty({ description: 'Percentage value' })
	value: number;

	@ApiProperty({ description: 'Color hex code' })
	color: string;
}

export class DashboardStatisticsDto {
	@ApiProperty({ type: StorageMetricDto })
	totalStorageUsed: StorageMetricDto;

	@ApiProperty({ description: 'Total number of files' })
	totalFiles: number;

	@ApiProperty({ description: 'Number of active users' })
	activeUsers: number;

	@ApiProperty({ description: 'Files uploaded today' })
	uploadsToday: number;
}

export class DashboardChartDataDto {
	@ApiProperty({ type: [ChartDataPointDto] })
	dailyActivity: ChartDataPointDto[];

	@ApiProperty({ type: [DonutDataPointDto] })
	fileDistribution: DonutDataPointDto[];
}

export class DashboardActivityDto {
	@ApiProperty({ type: BandwidthMetricDto })
	bandwidthUsed: BandwidthMetricDto;

	@ApiProperty({ description: 'Downloads today' })
	downloadsToday: number;

	@ApiProperty({ description: 'Active shared links' })
	activeSharedLinks: number;
}

export class DashboardTargetsDto {
	@ApiProperty({ type: TargetMetricDto })
	storage: TargetMetricDto;

	@ApiProperty({ type: TargetMetricDto })
	uploads: TargetMetricDto;

	@ApiProperty({ type: TargetMetricDto })
	shareLinks: TargetMetricDto;
}

export class DashboardSystemHealthDto {
	@ApiProperty({ description: 'Overall system health percentage' })
	overall: number;

	@ApiProperty({ type: [HealthComponentDto] })
	components: HealthComponentDto[];
}

export class DashboardDataDto {
	@ApiProperty({ type: DashboardStatisticsDto })
	statistics: DashboardStatisticsDto;

	@ApiProperty({ type: DashboardChartDataDto })
	chartData: DashboardChartDataDto;

	@ApiProperty({ type: DashboardActivityDto })
	activity: DashboardActivityDto;

	@ApiProperty({ type: DashboardTargetsDto })
	targets: DashboardTargetsDto;

	@ApiProperty({ type: DashboardSystemHealthDto })
	systemHealth: DashboardSystemHealthDto;
}
