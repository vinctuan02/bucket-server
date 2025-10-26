// src/users/entities/user.entity.ts
import { BaseUserUUIDEntity } from 'src/common/entities/common.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('users')
export class User extends BaseUserUUIDEntity {
	@Column({ default: false })
	isActive: boolean;

	@Column()
	name: string;

	@Column({ unique: true })
	email: string;

	@Column()
	password: string;

	@OneToMany(() => UserRole, (userRole) => userRole.user)
	userRoles: UserRole[];
}
