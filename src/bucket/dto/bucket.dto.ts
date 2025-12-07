import { Type } from 'class-transformer';
import {
	IsBoolean,
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
import { FileBucket } from '../entities/bucket-file.entity';
import { UploadPurpose } from '../enum/bucket.enum';

export type BucketDto = Partial<FileBucket> & {
	uploadUrl?: string;
	downloadUrl?: string;
	readUrl?: string;
	keyMap?: string;
};

export class ObjectFileBucket {
	key: string;
	bucket?: string;
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

	@IsNumber()
	@Min(0)
	fileSize: number;

	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	contentType: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(10)
	extension: string;

	@IsOptional()
	keyMap?: string;

	// @IsOptional()
	// bucket?: string;

	@IsNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => FolderBucket)
	folderBucket: FolderBucket;

	@IsOptional()
	@IsBoolean()
	isSubmitted?: boolean;

	@IsOptional()
	isPublic?: boolean = false;
}

export class GetListFileBucketDto extends BaseQueryDto {}
