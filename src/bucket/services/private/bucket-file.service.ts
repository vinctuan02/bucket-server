import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from '../../entities/bucket-file.entity';
import { Repository } from 'typeorm';
import { PageDto, ResponseError } from 'src/common/dto/common.response-dto';
import { BucketDto, GetListFileBucketDto } from 'src/bucket/dto/bucket.dto';
import { BucketFileQueryService } from './bucket-file.query.service';

@Injectable()
export class BucketFileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly bucketFileRepo: Repository<FileEntity>,

    private readonly bucketFileQueryService: BucketFileQueryService,
  ) {}

  async create(data: Partial<FileEntity>): Promise<FileEntity> {
    const file = this.bucketFileRepo.create(data);
    return this.bucketFileRepo.save(file);
  }

  async getList(query: GetListFileBucketDto): Promise<PageDto<FileEntity>> {
    const { page, pageSize } = query;

    const { items, totalItems } =
      await this.bucketFileQueryService.getList(query);
    return new PageDto({
      items,
      metadata: { totalItems, pageSize, currentPage: page },
    });
  }

  async findOne(id: string): Promise<FileEntity> {
    const file = await this.bucketFileRepo.findOne({ where: { id } });
    if (!file) {
      throw new ResponseError({ message: `File with id ${id} not found` });
    }
    return file;
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.bucketFileRepo.delete(id);
  }
}
