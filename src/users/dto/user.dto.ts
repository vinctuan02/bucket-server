import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';

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

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class GetListUserDto extends BaseQueryDto {}
