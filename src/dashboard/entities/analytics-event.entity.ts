import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export enum AnalyticsEventType {
	FILE_UPLOAD = 'file_upload',
	FILE_DOWNLOAD = 'file_download',
	FILE_VIEW = 'file_view',
	FILE_SHARE = 'file_share',
	USER_LOGIN = 'user_login',
	STORAGE_USAGE = 'storage_usage',
	BANDWIDTH_USAGE = 'bandwidth_usage',
}

@Entity('analytics_events')
@Index(['eventType', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['fileNodeId', 'createdAt'])
export class AnalyticsEvent extends BaseUUIDEntity {
	@Column({
		type: 'enum',
		enum: AnalyticsEventType,
	})
	eventType: AnalyticsEventType;

	@Column({ type: 'uuid', nullable: true })
	userId: string | null;

	@Column({ type: 'uuid', nullable: true })
	fileNodeId: string | null;

	@Column({ type: 'bigint', nullable: true })
	bytesTransferred: number | null;

	@Column({ type: 'varchar', nullable: true })
	ipAddress: string | null;

	@Column({ type: 'varchar', nullable: true })
	userAgent: string | null;

	@Column({ type: 'jsonb', nullable: true })
	metadata: Record<string, any> | null;

	// Relations
	@ManyToOne(() => User, { nullable: true })
	@JoinColumn({ name: 'user_id' })
	user: User | null;

	@ManyToOne(() => FileNode, { nullable: true })
	@JoinColumn({ name: 'file_node_id' })
	fileNode: FileNode | null;
}
