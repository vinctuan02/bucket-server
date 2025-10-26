import { BaseQueryDto } from 'src/common/dto/common.query-dto';

export class OrmFilterDto extends BaseQueryDto {
	keywordsPermission?: string[];
	keywordsRole?: string[];

	constructor(partial?: Partial<OrmFilterDto>) {
		super();
		Object.assign(this, partial);
	}
}
