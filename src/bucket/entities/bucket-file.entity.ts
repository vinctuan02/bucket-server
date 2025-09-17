import { BaseUUIDEntity } from 'src/common/entities/common.entity';
import { Column, Entity } from 'typeorm';

@Entity('files')
export class FileEntity extends BaseUUIDEntity {
	@Column({ type: 'boolean', default: false })
	isSubmitted: boolean;

	@Column({ type: 'varchar', length: 100 + 'YYYYMMDDHHmmss_'.length })
	fileName: string;

	@Column({ type: 'varchar', length: 200 })
	key: string;

	@Column({ type: 'varchar', length: 30 })
	contentType: string;

	@Column({ type: 'varchar', length: 10 })
	extension: string;

	@Column({ type: 'bigint', comment: 'store in bytes' })
	fileSize: number;

	@Column({ type: 'varchar', length: 30 })
	bucket: string;
}
