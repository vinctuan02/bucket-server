import { RolePermission } from 'src/role-permission/entities/role-permission.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Permission {
	@PrimaryGeneratedColumn()
	id: number;

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
