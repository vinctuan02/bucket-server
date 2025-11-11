import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BucketModule } from 'src/bucket/bucket.module';
import { FileNodePermissionModule } from 'src/file-node-permission/file-node-permission.module';
import { OrmUtilsModule } from 'src/orm-utils/orm-utils.module';
import { UserStorageModule } from 'src/user-storage/user-storage.module';
import { FileNode } from './entities/file-node.entity';
import { FileManagerController } from './file-node.controller';
import { FileManagerService } from './file-node.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([FileNode]),
		OrmUtilsModule,
		BucketModule,
		UserStorageModule,
		FileNodePermissionModule,
	],
	controllers: [FileManagerController],
	providers: [FileManagerService],
	exports: [FileManagerService],
})
export class FileNodeModule {}
