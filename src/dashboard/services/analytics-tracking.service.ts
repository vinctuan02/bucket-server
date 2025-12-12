import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
	AnalyticsEvent,
	AnalyticsEventType,
} from '../entities/analytics-event.entity';
import { DailyMetrics } from '../entities/daily-metrics.entity';

@Injectable()
export class AnalyticsTrackingService {
	private readonly logger = new Logger(AnalyticsTrackingService.name);

	constructor(
		@InjectRepository(AnalyticsEvent)
		private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
		@InjectRepository(DailyMetrics)
		private readonly dailyMetricsRepository: Repository<DailyMetrics>,
	) {}

	async trackEvent(
		eventType: AnalyticsEventType,
		options: {
			userId?: string;
			fileNodeId?: string;
			bytesTransferred?: number;
			ipAddress?: string;
			userAgent?: string;
			metadata?: Record<string, any>;
		} = {},
	): Promise<void> {
		try {
			const event = this.analyticsEventRepository.create({
				eventType,
				...options,
			});

			await this.analyticsEventRepository.save(event);
		} catch (error) {
			this.logger.error(`Failed to track event ${eventType}:`, error);
		}
	}

	async trackFileUpload(
		userId: string,
		fileNodeId: string,
		fileSize: number,
		metadata?: Record<string, any>,
	): Promise<void> {
		await this.trackEvent(AnalyticsEventType.FILE_UPLOAD, {
			userId,
			fileNodeId,
			bytesTransferred: fileSize,
			metadata,
		});
	}

	async trackFileDownload(
		userId: string | null,
		fileNodeId: string,
		fileSize: number,
		ipAddress?: string,
		userAgent?: string,
	): Promise<void> {
		await this.trackEvent(AnalyticsEventType.FILE_DOWNLOAD, {
			userId: userId || undefined,
			fileNodeId,
			bytesTransferred: fileSize,
			ipAddress,
			userAgent,
		});
	}

	async trackUserLogin(
		userId: string,
		ipAddress?: string,
		userAgent?: string,
	): Promise<void> {
		await this.trackEvent(AnalyticsEventType.USER_LOGIN, {
			userId,
			ipAddress,
			userAgent,
		});
	}

	async trackFileShare(userId: string, fileNodeId: string): Promise<void> {
		await this.trackEvent(AnalyticsEventType.FILE_SHARE, {
			userId,
			fileNodeId,
		});
	}

	async updateDailyMetrics(date?: string): Promise<void> {
		const targetDate = date || new Date().toISOString().split('T')[0];

		try {
			// Get or create daily metrics record
			let dailyMetrics = await this.dailyMetricsRepository.findOne({
				where: { date: targetDate },
			});

			if (!dailyMetrics) {
				dailyMetrics = this.dailyMetricsRepository.create({
					date: targetDate,
				});
			}

			// Calculate metrics for the day
			const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
			const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);

			// Count uploads and downloads
			const [uploads, downloads] = await Promise.all([
				this.analyticsEventRepository.count({
					where: {
						eventType: AnalyticsEventType.FILE_UPLOAD,
						createdAt: Between(startOfDay, endOfDay),
					},
				}),
				this.analyticsEventRepository.count({
					where: {
						eventType: AnalyticsEventType.FILE_DOWNLOAD,
						createdAt: Between(startOfDay, endOfDay),
					},
				}),
			]);

			// Calculate bytes transferred
			const [uploadBytes, downloadBytes] = await Promise.all([
				this.analyticsEventRepository
					.createQueryBuilder('event')
					.select('SUM(event.bytesTransferred)', 'total')
					.where('event.eventType = :type', {
						type: AnalyticsEventType.FILE_UPLOAD,
					})
					.andWhere('event.createdAt BETWEEN :start AND :end', {
						start: startOfDay,
						end: endOfDay,
					})
					.getRawOne(),
				this.analyticsEventRepository
					.createQueryBuilder('event')
					.select('SUM(event.bytesTransferred)', 'total')
					.where('event.eventType = :type', {
						type: AnalyticsEventType.FILE_DOWNLOAD,
					})
					.andWhere('event.createdAt BETWEEN :start AND :end', {
						start: startOfDay,
						end: endOfDay,
					})
					.getRawOne(),
			]);

			// Count active users (users who performed any action)
			const activeUsersResult = await this.analyticsEventRepository
				.createQueryBuilder('event')
				.select('COUNT(DISTINCT event.userId)', 'count')
				.where('event.createdAt BETWEEN :start AND :end', {
					start: startOfDay,
					end: endOfDay,
				})
				.andWhere('event.userId IS NOT NULL')
				.getRawOne();

			// Update metrics
			dailyMetrics.totalUploads = uploads;
			dailyMetrics.totalDownloads = downloads;
			dailyMetrics.totalBytesUploaded = parseInt(
				uploadBytes?.total || '0',
			);
			dailyMetrics.totalBytesDownloaded = parseInt(
				downloadBytes?.total || '0',
			);
			dailyMetrics.activeUsers = parseInt(
				activeUsersResult?.count || '0',
			);

			await this.dailyMetricsRepository.save(dailyMetrics);
		} catch (error) {
			this.logger.error(
				`Failed to update daily metrics for ${targetDate}:`,
				error,
			);
		}
	}
}

// Import Between from typeorm
import { Between } from 'typeorm';
