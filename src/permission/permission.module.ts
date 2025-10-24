import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmUtilsModule } from 'src/orm-utils/orm-utils.module';
import { Permission } from './entities/permission.entity';
import { PermissionsController } from './permission.controller';
import { PermissionQueryService } from './services/permission.query.service';
import { PermissionsService } from './services/permission.service';

@Module({
	imports: [TypeOrmModule.forFeature([Permission]), OrmUtilsModule],
	controllers: [PermissionsController],
	providers: [PermissionsService, PermissionQueryService],
})
export class PermissionModule {}
