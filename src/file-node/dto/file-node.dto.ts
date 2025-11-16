import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
	@ApiProperty({ example: 'My Folder', description: 'Folder name' })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiPropertyOptional({
		example: 'uuid',
		description: 'Parent folder ID (UUID)',
	})
	@IsOptional()
	@IsUUID()
	fileNodeParentId?: string;
}

export class UpdateFolderDto extends PartialType(CreateFolderDto) {}

class FileMetadata {
	@ApiProperty({ example: 'document.pdf', description: 'Original file name' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	fileName: string;

	@ApiProperty({ example: 1024000, description: 'File size in bytes' })
	@IsNumber()
	@Min(0)
	fileSize: number;

	@ApiProperty({ example: 'application/pdf', description: 'MIME type' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	contentType: string;

	@ApiProperty({ example: 'pdf', description: 'File extension' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(10)
	extension: string;
}

export class CreateFileDto {
	@ApiProperty({ example: 'document.pdf', description: 'File name' })
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiPropertyOptional({
		example: 'uuid',
		description: 'Parent folder ID (UUID)',
	})
	@IsOptional()
	@IsUUID()
	fileNodeParentId?: string;

	@ApiProperty({ type: FileMetadata, description: 'File metadata' })
	@ValidateNested()
	@Type(() => FileMetadata)
	fileMetadata: FileMetadata;
}

export class GetListFileNodeDto extends BaseQueryDto {
	@ApiPropertyOptional({
		example: 'uuid',
		description: 'Filter by parent folder ID',
	})
	@IsOptional()
	@IsUUID()
	fileNodeParentId?: string;

	@ApiPropertyOptional({ example: 'name', description: 'Sort field' })
	@IsOptional()
	fieldOrder: FileNodeFM = FileNodeFM.name;

	@ApiPropertyOptional({
		example: 'ASC',
		description: 'Sort direction (ASC/DESC)',
	})
	@IsOptional()
	orderBy: OrderDirection = OrderDirection.ASC;

	@ApiPropertyOptional({
		example: false,
		description: 'Include deleted items',
	})
	@IsOptional()
	isDelete?: boolean;
}

export class BulkUpdateFileNodePermissionDto {
	@ApiPropertyOptional({
		type: [UpsertFileNodePermissionDto],
		description: 'Permissions to add/update',
	})
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpsertFileNodePermissionDto)
	upsert?: UpsertFileNodePermissionDto[];

	@ApiPropertyOptional({
		type: [String],
		description: 'Permission IDs to remove',
	})
	@IsArray()
	@IsUUID('all', { each: true })
	@IsOptional()
	remove?: string[];
}
