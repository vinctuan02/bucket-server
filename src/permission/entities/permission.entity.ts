import { DEFAULT_LENGTH_DESCRIPTION } from 'src/common/const/common.const';
import { BaseUserUUIDEntity } from 'src/common/entities/common.entity';
import { RolePermission } from 'src/role-permission/entities/role-permission.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { PermissionAction } from '../enums/permission.enum';

@Entity('permissions')
export class Permission extends BaseUserUUIDEntity {
	@Column()
	name: string;

	@Column({ type: 'enum', enum: PermissionAction })
	action: PermissionAction;

	@Column()
	resource: string;

	@Column({
		type: 'varchar',
		length: DEFAULT_LENGTH_DESCRIPTION,
		nullable: true,
	})
	description: string | null;

	@OneToMany(
		() => RolePermission,
		(rolePermission) => rolePermission.permission,
	)
	rolePermissions: RolePermission[];
}
