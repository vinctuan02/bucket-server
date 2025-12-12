import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorator/auth.decorator';

@Controller('api/dashboard')
@Public()
export class DashboardTestController {
	@Get('test')
	test() {
		return {
			message: 'Dashboard API is working!',
			timestamp: new Date().toISOString(),
		};
	}

	@Get('debug/database-counts')
	debugCounts() {
		return {
			totalUsers: 0,
			totalFiles: 0,
			totalTransactions: 0,
			totalShareLinks: 0,
			totalUserStorage: 0,
			timestamp: new Date().toISOString(),
		};
	}

	@Get()
	getDashboard() {
		return {
			statistics: {
				totalStorageUsed: {
					used: 0,
					total: 5.0,
					unit: 'GB',
					percentage: 0,
				},
				totalFiles: 0,
				activeUsers: 0,
				uploadsToday: 0,
			},
			chartData: {
				dailyActivity: [],
				fileDistribution: [
					{ name: 'Documents', value: 0, color: '#3B82F6' },
					{ name: 'Images', value: 0, color: '#10B981' },
					{ name: 'Videos', value: 0, color: '#F59E0B' },
					{ name: 'Archives', value: 0, color: '#EF4444' },
					{ name: 'Other', value: 0, color: '#8B5CF6' },
				],
			},
			activity: {
				bandwidthUsed: {
					current: 0,
					unit: 'MB/s',
					peak24h: 0,
				},
				downloadsToday: 0,
				activeSharedLinks: 0,
			},
			targets: {
				storage: {
					current: 0,
					target: 5000,
					unit: 'GB',
					percentage: 0,
				},
				uploads: {
					current: 0,
					target: 500,
					unit: 'files',
					percentage: 0,
				},
				shareLinks: {
					current: 0,
					target: 600,
					unit: 'links',
					percentage: 0,
				},
			},
			systemHealth: {
				overall: 100,
				components: [
					{ name: 'API Server', status: 'healthy', value: 100 },
					{ name: 'Database', status: 'healthy', value: 100 },
					{ name: 'Storage', status: 'healthy', value: 100 },
					{ name: 'Payment System', status: 'healthy', value: 100 },
					{ name: 'File Sharing', status: 'healthy', value: 100 },
				],
			},
		};
	}
}
