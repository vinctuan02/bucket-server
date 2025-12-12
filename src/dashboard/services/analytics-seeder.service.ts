import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileNode } from '../../file-node/entities/file-node.entity';
import { User } from '../../users/entities/user.entity';
import {
	AnalyticsEvent,
	AnalyticsEventType,
} from '../entities/analytics-event.entity';

@Injectable()
export class AnalyticsSeederService {
	private readonly logger = new Logger(AnalyticsSeederService.name);

	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		@InjectRepository(FileNode)
		private readonly fileNodeRepository: Repository<FileNode>,
		@InjectRepository(AnalyticsEvent)
		private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
	) {}

	async seedAnalyticsData(days: number = 30): Promise<void> {
		this.logger.log(`Seeding analytics data for the last ${days} days`);

		const users = await this.userRepository.find({ take: 10 });
		const files = await this.fileNodeRepository.find({
			where: { isDelete: false },
			take: 50,
		});

		if (users.length === 0 || files.length === 0) {
			this.logger.warn(
				'No users or files found for seeding analytics data',
			);
			return;
		}

		const events: Partial<AnalyticsEvent>[] = [];
		const today = new Date();

		for (let i = 0; i < days; i++) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);

			// Generate random events for each day
			const dailyEvents = this.generateDailyEvents(date, users, files);
			events.push(...dailyEvents);
		}

		// Save events in batches
		const batchSize = 100;
		for (let i = 0; i < events.length; i += batchSize) {
			const batch = events.slice(i, i + batchSize);
			await this.analyticsEventRepository.save(batch);
		}

		this.logger.log(
			`Successfully seeded ${events.length} analytics events`,
		);
	}

	private generateDailyEvents(
		date: Date,
		users: User[],
		files: FileNode[],
	): Partial<AnalyticsEvent>[] {
		const events: Partial<AnalyticsEvent>[] = [];

		// Generate 5-20 events per day
		const eventCount = Math.floor(Math.random() * 16) + 5;

		for (let i = 0; i < eventCount; i++) {
			const eventDate = new Date(date);
			// Random time during the day
			eventDate.setHours(
				Math.floor(Math.random() * 24),
				Math.floor(Math.random() * 60),
				Math.floor(Math.random() * 60),
			);

			const user = users[Math.floor(Math.random() * users.length)];
			const file = files[Math.floor(Math.random() * files.length)];

			// Random event type with weighted distribution
			const eventTypes = [
				{ type: AnalyticsEventType.FILE_UPLOAD, weight: 20 },
				{ type: AnalyticsEventType.FILE_DOWNLOAD, weight: 40 },
				{ type: AnalyticsEventType.FILE_VIEW, weight: 30 },
				{ type: AnalyticsEventType.FILE_SHARE, weight: 5 },
				{ type: AnalyticsEventType.USER_LOGIN, weight: 5 },
			];

			const totalWeight = eventTypes.reduce(
				(sum, et) => sum + et.weight,
				0,
			);
			let random = Math.random() * totalWeight;
			let selectedType = eventTypes[0].type;

			for (const eventType of eventTypes) {
				random -= eventType.weight;
				if (random <= 0) {
					selectedType = eventType.type;
					break;
				}
			}

			const event: Partial<AnalyticsEvent> = {
				eventType: selectedType,
				userId: user.id,
				createdAt: eventDate,
				updatedAt: eventDate,
			};

			// Add specific data based on event type
			switch (selectedType) {
				case AnalyticsEventType.FILE_UPLOAD:
				case AnalyticsEventType.FILE_DOWNLOAD:
					event.fileNodeId = file.id;
					event.bytesTransferred = Math.floor(
						Math.random() * 100 * 1024 * 1024,
					); // 0-100MB
					break;
				case AnalyticsEventType.FILE_VIEW:
				case AnalyticsEventType.FILE_SHARE:
					event.fileNodeId = file.id;
					break;
				case AnalyticsEventType.USER_LOGIN:
					event.ipAddress = this.generateRandomIP();
					event.userAgent = this.generateRandomUserAgent();
					break;
			}

			events.push(event);
		}

		return events;
	}

	private generateRandomIP(): string {
		return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
	}

	private generateRandomUserAgent(): string {
		const userAgents = [
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
		];
		return userAgents[Math.floor(Math.random() * userAgents.length)];
	}

	async clearAnalyticsData(): Promise<void> {
		this.logger.log('Clearing all analytics data');
		await this.analyticsEventRepository.clear();
		this.logger.log('Analytics data cleared successfully');
	}
}
