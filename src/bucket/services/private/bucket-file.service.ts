import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { GetListFileBucketDto } from 'src/bucket/dto/bucket.dto';
import { PageDto, ResponseError } from 'src/common/dto/common.response-dto';
import { Repository } from 'typeorm';
import { FileBucket } from '../../entities/bucket-file.entity';
import { BucketFileQueryService } from './bucket-file.query.service';

@Injectable()
export class BucketFileService {
	private MINIO_BUCKET: string;

	constructor(
		@InjectRepository(FileBucket)
		private readonly bucketFileRepo: Repository<FileBucket>,

		private readonly bucketFileQueryService: BucketFileQueryService,
		private readonly configService: ConfigService,
	) {
		this.MINIO_BUCKET =
			this.configService.get<string>('MINIO_BUCKET') ?? '';
	}

	async create(data: Partial<FileBucket>): Promise<FileBucket> {
		const file = this.bucketFileRepo.create({
			...data,
			bucket: data.bucket ?? this.MINIO_BUCKET,
		});
		return this.bucketFileRepo.save(file);
	}

	async getList(query: GetListFileBucketDto): Promise<PageDto<FileBucket>> {
		const { page, pageSize } = query;

		const { items, totalItems } =
			await this.bucketFileQueryService.getList(query);
		return new PageDto({
			items,
			metadata: { totalItems, pageSize, page },
		});
	}

	async findOne(id: string): Promise<FileBucket> {
		const file = await this.bucketFileRepo.findOne({ where: { id } });
		if (!file) {
			throw new ResponseError({
				message: `File with id ${id} not found`,
			});
		}
		return file;
	}

	async delete(id: string): Promise<void> {
		await this.findOne(id);
		await this.bucketFileRepo.delete(id);
	}
}
