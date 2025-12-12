import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity('daily_metrics')
@Unique(['date'])
@Index(['date'])
export class DailyMetrics extends BaseUUIDEntity {
	@Column({ type: 'date' })
	date: string;

	@Column({ type: 'int', default: 0 })
	totalUploads: number;

	@Column({ type: 'int', default: 0 })
	totalDownloads: number;

	@Column({ type: 'bigint', default: 0 })
	totalBytesUploaded: number;

	@Column({ type: 'bigint', default: 0 })
	totalBytesDownloaded: number;

	@Column({ type: 'int', default: 0 })
	activeUsers: number;

	@Column({ type: 'int', default: 0 })
	newUsers: number;

	@Column({ type: 'int', default: 0 })
	totalFiles: number;

	@Column({ type: 'bigint', default: 0 })
	totalStorageUsed: number;

	@Column({ type: 'int', default: 0 })
	shareLinksCreated: number;

	@Column({ type: 'int', default: 0 })
	totalShareLinks: number;

	@Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
	revenue: number;

	@Column({ type: 'int', default: 0 })
	transactions: number;
}
