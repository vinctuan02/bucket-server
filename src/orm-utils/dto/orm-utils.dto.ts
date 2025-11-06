import { BaseQueryDto } from 'src/common/dto/common.query-dto';

export class OrmFilterDto extends BaseQueryDto {
	keywordsUser?: string[];
	keywordsPermission?: string[];
	keywordsRole?: string[];
	keywordsFileNode?: string[];

	fileNodeParentId?: string;
	fileNodeIsDelete?: boolean;

	constructor(partial?: Partial<OrmFilterDto>) {
		super();
		Object.assign(this, partial);
	}
}
