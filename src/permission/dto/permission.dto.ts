// src/permissions/dto/permission.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';

export class CreatePermissionDto {
	@IsNotEmpty()
	action: string;

	@IsNotEmpty()
	resource: string;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

export class GetListPermissionDto extends BaseQueryDto {}
