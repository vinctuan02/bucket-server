import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsOptional,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';
import { ShareType } from '../enum/share.enum';
import { ShareFm } from '../fm/share.fm';

export class SharePermissionItemDto {
	@IsUUID()
	userId: string;

	@IsOptional()
	@IsBoolean()
	canView?: boolean;

	@IsOptional()
	@IsBoolean()
	canEdit?: boolean;

	@IsOptional()
	@IsBoolean()
	canDelete?: boolean;

	@IsOptional()
	@IsBoolean()
	canUpload?: boolean;

	@IsOptional()
	@IsBoolean()
	canShare?: boolean;
}

export class CreateShareDto {
	@IsUUID()
	fileNodeId: string;

	@IsEnum(ShareType)
	type: ShareType;

	@IsOptional()
	expiresAt?: Date;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SharePermissionItemDto)
	sharedTo: SharePermissionItemDto[];
}

export class GetListShareDto extends BaseQueryDto {
	@IsUUID()
	@IsOptional()
	fileNodeId?: string;

	@IsEnum(ShareFm)
	fieldOrder: ShareFm = ShareFm.createdAt;
}
