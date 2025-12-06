import { BaseQueryDto } from 'src/common/dto/common.query-dto';
import {
	PermissionAction,
	Resource,
} from 'src/permission/enums/permission.enum';

export class OrmFilterDto extends BaseQueryDto {
	keywordsUser?: string[];
	keywordsPermission?: string[];
	keywordsRole?: string[];
	keywordsFileNode?: string[];
	keywordsPlan?: string[];

	fileNodeParentId?: string;
	fileNodeIsDelete?: boolean;
	fileNodeId?: string;

	permissionActions?: PermissionAction[];
	resources?: Resource[];

	constructor(partial?: Partial<OrmFilterDto>) {
		super();
		Object.assign(this, partial);
	}
}
