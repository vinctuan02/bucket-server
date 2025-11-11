import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Share } from './share.entity';

@Entity('share_permissions')
export class SharePermission extends BaseUUIDEntity {
	@Column({ name: 'share_id' })
	shareId: string;

	@Column({ name: 'target_user_id', nullable: true })
	targetUserId: string | null;

	@Column({ name: 'can_view', default: false })
	canView: boolean;

	@Column({ name: 'can_edit', default: false })
	canEdit: boolean;

	@Column({ name: 'can_delete', default: false })
	canDelete: boolean;

	@Column({ name: 'can_upload', default: false })
	canUpload: boolean;

	@Column({ name: 'can_share', default: false })
	canShare: boolean;

	@ManyToOne(() => Share, (share) => share.sharePermissions, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'share_id' })
	share: Share;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'target_user_id' })
	targetUser: User | null;
}
