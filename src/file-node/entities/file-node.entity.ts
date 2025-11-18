import { FileBucket } from 'src/bucket/entities/bucket-file.entity';
import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { FileNodePermission } from 'src/file-node-permission/entities/file-node-permission.entity';
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
@Unique(['fileNodeParentId', 'type', 'name', 'isDelete', 'ownerId'])
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

	@TreeParent()
	@JoinColumn({ name: 'file_node_parent_id' })
	fileNodeParent: FileNode | null;

	@TreeChildren()
	fileNodeChildren: FileNode[];

	@OneToMany(() => FileNodePermission, (fnp) => fnp.fileNode)
	fileNodePermissions: FileNodePermission[];
}
