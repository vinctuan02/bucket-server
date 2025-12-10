// src/users/entities/user.entity.ts
import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { UserStorage } from 'src/user-storage/entities/user-storage.entity';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

@Entity('users')
export class User extends BaseUUIDEntity {
	@Column({ default: false })
	isActive: boolean;

	@Column()
	name: string;

	@Column({ unique: true })
	email: string;

	@Column({ type: 'varchar', nullable: true })
	password: string | null;

	@Column({ type: 'varchar', nullable: true })
	avatar: string | null;

	@Column({ type: 'varchar', nullable: true })
	provider: string | null;

	@Column({ type: 'varchar', nullable: true })
	providerId: string | null;

	@Column({ type: 'int', nullable: true })
	trashRetentionDays: number | null;

	@OneToMany(() => UserRole, (userRole) => userRole.user)
	userRoles: UserRole[];

	@OneToMany(() => FileNode, (f) => f.owner)
	fileNodes: FileNode[];

	@OneToOne(() => UserStorage, (us) => us.user)
	userStorage: UserStorage;
}
