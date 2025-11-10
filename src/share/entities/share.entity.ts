import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class Share extends BaseUUIDEntity {
	@Column()
	fileNodeId: string;

	@Column({ unique: true })
	linkToken: string;

	@Column({ nullable: true })
	expiresAt: Date;

	@Column({ default: false })
	isRevoked: boolean;

	@ManyToOne(() => FileNode, (fileNode) => fileNode.shares, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'file_node_id' })
	fileNode: FileNode;
}
