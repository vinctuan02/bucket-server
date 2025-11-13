import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ShareType } from '../enum/file-node-permission.enum';

@Entity('file_node_permissions')
@Index(['fileNodeId', 'userId'], { unique: true })
export class FileNodePermission extends BaseUUIDEntity {
	@Column({ name: 'file_node_id', type: 'uuid' })
	fileNodeId: string;

	@Column({ name: 'user_id', type: 'uuid', nullable: true })
	userId: string | null; // null nếu là public

	@Column({ name: 'shared_by', type: 'uuid' })
	sharedById: string;

	// Permissions
	@Column({ name: 'can_view', default: true })
	canView: boolean;

	@Column({ name: 'can_edit', default: false })
	canEdit: boolean;

	// @Column({ name: 'can_delete', default: false })
	// canDelete: boolean;

	// @Column({ name: 'can_upload', default: false })
	// canUpload: boolean;

	// @Column({ name: 'can_share', default: false })
	// canShare: boolean;

	// Metadata
	@Column({
		name: 'share_type',
		type: 'enum',
		enum: ShareType,
		default: ShareType.DIRECT,
	})
	shareType: ShareType;

	@Column({ name: 'inherited_from', type: 'uuid', nullable: true })
	inheritedFrom: string | null;

	@ManyToOne(() => FileNode, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'file_node_id' })
	fileNode: FileNode;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'shared_by' })
	sharedBy: User;
}
