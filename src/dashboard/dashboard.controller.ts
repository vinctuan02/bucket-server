import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequiredPermissions } from 'src/auth/decorator/auth.decorator';
import { APP_PERMISSIONS } from 'src/permission/constants/permission.constant';
import {
	DashboardActivityDto,
	DashboardChartDataDto,
	DashboardDataDto,
	DashboardStatisticsDto,
	DashboardSystemHealthDto,
	DashboardTargetsDto,
} from './dto/dashboard-response.dto';
import { DashboardService } from './services/dashboard.service';

@ApiTags('Dashboard')
@Controller('api/dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get()
	@RequiredPermissions(APP_PERMISSIONS.READ_DASHBOARD)
	@ApiOperation({ summary: 'Get complete dashboard data' })
	@ApiResponse({
		status: 200,
		description: 'Dashboard data retrieved successfully',
		type: DashboardDataDto,
	})
	async getDashboardData(): Promise<DashboardDataDto> {
		return this.dashboardService.getDashboardData();
	}

	@Get('statistics')
	@RequiredPermissions(APP_PERMISSIONS.READ_DASHBOARD)
	@ApiOperation({ summary: 'Get dashboard statistics' })
	@ApiResponse({
		status: 200,
		description: 'Statistics retrieved successfully',
		type: DashboardStatisticsDto,
	})
	async getStatistics(): Promise<DashboardStatisticsDto> {
		return this.dashboardService.getStatistics();
	}

	@Get('charts')
	@RequiredPermissions(APP_PERMISSIONS.READ_DASHBOARD)
	@ApiOperation({ summary: 'Get chart data' })
	@ApiResponse({
		status: 200,
		description: 'Chart data retrieved successfully',
		type: DashboardChartDataDto,
	})
	async getChartData(): Promise<DashboardChartDataDto> {
		return this.dashboardService.getChartData();
	}

	@Get('activity')
	@RequiredPermissions(APP_PERMISSIONS.READ_DASHBOARD)
	@ApiOperation({ summary: 'Get activity metrics' })
	@ApiResponse({
		status: 200,
		description: 'Activity metrics retrieved successfully',
		type: DashboardActivityDto,
	})
	async getActivity(): Promise<DashboardActivityDto> {
		return this.dashboardService.getActivity();
	}

	@Get('targets')
	@RequiredPermissions(APP_PERMISSIONS.READ_DASHBOARD)
	@ApiOperation({ summary: 'Get target metrics' })
	@ApiResponse({
		status: 200,
		description: 'Target metrics retrieved successfully',
		type: DashboardTargetsDto,
	})
	async getTargets(): Promise<DashboardTargetsDto> {
		return this.dashboardService.getTargets();
	}

	@Get('health')
	@RequiredPermissions(APP_PERMISSIONS.READ_DASHBOARD)
	@ApiOperation({ summary: 'Get system health data' })
	@ApiResponse({
		status: 200,
		description: 'System health data retrieved successfully',
		type: DashboardSystemHealthDto,
	})
	async getSystemHealth(): Promise<DashboardSystemHealthDto> {
		return this.dashboardService.getSystemHealth();
	}

	@Get('debug/database-counts')
	@ApiOperation({ summary: 'Debug: Get actual database counts' })
	async getDebugCounts(): Promise<any> {
		return this.dashboardService.getDebugCounts();
	}

	@Get('debug/raw-queries')
	@ApiOperation({ summary: 'Debug: Test raw database queries' })
	async testRawQueries(): Promise<any> {
		return this.dashboardService.testRawQueries();
	}

	@Get('test')
	@ApiOperation({ summary: 'Test endpoint' })
	async test(): Promise<any> {
		return {
			message: 'Dashboard API is working!',
			timestamp: new Date().toISOString(),
		};
	}
}
