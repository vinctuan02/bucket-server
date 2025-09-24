import { BaseUserUUIDEntity } from 'src/common/entities/common.entity';
import { Permission } from 'src/permission/entities/permission.entity';
import { Role } from 'src/role/entities/role.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('role_permissions')
export class RolePermission extends BaseUserUUIDEntity {
	@Column({ type: 'uuid' })
	roleId: string;

	@Column({ type: 'uuid' })
	permissionId: string;

	@ManyToOne(() => Role, (role) => role.rolePermissions, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'role_id' })
	role: Role;

	@ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'permission_id' })
	permission: Permission;
}
