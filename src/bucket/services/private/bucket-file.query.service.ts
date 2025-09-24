import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GetListFileBucketDto } from 'src/bucket/dto/bucket.dto';
import { FileEntity } from 'src/bucket/entities/bucket-file.entity';
import { Repository } from 'typeorm';
import { SelectQueryBuilder } from 'typeorm/browser';

@Injectable()
export class BucketFileQueryService {
	constructor(
		@InjectRepository(FileEntity)
		private readonly bucketFileRepo: Repository<FileEntity>,
	) {}

	private createBaseQuery() {
		const qb = this.bucketFileRepo.createQueryBuilder('file');
		return qb;
	}

	private addFilter(
		filter: GetListFileBucketDto,
		qb: SelectQueryBuilder<FileEntity>,
	) {
		const { keyword } = filter;
	}

	private createQueryGetList(filter: GetListFileBucketDto) {
		const qb = this.createBaseQuery();
		this.addFilter(filter, qb);
		return qb;
	}

	async getList(filter: GetListFileBucketDto) {
		const qb = this.createQueryGetList(filter);
		const [items, totalItems] = await qb.getManyAndCount();
		return { items, totalItems };
	}
}
