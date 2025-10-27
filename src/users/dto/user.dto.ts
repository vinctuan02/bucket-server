import { PartialType } from '@nestjs/mapped-types';
import {
	IsBoolean,
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	MinLength,
} from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';
import { UserFieldOrder } from '../enum/user.enum';

export class CreateUserDto {
	@IsEmail()
	email: string;

	@IsOptional()
	@MinLength(6)
	password?: string | null;

	@IsOptional()
	provider?: string | null;

	@IsOptional()
	providerId?: string | null;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsNotEmpty()
	name: string;

	@IsOptional()
	userRoles: {
		roleId: string;
	}[] = [];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class GetListUserDto extends BaseQueryDto {
	@IsOptional()
	@IsEnum(UserFieldOrder)
	fieldOrder: UserFieldOrder = UserFieldOrder.NAME;
}
