import { BaseUserUUIDEntity } from 'src/common/entities/common.entity';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class UserRole extends BaseUserUUIDEntity {
	@Column({ type: 'uuid' })
	userId: string;

	@Column({ type: 'uuid' })
	roleId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => Role, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'role_id' })
	role: Role;
}
