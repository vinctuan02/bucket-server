import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ShareType } from '../enum/file-node-permission.enum';

export class UpsertFileNodePermissionDto {
	@IsOptional()
	@IsUUID()
	fileNodeId: string;

	@IsUUID()
	@IsOptional()
	userId?: string | null; // null nếu public

	@IsBoolean()
	@IsOptional()
	canView?: boolean = true;

	@IsBoolean()
	@IsOptional()
	canEdit?: boolean = false;

	@IsBoolean()
	@IsOptional()
	canDelete?: boolean = false;

	@IsBoolean()
	@IsOptional()
	canUpload?: boolean = false;

	@IsBoolean()
	@IsOptional()
	canShare?: boolean = false;

	@IsEnum(ShareType)
	@IsOptional()
	shareType?: ShareType = ShareType.DIRECT;

	@IsUUID()
	@IsOptional()
	inheritedFrom?: string | null;
}

export class UpdateFileNodePermissionDto {
	@IsBoolean()
	@IsOptional()
	canView?: boolean;

	@IsBoolean()
	@IsOptional()
	canEdit?: boolean;

	@IsBoolean()
	@IsOptional()
	canDelete?: boolean;

	@IsBoolean()
	@IsOptional()
	canUpload?: boolean;

	@IsBoolean()
	@IsOptional()
	canShare?: boolean;
}

export class GetEffectivePermissionDto {
	@IsUUID()
	fileNodeId: string;

	@IsUUID()
	userId: string;
}
