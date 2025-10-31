import { BaseUserUUIDEntity } from 'src/common/entities/common.entity';
import { Column, Entity, Tree, TreeChildren, TreeParent } from 'typeorm';

@Tree('closure-table')
@Entity()
export class Folder extends BaseUserUUIDEntity {
	@Column()
	name: string;

	@Column({ name: 'parent_id', nullable: true })
	parentId: string | null;

	// relations
	@TreeChildren()
	children: Folder[];

	@TreeParent()
	parent: Folder;
}
