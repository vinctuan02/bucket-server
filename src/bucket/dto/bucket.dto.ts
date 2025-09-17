import { Type } from 'class-transformer';
import {
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	ValidateNested,
} from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/common.query-dto';
import { FileEntity } from '../entities/bucket-file.entity';
import { UploadPurpose } from '../enum/bucket.enum';

export type BucketDto = Partial<FileEntity> & {
	uploadUrl?: string;
	downloadUrl?: string;
	readUrl?: string;
	keyMap?: string;
};

export class ObjectFileBucket {
	key: string;
	bucket: string;
	expiry?: number = 3600;
}

class FolderBucket {
	@IsNotEmpty()
	@IsEnum(UploadPurpose)
	uploadPurpose: UploadPurpose;
}

export class GetUploadUrlDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	fileName: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(30)
	contentType: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(10)
	extension: string;

	@IsNumber()
	@Min(0)
	fileSize: number;

	@IsNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => FolderBucket)
	folderBucket: FolderBucket;

	@IsOptional()
	keyMap?: string;

	@IsNotEmpty()
	bucket: string;
}

export class GetListFileBucketDto extends BaseQueryDto {}
