import { Module } from '@nestjs/common';
import { BucketService } from './services/bucket.service';
import { BucketMinioService } from './services/bucket-minio.service';

@Module({
  providers: [BucketService, BucketMinioService],
})
export class BucketModule {}
