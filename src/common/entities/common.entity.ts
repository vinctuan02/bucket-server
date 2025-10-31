import { UserRole } from 'src/user-role/entities/user-role.entity';
import {
	BeforeInsert,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserBase {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column({ unique: true })
	email: string;

	@Column({ type: 'varchar', nullable: true })
	password: string | null;

	@Column({ type: 'varchar', nullable: true })
	avatar: string | null;

	@Column({ type: 'varchar', nullable: true })
	provider: string | null;

	@Column({ type: 'varchar', nullable: true })
	providerId: string | null;

	// @OneToMany(() => UserRole, (userRole) => userRole.user)
	userRoles: UserRole[];

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt: Date;

	@Column({ type: 'uuid' })
	creatorId: string;

	@Column({ type: 'uuid' })
	modifierId: string;

	@ManyToOne(() => UserBase)
	@JoinColumn({ name: 'creator_id' })
	creator: UserBase;

	@ManyToOne(() => UserBase)
	@JoinColumn({ name: 'modifier_id' })
	modifier: UserBase;
}

export abstract class BaseUUIDEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt: Date;
}

export abstract class BaseUserUUIDEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt: Date;

	@Column({ type: 'uuid' })
	creatorId: string;

	@Column({ type: 'uuid' })
	modifierId: string;

	@ManyToOne(() => UserBase)
	@JoinColumn({ name: 'creator_id' })
	creator: UserBase;

	@ManyToOne(() => UserBase)
	@JoinColumn({ name: 'modifier_id' })
	modifier: UserBase;

	@BeforeInsert()
	setDefault() {
		this.creatorId = this.creatorId || process.env.DEFAULT_USER_ID!;
		this.modifierId = this.modifierId || process.env.DEFAULT_USER_ID!;
	}
}
