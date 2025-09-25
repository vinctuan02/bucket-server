import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionsController } from './permission.controller';
import { PermissionQueryService } from './services/permission.query.service';
import { PermissionsService } from './services/permission.service';

@Module({
	imports: [TypeOrmModule.forFeature([Permission])],
	controllers: [PermissionsController],
	providers: [PermissionsService, PermissionQueryService],
})
export class PermissionModule {}
