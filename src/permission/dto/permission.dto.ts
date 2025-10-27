// src/permissions/dto/permission.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';
import { PermissionAction, PermissionFM } from '../enums/permission.enum';

export class CreatePermissionDto {
	@IsNotEmpty()
	name: string;

	@IsOptional()
	description?: string;

	@IsNotEmpty()
	@IsEnum(PermissionAction)
	action: PermissionAction;

	@IsNotEmpty()
	resource: string;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

export class GetListPermissionDto extends BaseQueryDto {
	@IsOptional()
	@IsEnum(PermissionFM)
	fieldOrder: PermissionFM = PermissionFM.NAME;
}
