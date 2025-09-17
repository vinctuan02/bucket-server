// src/users/entities/user.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ unique: true })
	email: string;

	@Column()
	password: string;

	@Column({ default: true })
	isActive: boolean;

	@Column({ nullable: true })
	fullName?: string;
}
