import {
	BeforeInsert,
	Column,
	CreateDateColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

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

	// @ManyToOne(() => User)
	// @JoinColumn({ name: 'creator_id' })
	// creator: User;

	// @ManyToOne(() => User)
	// @JoinColumn({ name: 'modifier_id' })
	// modifier: User;

	@BeforeInsert()
	setDefault() {
		this.creatorId = this.creatorId || process.env.DEFAULT_USER_ID!;
		this.modifierId = this.modifierId || process.env.DEFAULT_USER_ID!;
	}
}
