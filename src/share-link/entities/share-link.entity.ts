// share-link.entity.ts
import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('share_links')
export class ShareLink extends BaseUUIDEntity {
	@ManyToOne(() => FileNode, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'file_node_id' })
	fileNode: FileNode;

	@Column({ name: 'file_node_id' })
	fileNodeId: string;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'created_by' })
	createdBy: User;

	@Column({ name: 'created_by' })
	createdById: string;

	@Column({ unique: true })
	token: string;

	@Column({ name: 'can_view', default: true })
	canView: boolean;

	@Column({ name: 'can_edit', default: false })
	canEdit: boolean;

	@Column({ name: 'can_download', default: true })
	canDownload: boolean;
}
