import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { User } from 'src/users/entities/user.entity';
import { Check, Column, Entity, JoinColumn, OneToOne } from 'typeorm';

const GB_1 = 1024 * 1024 * 1024;
const GB_15 = GB_1 * 15;

@Entity('user_storage')
@Check(`"used" >= 0 AND "used" <= ${GB_15}`)
export class UserStorage extends BaseUUIDEntity {
	@Column({ type: 'bigint', default: GB_15 })
	baseLimit: number;

	@Column({ type: 'bigint', default: 0 })
	bonusLimit: number;

	@Column({ type: 'bigint', default: 0 })
	used: number;

	@Column({ type: 'uuid', name: 'user_id' })
	userId: string;

	@OneToOne(() => User, (user) => user.userStorage)
	@JoinColumn({ name: 'user_id' })
	user: User;
}
