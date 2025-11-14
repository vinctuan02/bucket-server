import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileNode } from 'src/file-node/entities/file-node.entity';
import { FileNodePermission } from './entities/file-node-permission.entity';
import { FileNodePermissionController } from './file-node-permission.controller';
import { FileNodePermissionService } from './file-node-permission.service';

@Module({
	imports: [TypeOrmModule.forFeature([FileNode, FileNodePermission])],
	providers: [FileNodePermissionService],
	controllers: [FileNodePermissionController],
	exports: [FileNodePermissionService],
})
export class FileNodePermissionModule {}
