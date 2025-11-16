import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TransactionStatus } from '../enum/subscription.enum';
import { UserSubscription } from './user-subscription.entity';

@Entity('transactions')
export class Transaction extends BaseUUIDEntity {
	@Column({ type: 'uuid' })
	userId: string;

	@Column({ type: 'uuid' })
	subscriptionId: string;

	@Column({ type: 'decimal', precision: 12, scale: 2 })
	amount: number;

	@Column({ type: 'varchar', default: 'VND' })
	currency: string;

	@Column({ type: 'varchar' })
	paymentMethod: string;

	@Column({
		type: 'enum',
		enum: TransactionStatus,
		default: TransactionStatus.PENDING,
	})
	status: TransactionStatus;

	@Column({ type: 'varchar', nullable: true })
	transactionRef: string | null;

	// relations
	@ManyToOne(() => User)
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => UserSubscription)
	@JoinColumn({ name: 'subscription_id' })
	subscription: UserSubscription;
}
