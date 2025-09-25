import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from './entities/role-permission.entity';
import { RolePermissionService } from './role-permission.service';

@Module({
	imports: [TypeOrmModule.forFeature([RolePermission])],
	providers: [RolePermissionService],
	exports: [RolePermissionService],
})
export class RolePermissionModule {}
