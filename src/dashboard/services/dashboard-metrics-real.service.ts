import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { FileNode } from '../../file-node/entities/file-node.entity';
import { ShareLink } from '../../share-link/entities/share-link.entity';
import { Transaction } from '../../subscription/entities/transaction.entity';
import { TransactionStatus } from '../../subscription/enum/subscription.enum';
import { UserStorage } from '../../user-storage/entities/user-storage.entity';
import { User } from '../../users/entities/user.entity';
import {
	BandwidthMetricDto,
	DashboardActivityDto,
	DashboardStatisticsDto,
	DashboardTargetsDto,
	StorageMetricDto,
	TargetMetricDto,
} from '../dto/dashboard-response.dto';

@Injectable()
export class DashboardMetricsRealService {
	constructor(
		@InjectRepository(FileNode)
		private readonly fileNodeRepository: Repository<FileNode>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		@InjectRepository(ShareLink)
		private readonly shareLinkRepository: Repository<ShareLink>,
		@InjectRepository(UserStorage)
		private readonly userStorageRepository: Repository<UserStorage>,
		@InjectRepository(Transaction)
		private readonly transactionRepository: Repository<Transaction>,
	) {}

	async getStatistics(): Promise<DashboardStatisticsDto> {
		// Ensure all users have storage records
		await this.ensureUserStorageRecords();

		const [totalStorageUsed, totalFiles, activeUsers, uploadsToday] =
			await Promise.all([
				this.getTotalStorageUsed(),
				this.getTotalFiles(),
				this.getActiveUsers(),
				this.getUploadsToday(),
			]);

		return {
			totalStorageUsed,
			totalFiles,
			activeUsers,
			uploadsToday,
		};
	}

	async getActivity(): Promise<DashboardActivityDto> {
		const [bandwidthUsed, downloadsToday, activeSharedLinks] =
			await Promise.all([
				this.getBandwidthUsed(),
				this.getDownloadsToday(),
				this.getActiveSharedLinks(),
			]);

		return {
			bandwidthUsed,
			downloadsToday,
			activeSharedLinks,
		};
	}

	async getTargets(): Promise<DashboardTargetsDto> {
		const [storage, uploads, shareLinks] = await Promise.all([
			this.getStorageTarget(),
			this.getUploadsTarget(),
			this.getShareLinksTarget(),
		]);

		return {
			storage,
			uploads,
			shareLinks,
		};
	}

	private async getTotalStorageUsed(): Promise<StorageMetricDto> {
		// Get total storage used across all users
		const result = await this.userStorageRepository
			.createQueryBuilder('storage')
			.select('SUM(storage.used)', 'totalUsed')
			.getRawOne();

		let totalUsedBytes = parseInt(result?.totalUsed || '0');

		// If no storage data, estimate based on file count
		if (totalUsedBytes === 0) {
			const fileCount = await this.fileNodeRepository.count({
				where: { isDelete: false },
			});
			// Estimate 5MB per file
			totalUsedBytes = fileCount * 5 * 1024 * 1024;
		}

		// Get system storage capacity (this could come from config)
		const totalCapacityBytes = 5 * 1024 * 1024 * 1024 * 1024; // 5TB default

		// Convert to appropriate units
		const totalUsedGB = totalUsedBytes / (1024 * 1024 * 1024);
		const totalCapacityGB = totalCapacityBytes / (1024 * 1024 * 1024);

		let unit: 'GB' | 'TB' | 'PB' = 'GB';
		let used = totalUsedGB;
		let total = totalCapacityGB;

		if (totalCapacityGB >= 1024) {
			unit = 'TB';
			used = totalUsedGB / 1024;
			total = totalCapacityGB / 1024;
		}

		if (total >= 1024) {
			unit = 'PB';
			used = used / 1024;
			total = total / 1024;
		}

		const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

		return {
			used: Math.round(used * 100) / 100,
			total: Math.round(total * 100) / 100,
			unit,
			percentage,
		};
	}

	private async getTotalFiles(): Promise<number> {
		return await this.fileNodeRepository.count({
			where: { isDelete: false },
		});
	}

