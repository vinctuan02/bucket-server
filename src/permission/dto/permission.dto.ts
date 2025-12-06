// src/permissions/dto/permission.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { StringToArrayString } from 'src/common/decorators/common.decorator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';
import {
	PermissionAction,
	PermissionFM,
	Resource,
} from '../enums/permission.enum';

export class CreatePermissionDto {
	@IsNotEmpty()
	name: string;

	@IsOptional()
	description?: string;

	@IsNotEmpty()
	@IsEnum(PermissionAction)
	action: PermissionAction;

	@IsNotEmpty()
	resource: Resource;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

export class GetListPermissionDto extends BaseQueryDto {
	@IsOptional()
	@IsEnum(PermissionFM)
	fieldOrder: PermissionFM = PermissionFM.NAME;

	@StringToArrayString()
	@IsOptional()
	// @IsEnum(PermissionAction)
	permissionActions?: PermissionAction[];

	@StringToArrayString()
	@IsOptional()
	// @IsEnum(Resource)
	resources?: Resource[];
}
