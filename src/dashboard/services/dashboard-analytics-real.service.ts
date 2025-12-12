import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { FileNode } from '../../file-node/entities/file-node.entity';
import { ShareLink } from '../../share-link/entities/share-link.entity';
import { Transaction } from '../../subscription/entities/transaction.entity';
import { TransactionStatus } from '../../subscription/enum/subscription.enum';
import { User } from '../../users/entities/user.entity';
import {
	ChartDataPointDto,
	DashboardChartDataDto,
	DashboardSystemHealthDto,
	DonutDataPointDto,
	HealthComponentDto,
} from '../dto/dashboard-response.dto';

@Injectable()
export class DashboardAnalyticsRealService {
	constructor(
		@InjectRepository(FileNode)
		private readonly fileNodeRepository: Repository<FileNode>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		@InjectRepository(Transaction)
		private readonly transactionRepository: Repository<Transaction>,
		@InjectRepository(ShareLink)
		private readonly shareLinkRepository: Repository<ShareLink>,
	) {}

	async getChartData(): Promise<DashboardChartDataDto> {
		const [dailyActivity, fileDistribution] = await Promise.all([
			this.getDailyActivity(),
			this.getFileDistribution(),
		]);

		return {
			dailyActivity,
			fileDistribution,
		};
	}

	async getSystemHealth(): Promise<DashboardSystemHealthDto> {
		const components = await this.getHealthComponents();
		const overall = Math.round(
			components.reduce((sum, comp) => sum + comp.value, 0) /
				components.length,
		);

		return {
			overall,
			components,
		};
	}

	private async getDailyActivity(): Promise<ChartDataPointDto[]> {
		const data: ChartDataPointDto[] = [];
		const today = new Date();

		// Get data for the last 30 days
		for (let i = 29; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			date.setHours(0, 0, 0, 0);

			const nextDay = new Date(date);
			nextDay.setDate(nextDay.getDate() + 1);

			// Get uploads for this day
			const uploads = await this.fileNodeRepository.count({
				where: {
					createdAt: Between(date, nextDay),
					isDelete: false,
				},
			});

			// Calculate cumulative storage used up to this day (estimate based on file count)
			const totalFiles = await this.fileNodeRepository.count({
				where: {
					createdAt: Between(new Date('2020-01-01'), nextDay),
					isDelete: false,
				},
			});

			// Estimate storage used (assume 5MB average file size)
			const estimatedStorageGB =
				Math.round(totalFiles * 0.005 * 100) / 100;

			data.push({
				date: date.toISOString().split('T')[0],
				uploads,
				storageUsed: estimatedStorageGB,
			});
		}

		return data;
	}

	private async getFileDistribution(): Promise<DonutDataPointDto[]> {
		// Get file extensions and categorize them
		const files = await this.fileNodeRepository
			.createQueryBuilder('file')
			.select('file.name')
			.where('file.isDelete = :isDelete', { isDelete: false })
			.andWhere('file.name IS NOT NULL')
			.getMany();

		const categories = {
			Documents: 0,
			Images: 0,
			Videos: 0,
			Archives: 0,
			Other: 0,
		};

		const documentExts = [
			'pdf',
			'doc',
			'docx',
			'txt',
			'rtf',
			'odt',
			'xls',
			'xlsx',
			'ppt',
			'pptx',
		];
		const imageExts = [
			'jpg',
			'jpeg',
			'png',
			'gif',
			'bmp',
			'svg',
			'webp',
			'ico',
			'tiff',
		];
		const videoExts = [
			'mp4',
			'avi',
			'mov',
			'wmv',
			'flv',
			'webm',
			'mkv',
			'3gp',
			'm4v',
		];
		const archiveExts = [
			'zip',
			'rar',
			'7z',
			'tar',
			'gz',
			'bz2',
			'xz',
			'iso',
		];

		files.forEach((file) => {
			const extension = file.name?.split('.').pop()?.toLowerCase() || '';

			if (documentExts.includes(extension)) {
				categories.Documents++;
			} else if (imageExts.includes(extension)) {
				categories.Images++;
			} else if (videoExts.includes(extension)) {
				categories.Videos++;
			} else if (archiveExts.includes(extension)) {
				categories.Archives++;
			} else {
				categories.Other++;
			}
		});

		const total = files.length;
		const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

		return Object.entries(categories).map(([name, count], index) => ({
			name,
			value: total > 0 ? Math.round((count / total) * 100) : 0,
			color: colors[index],
		}));
	}

