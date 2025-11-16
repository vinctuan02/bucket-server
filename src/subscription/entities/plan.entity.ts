import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { Column, Entity } from 'typeorm';

@Entity('plans')
export class Plan extends BaseUUIDEntity {
	@Column({ type: 'varchar', length: 255 })
	name: string;

	@Column({ type: 'text', nullable: true })
	description: string | null;

	@Column({ type: 'bigint' })
	storageLimit: number;

	@Column({ type: 'decimal', precision: 12, scale: 2 })
	price: number;

	@Column({ type: 'int' })
	durationDays: number;

	@Column({ type: 'boolean', default: true })
	isActive: boolean;
}
