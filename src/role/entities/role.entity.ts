import { BaseUserUUIDEntity } from 'src/common/entities/common.entity';
import { RolePermission } from 'src/role-permission/entities/role-permission.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('roles')
export class Role extends BaseUserUUIDEntity {
	@Column({ unique: true })
	name: string;

	@Column({ nullable: true })
	description: string;

	@OneToMany(() => UserRole, (userRole) => userRole.role)
	userRoles: UserRole[];

	@OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
	rolePermissions: RolePermission[];
}
