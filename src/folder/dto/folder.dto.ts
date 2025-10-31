import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFolderDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsUUID()
	parentId?: string;
}

export class UpdateFolderDto extends PartialType(CreateFolderDto) {}
