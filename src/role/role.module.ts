import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermissionModule } from 'src/role-permission/role-permission.module';
import { Role } from './entities/role.entity';
import { RolesController } from './role.controller';
import { RoleQueryService } from './services/role.query.service';
import { RolesService } from './services/role.service';

@Module({
	imports: [TypeOrmModule.forFeature([Role]), RolePermissionModule],
	controllers: [RolesController],
	providers: [RolesService, RoleQueryService],
})
export class RoleModule {}