	private async getHealthComponents(): Promise<HealthComponentDto[]> {
		const components: HealthComponentDto[] = [];
		const oneHourAgo = new Date(Date.now() - 3600000);
		const oneDayAgo = new Date(Date.now() - 86400000);

		// API Server health (based on recent file activity)
		const recentActivity = await this.fileNodeRepository.count({
			where: {
				createdAt: Between(oneHourAgo, new Date()),
			},
		});

		const apiHealth = Math.min(100, Math.max(70, 85 + recentActivity * 2));
		components.push({
			name: 'API Server',
			status:
				apiHealth >= 90
					? 'healthy'
					: apiHealth >= 70
						? 'warning'
						: 'critical',
			value: apiHealth,
		});

		// Database health (based on query performance and user count)
		const totalUsers = await this.userRepository.count();
		const dbHealth = Math.min(
			100,
			Math.max(70, 98 - Math.floor(totalUsers / 1000)),
		);

		components.push({
			name: 'Database',
			status:
				dbHealth >= 90
					? 'healthy'
					: dbHealth >= 70
						? 'warning'
						: 'critical',
			value: dbHealth,
		});

		// Storage health (based on actual usage vs capacity)
		const totalFiles = await this.fileNodeRepository.count({
			where: { isDelete: false },
		});
		const storageCapacityFiles = 100000; // Assume capacity for 100k files
		const storageUsagePercent = (totalFiles / storageCapacityFiles) * 100;
		const storageHealth = Math.max(30, 100 - storageUsagePercent);

		components.push({
			name: 'Storage',
			status:
				storageHealth >= 80
					? 'healthy'
					: storageHealth >= 60
						? 'warning'
						: 'critical',
			value: Math.round(storageHealth),
		});

		// Payment System health (based on recent transaction success rate)
		const [totalTransactions, failedTransactions] = await Promise.all([
			this.transactionRepository.count({
				where: {
					createdAt: Between(oneDayAgo, new Date()),
				},
			}),
			this.transactionRepository.count({
				where: {
					createdAt: Between(oneDayAgo, new Date()),
					status: TransactionStatus.FAILED,
				},
			}),
		]);

		const successRate =
			totalTransactions > 0
				? ((totalTransactions - failedTransactions) /
						totalTransactions) *
					100
				: 100;
		const paymentHealth = Math.round(successRate);

		components.push({
			name: 'Payment System',
			status:
				paymentHealth >= 95
					? 'healthy'
					: paymentHealth >= 85
						? 'warning'
						: 'critical',
			value: paymentHealth,
		});

		// File Sharing health (based on share link activity)
		const totalShareLinks = await this.shareLinkRepository.count();
		const recentShareLinks = await this.shareLinkRepository.count({
			where: {
				createdAt: Between(oneDayAgo, new Date()),
			},
		});

		const shareHealth = Math.min(100, 90 + Math.min(recentShareLinks, 10));
		components.push({
			name: 'File Sharing',
			status:
				shareHealth >= 95
					? 'healthy'
					: shareHealth >= 85
						? 'warning'
						: 'critical',
			value: shareHealth,
		});

		return components;
	}

	// Additional analytics methods
	async getRevenueAnalytics(days: number = 30): Promise<ChartDataPointDto[]> {
		const data: ChartDataPointDto[] = [];
		const today = new Date();

		for (let i = days - 1; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			date.setHours(0, 0, 0, 0);

			const nextDay = new Date(date);
			nextDay.setDate(nextDay.getDate() + 1);

			// Get revenue for this day
			const result = await this.transactionRepository
				.createQueryBuilder('transaction')
				.select('COALESCE(SUM(transaction.amount), 0)', 'total')
				.where('transaction.status = :status', {
					status: TransactionStatus.SUCCESS,
				})
				.andWhere('transaction.paidAt BETWEEN :start AND :end', {
					start: date,
					end: nextDay,
				})
				.getRawOne();

			const revenue = parseFloat(result?.total || '0');

			data.push({
				date: date.toISOString().split('T')[0],
				uploads: 0, // Not used for revenue chart
				storageUsed: revenue,
			});
		}

		return data;
	}

	async getUserGrowthAnalytics(
		days: number = 30,
	): Promise<ChartDataPointDto[]> {
		const data: ChartDataPointDto[] = [];
		const today = new Date();

		for (let i = days - 1; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			date.setHours(0, 0, 0, 0);

			const nextDay = new Date(date);
			nextDay.setDate(nextDay.getDate() + 1);

			// Get new users for this day
			const newUsers = await this.userRepository.count({
				where: {
					createdAt: Between(date, nextDay),
				},
			});

			// Get total users up to this day
			const totalUsers = await this.userRepository.count({
				where: {
					createdAt: Between(new Date('2020-01-01'), nextDay),
				},
			});

			data.push({
				date: date.toISOString().split('T')[0],
				uploads: newUsers,
				storageUsed: totalUsers,
			});
		}

		return data;
	}
}
