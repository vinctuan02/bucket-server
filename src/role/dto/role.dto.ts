// src/roles/dto/role.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';
import { RoleFieldOrder } from '../enum/role.enum';

export class CreateRoleDto {
	@IsNotEmpty()
	name: string;

	@IsOptional()
	description?: string;

	@IsOptional()
	rolePermissions: {
		permissionId: string;
	}[] = [];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class GetListRoleDto extends BaseQueryDto {
	@IsEnum(RoleFieldOrder)
	@IsOptional()
	fieldOrder: RoleFieldOrder = RoleFieldOrder.NAME;
}
