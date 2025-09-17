import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PageDto } from 'src/common/dto/common.response-dto';
import { generateFileNameWithTimestamp } from 'src/common/util/common.util';
import { folderMap } from '../constant/bucket.constant';
import {
	BucketDto,
	GetListFileBucketDto,
	GetUploadUrlDto,
} from '../dto/bucket.dto';
import { BucketFileService } from './private/bucket-file.service';
import { BucketMinioService } from './private/bucket-minio.service';

@Injectable()
export class BucketService {
	constructor(
		private readonly bucketMinioService: BucketMinioService,
		private readonly bucketFileService: BucketFileService,
	) {}

	async getUploadUrl(input: GetUploadUrlDto): Promise<BucketDto> {
		const { keyMap, folderBucket, bucket, fileName } = input;

		const key = this.getKey({
			previousKey: this.getPreviousKey(folderBucket),
			fileName: generateFileNameWithTimestamp(fileName),
		});

		const file = await this.bucketFileService.create({
			...input,
			key,
		});

		return {
			id: file.id,
			uploadUrl: await this.bucketMinioService.getUploadUrl({
				key,
				bucket,
			}),

			keyMap,
		};
	}

	async getReadUrl(id: string): Promise<BucketDto> {
		const file = await this.bucketFileService.findOne(id);
		const { bucket, key } = file;
		const readUrl = await this.bucketMinioService.getReadUrl({
			bucket,
			key,
		});

		return {
			id: file.id,
			readUrl,
		};
	}

	async getList(query: GetListFileBucketDto) {
		const { items, metadata } = await this.bucketFileService.getList(query);

		const mappedItems = await Promise.all(
			items.map(async (item) => ({
				...item,
				readUrl: await this.bucketMinioService.getReadUrlSafe({
					bucket: item.bucket,
					key: item.key,
				}),
			})),
		);

		return new PageDto({
			items: mappedItems,
			metadata,
		});
	}

	async getDownUrl(id: string): Promise<BucketDto> {
		const file = await this.bucketFileService.findOne(id);
		const downloadUrl = await this.bucketMinioService.getReadUrl(file);

		return {
			id: file.id,
			downloadUrl,
		};
	}

	async delete(id: string) {
		const file = await this.bucketFileService.findOne(id);
		await this.bucketMinioService.deleteFile(file);
		await this.bucketFileService.delete(id);
	}

	// helper
	private getKey({
		previousKey,
		fileName,
	}: {
		previousKey: string;
		fileName: string;
	}) {
		return `${previousKey}/${fileName}`;
	}

	private getPreviousKey({ uploadPurpose }: GetUploadUrlDto['folderBucket']) {
		const datePrefix = dayjs().format('YYYY_MM');
		const subFolder = folderMap[uploadPurpose];

		return `${datePrefix}/${subFolder}`;
	}
}
