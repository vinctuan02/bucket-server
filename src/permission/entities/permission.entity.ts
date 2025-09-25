import { BaseUserUUIDEntity } from 'src/common/entities/common.entity';
import { RolePermission } from 'src/role-permission/entities/role-permission.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('permissions')
export class Permission extends BaseUserUUIDEntity {
	@Column()
	action: string;

	@Column()
	resource: string;

	@OneToMany(
		() => RolePermission,
		(rolePermission) => rolePermission.permission,
	)
	rolePermissions: RolePermission[];
}
