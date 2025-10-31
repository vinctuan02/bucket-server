import { BaseUserUUIDEntity } from 'src/common/entities/common.entity';
import { User } from 'src/users/entities/user.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	Tree,
	TreeChildren,
	TreeParent,
} from 'typeorm';

@Tree('closure-table')
@Entity()
export class Folder extends BaseUserUUIDEntity {
	@Column()
	name: string;

	@Column({ name: 'parent_id', nullable: true })
	parentId: string | null;

	@Column({ type: 'uuid' })
	userId: string;

	// relations
	@TreeChildren()
	children: Folder[];

	@TreeParent()
	parent: Folder;

	@ManyToOne(() => User, (user) => user.folders, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;
}
