import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { Column, Entity } from 'typeorm';

@Entity('app_config')
export class AppConfig extends BaseUUIDEntity {
	@Column({ type: 'varchar', length: 255, unique: true })
	key: string;

	@Column({ type: 'text' })
	value: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	type: string;

	@Column({ type: 'text', nullable: true })
	description: string;
}
