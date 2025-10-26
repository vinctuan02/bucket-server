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

	@IsNotEmpty()
	@MinLength(6)
	password: string;

	@IsNotEmpty()
	name: string;

	@IsOptional()
	userRoles: {
		roleId: string;
	}[] = [];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}

export class GetListUserDto extends BaseQueryDto {
	@IsOptional()
	@IsEnum(UserFieldOrder)
	fieldOrder: UserFieldOrder = UserFieldOrder.NAME;
}