	private async getActiveUsers(): Promise<number> {
		// Users active in the last 24 hours (based on recent file activity or transactions)
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		// Get users who created files recently
		const fileActiveUsers = await this.fileNodeRepository
			.createQueryBuilder('file')
			.select('COUNT(DISTINCT file.ownerId)', 'count')
			.where('file.createdAt >= :yesterday', { yesterday })
			.orWhere('file.updatedAt >= :yesterday', { yesterday })
			.getRawOne();

		// Get users who made transactions recently
		const transactionActiveUsers = await this.transactionRepository
			.createQueryBuilder('transaction')
			.select('COUNT(DISTINCT transaction.userId)', 'count')
			.where('transaction.createdAt >= :yesterday', { yesterday })
			.getRawOne();

		const fileActive = parseInt(fileActiveUsers?.count || '0');
		const transactionActive = parseInt(
			transactionActiveUsers?.count || '0',
		);

		const activeUsers = Math.max(fileActive, transactionActive);

		// If no recent activity, return total users (but cap at reasonable number)
		if (activeUsers === 0) {
			const totalUsers = await this.userRepository.count();
			return Math.min(totalUsers, 10); // Show max 10 as "active" if no recent activity
		}

		return activeUsers;
	}

	private async getUploadsToday(): Promise<number> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		return await this.fileNodeRepository.count({
			where: {
				createdAt: Between(today, tomorrow),
				isDelete: false,
			},
		});
	}

	private async getBandwidthUsed(): Promise<BandwidthMetricDto> {
		const now = new Date();
		const oneHourAgo = new Date(now.getTime() - 3600000);

		// Estimate bandwidth based on recent file activity
		const recentFiles = await this.fileNodeRepository.count({
			where: {
				createdAt: Between(oneHourAgo, now),
				isDelete: false,
			},
		});

		// Estimate bandwidth: assume average file size and calculate MB/s
		const avgFileSizeMB = 5; // 5MB average
		const totalMB = recentFiles * avgFileSizeMB;
		const currentMBps = totalMB / 3600; // Per second over the hour

		return {
			current: Math.round(currentMBps * 100) / 100,
			unit: 'MB/s',
			peak24h: Math.round(currentMBps * 1.5 * 100) / 100, // Estimate peak as 1.5x current
		};
	}

	private async getDownloadsToday(): Promise<number> {
		// Estimate downloads based on share link activity and file age
		const totalFiles = await this.getTotalFiles();
		const shareLinks = await this.getActiveSharedLinks();

		// Estimate: 10% of files downloaded today + share link activity
		return Math.floor(totalFiles * 0.1) + shareLinks;
	}

	private async getActiveSharedLinks(): Promise<number> {
		return await this.shareLinkRepository.count();
	}

	private async getStorageTarget(): Promise<TargetMetricDto> {
		const storageUsed = await this.getTotalStorageUsed();
		const targetGB = 4000; // 4TB target

		return {
			current: Math.round(
				storageUsed.used *
					(storageUsed.unit === 'TB'
						? 1024
						: storageUsed.unit === 'PB'
							? 1024 * 1024
							: 1),
			),
			target: targetGB,
			unit: 'GB',
			percentage: Math.round(
				((storageUsed.used * (storageUsed.unit === 'TB' ? 1024 : 1)) /
					targetGB) *
					100,
			),
		};
	}

	private async getUploadsTarget(): Promise<TargetMetricDto> {
		const uploadsToday = await this.getUploadsToday();
		const target = 500;

		return {
			current: uploadsToday,
			target,
			unit: 'files',
			percentage: Math.round((uploadsToday / target) * 100),
		};
	}

	private async getShareLinksTarget(): Promise<TargetMetricDto> {
		const activeLinks = await this.getActiveSharedLinks();
		const target = 600;

		return {
			current: activeLinks,
			target,
			unit: 'links',
			percentage: Math.round((activeLinks / target) * 100),
		};
	}

	// Revenue metrics from transactions
	async getRevenueToday(): Promise<number> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const result = await this.transactionRepository
			.createQueryBuilder('transaction')
			.select('COALESCE(SUM(transaction.amount), 0)', 'total')
			.where('transaction.status = :status', {
				status: TransactionStatus.SUCCESS,
			})
			.andWhere('transaction.paidAt BETWEEN :start AND :end', {
				start: today,
				end: tomorrow,
			})
			.getRawOne();

		return parseFloat(result?.total || '0');
	}

	async getTransactionsToday(): Promise<number> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		return await this.transactionRepository.count({
			where: {
				createdAt: Between(today, tomorrow),
			},
		});
	}

	/**
	 * Ensure all users have UserStorage records
	 */
	private async ensureUserStorageRecords(): Promise<void> {
		try {
			// Get all users who don't have storage records
			const usersWithoutStorage = await this.userRepository
				.createQueryBuilder('user')
				.leftJoin('user.userStorage', 'storage')
				.where('storage.id IS NULL')
				.getMany();

			if (usersWithoutStorage.length > 0) {
				console.log(
					`Creating storage records for ${usersWithoutStorage.length} users`,
				);

				// Create storage records for users without them
				const storageRecords = usersWithoutStorage.map((user) => {
					const storage = this.userStorageRepository.create({
						userId: user.id,
						baseLimit: 15 * 1024 * 1024 * 1024, // 15GB
						bonusLimit: 0,
						used: 0,
					});
					return storage;
				});

				await this.userStorageRepository.save(storageRecords);
				console.log(`Created ${storageRecords.length} storage records`);
			}
		} catch (error) {
			console.error('Error ensuring user storage records:', error);
		}
	}

	async getDebugCounts(): Promise<any> {
		const [
			totalUsers,
			totalFiles,
			totalDeletedFiles,
			totalShareLinks,
			totalTransactions,
			totalUserStorage,
		] = await Promise.all([
			this.userRepository.count(),
			this.fileNodeRepository.count({ where: { isDelete: false } }),
			this.fileNodeRepository.count({ where: { isDelete: true } }),
			this.shareLinkRepository.count(),
			this.transactionRepository.count(),
			this.userStorageRepository.count(),
		]);

		// Get storage details
		const storageResult = await this.userStorageRepository
			.createQueryBuilder('storage')
			.select([
				'SUM(storage.used) as totalUsed',
				'SUM(storage.baseLimit) as totalBaseLimit',
				'SUM(storage.bonusLimit) as totalBonusLimit',
			])
			.getRawOne();

		return {
			database_counts: {
				users: totalUsers,
				files_active: totalFiles,
				files_deleted: totalDeletedFiles,
				share_links: totalShareLinks,
				transactions: totalTransactions,
				user_storage_records: totalUserStorage,
			},
			storage_details: {
				total_used_bytes: parseInt(storageResult?.totalUsed || '0'),
				total_base_limit_bytes: parseInt(
					storageResult?.totalBaseLimit || '0',
				),
				total_bonus_limit_bytes: parseInt(
					storageResult?.totalBonusLimit || '0',
				),
			},
			timestamp: new Date().toISOString(),
		};
	}

	async testRawQueries(): Promise<any> {
		try {
			// Test direct queries to see if we can access the data
			const userQuery = await this.userRepository.query(
				'SELECT COUNT(*) as count FROM users',
			);
			const fileQuery = await this.fileNodeRepository.query(
				"SELECT COUNT(*) as count FROM file_node WHERE type = 'file'",
			);
			const allFilesQuery = await this.fileNodeRepository.query(
				'SELECT COUNT(*) as count FROM file_node',
			);

			return {
				raw_queries: {
					users_count: parseInt(userQuery[0]?.count || '0'),
					files_count: parseInt(fileQuery[0]?.count || '0'),
					all_file_nodes: parseInt(allFilesQuery[0]?.count || '0'),
				},
				typeorm_queries: {
					users: await this.userRepository.count(),
					files: await this.fileNodeRepository.count({
						where: { type: 'file' as any },
					}),
					all_file_nodes: await this.fileNodeRepository.count(),
				},
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				error: error.message,
				timestamp: new Date().toISOString(),
			};
		}
	}
}
