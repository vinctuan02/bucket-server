import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BucketController } from './bucket.controller';
import { FileBucket } from './entities/bucket-file.entity';
import { BucketService } from './services/bucket.service';
import { BucketFileQueryService } from './services/private/bucket-file.query.service';
import { BucketFileService } from './services/private/bucket-file.service';
import { BucketMinioService } from './services/private/bucket-minio.service';

@Module({
	imports: [TypeOrmModule.forFeature([FileBucket])],
	providers: [
		BucketService,
		BucketMinioService,
		BucketFileService,
		BucketFileQueryService,
	],
	exports: [BucketService],
	controllers: [BucketController],
})
export class BucketModule {}
