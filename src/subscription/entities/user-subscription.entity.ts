import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Plan } from './plan.entity';

@Entity('user_subscriptions')
export class UserSubscription extends BaseUUIDEntity {
	@Column({ type: 'uuid' })
	userId: string;

	@Column({ type: 'uuid' })
	planId: string;

	@Column({ type: 'timestamptz', nullable: true })
	startDate: Date | null;

	@Column({ type: 'timestamptz', nullable: true })
	endDate: Date | null;

	@Column({ type: 'boolean', default: false })
	isActive: boolean;

	// relations
	@ManyToOne(() => User)
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => Plan)
	@JoinColumn({ name: 'plan_id' })
	plan: Plan;
}
