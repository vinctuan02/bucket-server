import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
	ValidateNested,
} from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';
import { OrderDirection } from 'src/common/enums/common.enum';
import { UpsertFileNodePermissionDto } from 'src/file-node-permission/dto/file-node-permission.dto';
import { FileNodeFM } from '../fm/file-node.fm';

export class CreateFolderDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsUUID()
	fileNodeParentId?: string;
}

export class UpdateFolderDto extends PartialType(CreateFolderDto) {}

class FileMetadata {
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	fileName: string;

	@IsNumber()
	@Min(0)
	fileSize: number;

	@IsString()
	@IsNotEmpty()
	@MaxLength(30)
	contentType: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(10)
	extension: string;
}

export class CreateFileDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsUUID()
	fileNodeParentId?: string;

	@ValidateNested()
	@Type(() => FileMetadata)
	fileMetadata: FileMetadata;
}

export class GetListFileNodeDto extends BaseQueryDto {
	@IsOptional()
	@IsUUID()
	fileNodeParentId?: string;

	@IsOptional()
	fieldOrder: FileNodeFM = FileNodeFM.name;

	@IsOptional()
	orderBy: OrderDirection = OrderDirection.ASC;

	@IsOptional()
	isDelete?: boolean;
}

export class BulkUpdateFileNodePermissionDto {
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpsertFileNodePermissionDto)
	upsert?: UpsertFileNodePermissionDto[];

	@IsArray()
	@IsUUID('all', { each: true })
	@IsOptional()
	remove?: string[];
}
