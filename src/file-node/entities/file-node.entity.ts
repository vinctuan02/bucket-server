import { FileBucket } from 'src/bucket/entities/bucket-file.entity';
import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { Share } from 'src/share/entities/share.entity';
import { User } from 'src/users/entities/user.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	Tree,
	TreeChildren,
	TreeParent,
	Unique,
} from 'typeorm';
import { TYPE_FILE_NODE } from '../enum/file-node.enum';

@Entity('file_node')
@Tree('closure-table')
@Unique(['fileNodeParentId', 'type', 'name', 'isDelete'])
export class FileNode extends BaseUUIDEntity {
	@Column({ type: 'varchar', length: 255 })
	name: string;

	@Column({ type: 'enum', enum: TYPE_FILE_NODE })
	type: TYPE_FILE_NODE;

	@Column({ type: 'text', nullable: true })
	path: string | null;

	@Column({ type: 'uuid', nullable: true })
	fileBucketId: string | null;

	@Column({ type: 'uuid' })
	ownerId: string;

	@Column({ type: 'uuid', nullable: true })
	fileNodeParentId: string | null;

	// hanlde delete
	@Column({ type: 'boolean', default: false })
	isDelete: boolean;

	@Column({ type: 'timestamptz', nullable: true })
	deletedAt: Date | null;

	// relations
	@OneToOne(() => FileBucket, { nullable: true })
	@JoinColumn({ name: 'file_bucket_id' })
	fileBucket?: FileBucket | null;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'owner_id' })
	owner: User;

	@OneToMany(() => Share, (share) => share.fileNode)
	shares: Share[];

	@TreeParent()
	@JoinColumn({ name: 'file_node_parent_id' })
	fileNodeParent: FileNode | null;

	@TreeChildren()
	fileNodeChildrens: FileNode[];
}
