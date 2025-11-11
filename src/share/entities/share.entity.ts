import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SharePermission } from './share-permission.entity';

@Entity('shares')
export class Share extends BaseUUIDEntity {
	@Column({ name: 'file_node_id' })
	fileNodeId: string;

	@Column({ name: 'shared_by', type: 'uuid' })
	sharedById: string;

	@Column({ type: 'varchar', default: 'direct' })
	type: 'direct' | 'link';

	@Column({
		name: 'link_token',
		type: 'varchar',
		unique: true,
		nullable: true,
	})
	linkToken: string | null;

	@Column({ name: 'expires_at', nullable: true })
	expiresAt: Date;

	@Column({ name: 'is_revoked', default: false })
	isRevoked: boolean;

	@ManyToOne(() => FileNode, (fileNode) => fileNode.shares, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'file_node_id' })
	fileNode: FileNode;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'shared_by_id' })
	sharedUser: User;

	@OneToMany(() => SharePermission, (permission) => permission.share, {
		cascade: true,
	})
	sharePermissions: SharePermission[];
}
