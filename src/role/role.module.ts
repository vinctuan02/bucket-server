import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmUtilsModule } from 'src/orm-utils/orm-utils.module';
import { RolePermissionModule } from 'src/role-permission/role-permission.module';
import { Role } from './entities/role.entity';
import { RolesController } from './role.controller';
import { RoleQueryService } from './services/role.query.service';
import { RolesService } from './services/role.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Role]),
		OrmUtilsModule,
		RolePermissionModule,
	],
	controllers: [RolesController],
	providers: [RolesService, RoleQueryService],
})
export class RoleModule {}
