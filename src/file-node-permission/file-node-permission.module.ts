import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileNodePermission } from './entities/file-node-permission.entity';
import { FileNodePermissionController } from './file-node-permission.controller';
import { FileNodePermissionService } from './file-node-permission.service';

@Module({
	imports: [TypeOrmModule.forFeature([FileNodePermission])],
	providers: [FileNodePermissionService],
	controllers: [FileNodePermissionController],
	exports: [FileNodePermissionService],
})
export class FileNodePermissionModule {}
